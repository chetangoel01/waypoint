import { Request, Response, NextFunction, RequestHandler } from 'express';

// Wrapped API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// Success response helper
export function success<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
  };
}

// Error response helper
export function error(message: string): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error: message,
  };
}

// Custom error class with status code
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number = 400) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Not found error helper
export function notFound(resource: string): never {
  throw new ApiError(`${resource} not found`, 404);
}

// Validation error helper
export function validationError(message: string): never {
  throw new ApiError(message, 400);
}

// Async handler wrapper - catches errors and passes to error middleware
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler middleware
export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err.message);

  const status = err instanceof ApiError ? err.status : 500;
  const message = err.message || 'Internal server error';

  res.status(status).json(error(message));
};
