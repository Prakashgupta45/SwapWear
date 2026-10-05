import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export interface HttpError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: HttpError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  const statusCode = (err as HttpError).statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error('Server Internal Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  });
}
