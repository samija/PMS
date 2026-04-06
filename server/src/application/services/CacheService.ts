import { getRedisClient } from '../../config/redis.js';

const KEY_PREFIX = 'enderase:';
const DEFAULT_TTL = 300; // 5 minutes

export class CacheService {
  private getClient() {
    return getRedisClient();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = this.getClient();
      if (!client) return null;
      const data = await client.get(`${KEY_PREFIX}${key}`);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = DEFAULT_TTL): Promise<void> {
    try {
      const client = this.getClient();
      if (!client) return;
      await client.setex(`${KEY_PREFIX}${key}`, ttlSeconds, JSON.stringify(value));
    } catch {
      // Cache write failure is non-fatal
    }
  }

  async del(key: string): Promise<void> {
    try {
      const client = this.getClient();
      if (!client) return;
      await client.del(`${KEY_PREFIX}${key}`);
    } catch {
      // ignore
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const client = this.getClient();
      if (!client) return;
      const stream = client.scanStream({ match: `${KEY_PREFIX}${pattern}`, count: 100 });
      const pipeline = client.pipeline();
      let count = 0;

      for await (const keys of stream) {
        for (const key of keys as string[]) {
          pipeline.del(key);
          count++;
        }
      }

      if (count > 0) await pipeline.exec();
    } catch {
      // ignore
    }
  }

  async flush(): Promise<void> {
    try {
      const client = this.getClient();
      if (!client) return;
      await this.delPattern('*');
    } catch {
      // ignore
    }
  }

  // Domain-specific invalidation helpers
  async invalidateProperty(propertyId: string): Promise<void> {
    await this.delPattern(`property:${propertyId}*`);
    await this.delPattern('properties:*');
    await this.delPattern('listings:*');
  }

  async invalidateUser(userId: string): Promise<void> {
    await this.delPattern(`user:${userId}*`);
  }

  async invalidateTenant(tenantId: string): Promise<void> {
    await this.delPattern(`tenant:${tenantId}*`);
    await this.delPattern('tenants:*');
  }

  async invalidatePayments(propertyId: string): Promise<void> {
    await this.delPattern(`payments:${propertyId}*`);
    await this.delPattern('payment-stats:*');
  }
}

export const cacheService = new CacheService();
export default cacheService;
