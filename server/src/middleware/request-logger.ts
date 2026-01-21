import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import logger from '../utils/logger.js';

/**
 * Request logging middleware for production debugging.
 * Logs incoming requests and response status/timing.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const authReq = req as AuthRequest;

  // Log incoming request
  const requestLog = {
    method: req.method,
    path: req.path,
    userId: authReq.user?.id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const responseLog = {
      ...requestLog,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    };

    if (res.statusCode >= 500) {
      logger.error(responseLog, 'Request failed');
    } else if (res.statusCode >= 400) {
      logger.warn(responseLog, 'Request error');
    } else {
      logger.info(responseLog, 'Request completed');
    }
  });

  next();
}

export default requestLogger;
