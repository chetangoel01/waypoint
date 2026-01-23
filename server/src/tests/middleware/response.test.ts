import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { success, error, ApiError, notFound, validationError, errorHandler, asyncHandler } from '../../middleware/response.js';
import { logger } from '../../utils/logger.js';

vi.mock('../../utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('../../config/index.js', () => ({
  default: {
    isDevelopment: false,
  },
}));

describe('response helpers', () => {
  describe('success', () => {
    it('returns success response with data', () => {
      const result = success({ id: 1, name: 'Test' });
      expect(result).toEqual({
        success: true,
        data: { id: 1, name: 'Test' },
        error: null,
      });
    });

    it('handles null data', () => {
      const result = success(null);
      expect(result).toEqual({
        success: true,
        data: null,
        error: null,
      });
    });
  });

  describe('error', () => {
    it('returns error response', () => {
      const result = error('Something went wrong');
      expect(result).toEqual({
        success: false,
        data: null,
        error: 'Something went wrong',
      });
    });
  });

  describe('ApiError', () => {
    it('creates error with default status 400', () => {
      const err = new ApiError('Bad request');
      expect(err.message).toBe('Bad request');
      expect(err.status).toBe(400);
      expect(err.name).toBe('ApiError');
    });

    it('creates error with custom status', () => {
      const err = new ApiError('Not found', 404);
      expect(err.status).toBe(404);
    });
  });

  describe('notFound', () => {
    it('throws ApiError with 404 status', () => {
      expect(() => notFound('User')).toThrow(ApiError);
      try {
        notFound('User');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(404);
        expect((err as ApiError).message).toBe('User not found');
      }
    });
  });

  describe('validationError', () => {
    it('throws ApiError with 400 status', () => {
      expect(() => validationError('Invalid input')).toThrow(ApiError);
      try {
        validationError('Invalid input');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(400);
        expect((err as ApiError).message).toBe('Invalid input');
      }
    });
  });
});

describe('errorHandler middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  it('handles ApiError with custom status', () => {
    const err = new ApiError('Not found', 404);
    errorHandler(err, req as Request, res as Response, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: 'Not found',
    });
    expect(logger.error).toHaveBeenCalled();
  });

  it('handles generic Error with status 500', () => {
    const err = new Error('Internal error');
    errorHandler(err, req as Request, res as Response, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    });
    expect(logger.error).toHaveBeenCalled();
  });

  it('sanitizes unsafe error messages in production', () => {
    const err = new Error('Database connection failed: password123');
    errorHandler(err, req as Request, res as Response, vi.fn());

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    });
  });

  it('allows safe error messages', () => {
    const err = new Error('Resource not found');
    errorHandler(err, req as Request, res as Response, vi.fn());

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: 'Resource not found',
    });
  });
});

describe('asyncHandler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {};
    next = vi.fn() as unknown as NextFunction;
  });

  it('passes through successful handler', async () => {
    const handler = vi.fn((_req, _res, _next) => {
      _next();
    });
    const wrapped = asyncHandler(handler);

    await wrapped(req as Request, res as Response, next);

    expect(handler).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('catches and forwards errors', async () => {
    const error = new Error('Handler error');
    const handler = vi.fn(async () => {
      throw error;
    });
    const wrapped = asyncHandler(handler);

    await wrapped(req as Request, res as Response, next);

    expect(handler).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });

  it('handles async errors', async () => {
    const error = new Error('Async error');
    const handler = vi.fn(async () => {
      throw error;
    });
    const wrapped = asyncHandler(handler);

    await wrapped(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
