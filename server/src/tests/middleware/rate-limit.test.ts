import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { createUserRateLimiter, generalRateLimiter, aiRateLimiter } from '../../middleware/rate-limit.js';
import { AuthRequest } from '../../middleware/auth.js';

vi.mock('../../config/index.js', () => ({
  default: {
    rateLimit: {
      windowMs: 1000, // 1 second for testing
      max: 2, // Allow 2 requests
    },
    aiRateLimit: {
      windowMs: 1000,
      max: 1, // Allow 1 request
    },
  },
}));

describe('rate-limit middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      ip: '127.0.0.1',
    };
    res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('createUserRateLimiter', () => {
    it('allows requests within limit', () => {
      const limiter = createUserRateLimiter({
        windowMs: 1000,
        max: 2,
        keyPrefix: 'test',
      });

      limiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();

      limiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(2);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('rejects requests exceeding limit', () => {
      const limiter = createUserRateLimiter({
        windowMs: 1000,
        max: 2,
        keyPrefix: 'test2',
      });

      // Make 2 requests (within limit)
      limiter(req as Request, res as Response, next);
      limiter(req as Request, res as Response, next);

      // Third request should be rejected
      limiter(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        error: 'Too many requests. Please try again later.',
      });
    });

    it('uses user ID when authenticated', () => {
      const authReq = req as AuthRequest;
      authReq.user = { id: 'user-123' };

      const limiter = createUserRateLimiter({
        windowMs: 1000,
        max: 1,
        keyPrefix: 'user',
      });

      limiter(authReq, res as Response, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Same user, should be rate limited
      limiter(authReq, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it('falls back to IP when not authenticated', () => {
      const limiter = createUserRateLimiter({
        windowMs: 1000,
        max: 1,
        keyPrefix: 'ip',
      });

      limiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Same IP, should be rate limited
      limiter(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it('sets rate limit headers', () => {
      const limiter = createUserRateLimiter({
        windowMs: 1000,
        max: 5,
        keyPrefix: 'headers',
      });

      limiter(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 5);
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 4);
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
    });
  });

  describe('pre-configured limiters', () => {
    it('generalRateLimiter uses config values', () => {
      generalRateLimiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 2);
    });

    it('aiRateLimiter uses config values', () => {
      aiRateLimiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 1);
    });
  });
});
