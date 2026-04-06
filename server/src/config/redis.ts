import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
};

let redis: Redis | null = null;

export const getRedisClient = (): Redis | null => {
  if (!redis) {
    try {
      redis = new Redis(redisConfig);

      redis.on('connect', () => {
        console.log('[Redis] Connected successfully');
      });

      redis.on('error', (err) => {
        console.warn('[Redis] Connection error (non-fatal):', err.message);
      });

      redis.on('reconnecting', () => {
        console.log('[Redis] Reconnecting...');
      });
    } catch (err) {
      console.warn('[Redis] Failed to create client (non-fatal):', err);
      redis = null;
    }
  }
  return redis;
};

export const connectRedis = async (): Promise<void> => {
  const client = getRedisClient();
  if (client) {
    try {
      await client.connect();
    } catch (err) {
      console.warn('[Redis] Could not connect (non-fatal). App will work without cache.');
      redis = null;
    }
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redis) {
    try {
      await redis.quit();
    } catch {
      // ignore
    }
    redis = null;
  }
};

export default getRedisClient;
