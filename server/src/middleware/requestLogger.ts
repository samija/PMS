import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.js';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

const SKIP_PATHS = ['/health', '/api/health'];

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  if (SKIP_PATHS.includes(req.path)) {
    next();
    return;
  }

  const requestId = uuidv4();
  req.requestId = requestId;
  const startTime = Date.now();

  logger.http('Incoming request', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
    logger.log(logLevel, 'Request completed', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
    });
  });

  next();
};

export default requestLogger;
