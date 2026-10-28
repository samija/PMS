import 'reflect-metadata';
import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import connectDB from './config/database.js';
import { validateEnv } from './config/validateEnv.js';
import './config/passport.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { logger } from './config/logger.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { allQueues } from './infrastructure/queues/index.js';
import { initPaymentReminderJob } from './jobs/paymentReminders.js';
import { initPaymentGenerationJob } from './jobs/paymentGeneration.js';
import { initPaymentNotificationsJob } from './jobs/paymentNotifications.js';
import { initNotificationCleanupJob } from './jobs/notificationCleanup.js';
import { setupSwagger } from './config/swagger.js';
import { container } from './config/container.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Request logging middleware (early in chain)
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

// Middleware
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5000',
      ...(process.env.NODE_ENV !== 'production' ? [/^http:\/\/localhost:\d+$/] : []),
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// NoSQL injection protection
app.use(mongoSanitize());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup Swagger documentation (dev/staging only)
if (process.env.NODE_ENV !== 'production') {
  setupSwagger(app);
}

// API routes
app.use('/api/auth', authLimiter);
app.use('/api', limiter, routes);

// Error handler
app.use(errorHandler);

// Serve client static files in production
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ success: false, message: 'Route not found' });
    return;
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Start server
const startServer = async () => {
  try {
    validateEnv();
    await connectDB();

    // Connect Redis (non-blocking)
    await connectRedis();

    // DI Container is initialized on import
    logger.info('DI Container initialized with bindings');

    // Initialize cron jobs
    initPaymentReminderJob();
    initPaymentGenerationJob();
    initPaymentNotificationsJob();
    initNotificationCleanupJob();

    // Initialize queue processors
    try {
      const { processEmailJob } = await import('./infrastructure/queues/processors/emailProcessor.js');
      const { processPaymentJob } = await import('./infrastructure/queues/processors/paymentProcessor.js');
      const { processNotificationJob } = await import('./infrastructure/queues/processors/notificationProcessor.js');
      const { processReportJob } = await import('./infrastructure/queues/processors/reportProcessor.js');

      const { emailQueue, paymentQueue, notificationQueue, reportQueue } =
        await import('./infrastructure/queues/index.js');
      emailQueue.process(processEmailJob);
      paymentQueue.process(processPaymentJob);
      notificationQueue.process(processNotificationJob);
      reportQueue.process(processReportJob);
      logger.info('Bull queue processors initialized');
    } catch (err) {
      logger.warn('Bull queues not available (Redis may be offline)', { error: err });
    }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error });
    process.exit(1);
  }
};

// Export container for use in other modules
export { container };

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  try {
    await Promise.all(allQueues.map((q) => q.close()));
    logger.info('All queues closed');
  } catch (err) {
    logger.warn('Error closing queues', { error: err });
  }
  try {
    await disconnectRedis();
  } catch (err) {
    logger.warn('Error disconnecting Redis', { error: err });
  }
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (err) {
    logger.warn('Error closing MongoDB connection', { error: err });
  }
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Process-level error handlers
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection', { error: reason });
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error });
  gracefulShutdown('uncaughtException');
});

startServer();

export default app;
