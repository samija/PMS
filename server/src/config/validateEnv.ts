import { logger } from './logger.js';

interface EnvVarDefinition {
  name: string;
  description: string;
}

const REQUIRED_ENV_VARS: EnvVarDefinition[] = [
  { name: 'MONGODB_URI', description: 'MongoDB connection string' },
  { name: 'JWT_SECRET', description: 'Secret key for signing JWT tokens' },
  { name: 'IDENTITY_ENCRYPTION_KEY', description: 'Key for encrypting sensitive identity data' },
  { name: 'FRONTEND_URL', description: 'Frontend application URL (used for CORS and email links)' },
];

const RECOMMENDED_ENV_VARS: EnvVarDefinition[] = [
  { name: 'CHAPA_SECRET_KEY', description: 'Chapa payment gateway secret key' },
  { name: 'CLOUDINARY_CLOUD_NAME', description: 'Cloudinary cloud name for media uploads' },
  { name: 'CLOUDINARY_API_KEY', description: 'Cloudinary API key for media uploads' },
  { name: 'CLOUDINARY_API_SECRET', description: 'Cloudinary API secret for media uploads' },
  { name: 'REDIS_URL', description: 'Redis connection URL for caching and queues' },
];

export function validateEnv(): void {
  const missing: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar.name]) {
      missing.push(`  - ${envVar.name}: ${envVar.description}`);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Server startup failed: missing required environment variables:\n${missing.join('\n')}\n` +
        'Please set these variables in your .env file or environment before starting the server.'
    );
  }

  for (const envVar of RECOMMENDED_ENV_VARS) {
    if (!process.env[envVar.name]) {
      logger.warn(`Missing recommended environment variable: ${envVar.name} — ${envVar.description}`);
    }
  }

  logger.info('Environment variable validation passed');
}
