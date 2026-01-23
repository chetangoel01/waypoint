import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams } from '../../middleware/validate.js';
import { ApiError } from '../../middleware/response.js';

describe('validate middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
    };
    res = {};
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('validateBody', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().int().positive(),
    });

    it('validates and parses valid body', () => {
      req.body = { name: 'John', age: 30 };
      const validator = validateBody(schema);

      validator(req as Request, res as Response, next);

      expect(req.body).toEqual({ name: 'John', age: 30 });
      expect(next).toHaveBeenCalledWith();
    });

    it('rejects invalid body with validation errors', () => {
      req.body = { name: '', age: -5 };
      const validator = validateBody(schema);

      validator(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (next as any).mock.calls[0][0] as ApiError;
      expect(error.status).toBe(400);
      expect(error.message).toContain('name');
    });

    it('rejects missing required fields', () => {
      req.body = { name: 'John' };
      const validator = validateBody(schema);

      validator(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (next as any).mock.calls[0][0] as ApiError;
      expect(error.status).toBe(400);
    });
  });

  describe('validateQuery', () => {
    const schema = z.object({
      page: z.string().transform(Number).pipe(z.number().int().positive()),
      limit: z.string().optional(),
    });

    it('validates and parses valid query', () => {
      req.query = { page: '1', limit: '10' };
      const validator = validateQuery(schema);

      validator(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('rejects invalid query', () => {
      req.query = { page: '-1' };
      const validator = validateQuery(schema);

      validator(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (next as any).mock.calls[0][0] as ApiError;
      expect(error.status).toBe(400);
    });
  });

  describe('validateParams', () => {
    const schema = z.object({
      id: z.string().transform(Number).pipe(z.number().int().positive()),
    });

    it('validates and parses valid params', () => {
      req.params = { id: '123' };
      const validator = validateParams(schema);

      validator(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('rejects invalid params', () => {
      req.params = { id: 'invalid' };
      const validator = validateParams(schema);

      validator(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (next as any).mock.calls[0][0] as ApiError;
      expect(error.status).toBe(400);
    });
  });
});
