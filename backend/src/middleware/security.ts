import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

const limiterOpts = { standardHeaders: true, legacyHeaders: false, handler: (_q: Request, _s: Response, next: NextFunction) => next(new AppError(429, 'Too many requests, please try again later', 'RATE_LIMITED')) };

export const globalLimiter = rateLimit({ ...limiterOpts, windowMs: 15 * 60 * 1000, limit: 600 });
export const authLimiter = rateLimit({ ...limiterOpts, windowMs: 15 * 60 * 1000, limit: 30 });
export const paymentLimiter = rateLimit({ ...limiterOpts, windowMs: 60 * 1000, limit: 30 });

/** Basic CSRF defence: state-changing browser requests must come from an allowed origin. */
export function originGuard(req: Request, _res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.path.startsWith('/api/payments/webhook') || req.path.startsWith('/api/payment/webhook')) return next();
  const origin = req.headers.origin;
  if (origin && !env.frontendOrigins.includes(origin.replace(/\/$/, ''))) return next(new AppError(403, 'Origin not allowed', 'ORIGIN_BLOCKED'));
  next();
}
