import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../application/services/CacheService.js';

export const cacheMiddleware = (ttlSeconds: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    // Generate cache key from method + url + userId
    const userId = (req as any).user?._id?.toString() || 'anonymous';
    const cacheKey = `route:${userId}:${req.method}:${req.originalUrl}`;

    try {
      const cached = await cacheService.get<{ statusCode: number; body: any }>(cacheKey);
      if (cached) {
        res.status(cached.statusCode).json(cached.body);
        return;
      }
    } catch {
      // Cache miss or error, continue to handler
    }

    // Monkey-patch res.json to capture and cache the response
    const originalJson = res.json.bind(res);
    res.json = ((body: any) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(cacheKey, { statusCode: res.statusCode, body }, ttlSeconds).catch(() => {});
      }
      return originalJson(body);
    }) as any;

    next();
  };
};

export default cacheMiddleware;
