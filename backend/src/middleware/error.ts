import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, 'Resource not found', 'NOT_FOUND'));
}

interface MongoLikeError { name?: string; code?: number; message?: string; keyValue?: Record<string, unknown>; errors?: Record<string, { message: string }>; }

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let status = 500;
  let message = 'Something went wrong';
  let errorCode = 'INTERNAL_ERROR';
  let details: unknown;

  if (err instanceof AppError) {
    status = err.status; message = err.message; errorCode = err.errorCode;
  } else if (err instanceof ZodError) {
    status = 422; message = err.issues[0]?.message || 'Validation failed'; errorCode = 'VALIDATION_ERROR';
    details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  } else {
    const e = err as MongoLikeError;
    if (e?.code === 11000) { status = 409; message = 'A record with this value already exists'; errorCode = 'DUPLICATE'; }
    else if (e?.name === 'ValidationError') { status = 422; message = Object.values(e.errors || {})[0]?.message || 'Validation failed'; errorCode = 'VALIDATION_ERROR'; }
    else if (e?.name === 'CastError') { status = 400; message = 'Invalid identifier'; errorCode = 'BAD_REQUEST'; }
    else if (e?.name === 'MulterError') { status = 400; message = e.message || 'Upload failed'; errorCode = 'UPLOAD_ERROR'; }
    else if ((err as { type?: string })?.type === 'entity.too.large') { status = 413; message = 'Request too large'; errorCode = 'TOO_LARGE'; }
  }

  if (status >= 500) logger.error({ err: err instanceof Error ? { message: err.message, stack: env.isProd ? undefined : err.stack } : err, path: req.path }, 'Unhandled error');
  res.status(status).json({ success: false, message, errorCode, ...(details && !env.isProd ? { details } : {}) });
}
