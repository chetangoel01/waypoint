import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import config from '../config/index.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

/**
 * Create a user-based rate limiter.
 * Uses user ID if authenticated, falls back to IP address.
 */
export function createUserRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, keyPrefix = 'rl' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    // Use user ID if authenticated, otherwise use IP
    const identifier = authReq.user?.id || req.ip || 'unknown';
    const key = `${keyPrefix}:${identifier}`;

    const now = Date.now();
    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      // Create new entry
      entry = {
        count: 1,
        resetAt: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    } else {
      entry.count++;
    }

    // Set rate limit headers
    const remaining = Math.max(0, max - entry.count);
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (entry.count > max) {
      res.status(429).json({
        success: false,
        data: null,
        error: 'Too many requests. Please try again later.',
      });
      return;
    }

    next();
  };
}

// Pre-configured rate limiters
export const generalRateLimiter = createUserRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  keyPrefix: 'general',
});

export const aiRateLimiter = createUserRateLimiter({
  windowMs: config.aiRateLimit.windowMs,
  max: config.aiRateLimit.max,
  keyPrefix: 'ai',
});
