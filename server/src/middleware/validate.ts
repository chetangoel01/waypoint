import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from './response.js';

/**
 * Validate request body against a Zod schema.
 * Returns 400 with validation errors if invalid.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        next(new ApiError(message, 400));
      } else {
        next(err);
      }
    }
  };
}

/**
 * Validate request query parameters against a Zod schema.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        next(new ApiError(message, 400));
      } else {
        next(err);
      }
    }
  };
}

/**
 * Validate request params against a Zod schema.
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as typeof req.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        next(new ApiError(message, 400));
      } else {
        next(err);
      }
    }
  };
}
