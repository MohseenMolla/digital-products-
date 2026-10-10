import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, type Role } from '../models/User';
import { AppError } from '../utils/AppError';

export const COOKIE_NAME = 'token';

interface JwtPayload { sub: string; tv: number; }

async function resolveUser(req: Request) {
  const header = req.headers.authorization;
  const token: string | undefined = req.cookies?.[COOKIE_NAME] || (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive || user.tokenVersion !== payload.tv) return null;
    return user;
  } catch {
    return null;
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = await resolveUser(req);
    if (!user) throw new AppError(401, 'Please log in to continue', 'UNAUTHORIZED');
    req.user = user;
    next();
  } catch (e) { next(e); }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = await resolveUser(req);
    if (user) req.user = user;
    next();
  } catch (e) { next(e); }
}

export const requireRole = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError(401, 'Please log in to continue', 'UNAUTHORIZED'));
  if (!roles.includes(req.user.role)) return next(new AppError(403, 'You do not have permission to do this', 'FORBIDDEN'));
  next();
};

export const authorizeAdmin = requireRole('ADMIN', 'SUPER_ADMIN');
