import { Request, Response, NextFunction, RequestHandler } from 'express';
import { logger } from '../utils/logger.js';
import config from '../config/index.js';

// Error messages that are safe to expose to clients
const SAFE_ERROR_PATTERNS = [
  /not found/i,
  /not connected/i,
  /not configured/i,
  /invalid/i,
  /required/i,
  /missing/i,
  /unauthorized/i,
  /forbidden/i,
  /already exists/i,
];

// Sanitize error message for client response
function sanitizeErrorMessage(err: Error, status: number): string {
  // In development, show full errors
  if (config.isDevelopment) {
    return err.message;
  }

  // ApiErrors are intentionally thrown with safe messages
  if (err.name === 'ApiError') {
    return err.message;
  }

  // Check if error message matches safe patterns
  const isSafeMessage = SAFE_ERROR_PATTERNS.some((pattern) =>
    pattern.test(err.message)
  );

  if (isSafeMessage) {
    return err.message;
  }

  // Return generic message based on status code
  switch (status) {
    case 400:
      return 'Invalid request';
    case 401:
      return 'Authentication required';
    case 403:
      return 'Access denied';
    case 404:
      return 'Resource not found';
    case 429:
      return 'Too many requests';
    default:
      return 'An unexpected error occurred';
  }
}

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
  const status = err instanceof ApiError ? err.status : 500;

  // Log full error details server-side (not exposed to client)
  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      status,
    },
    'Request error'
  );

  // Send sanitized error message to client
  const clientMessage = sanitizeErrorMessage(err, status);
  res.status(status).json(error(clientMessage));
};
