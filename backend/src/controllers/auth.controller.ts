import type { CookieOptions, Request, Response } from 'express';
import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { HydratedDocument } from 'mongoose';
import { env } from '../config/env';
import { COOKIE_NAME } from '../middleware/auth';
import { User, verifyPassword, type IUser } from '../models/User';
import { sendResetEmail, sendWelcomeEmail } from '../services/email.service';
import { notifyAdmins } from '../services/notification.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/helpers';

export const publicUser = (u: HydratedDocument<IUser>) => ({
  id: String(u._id), name: u.name, email: u.email, phone: u.phone, role: u.role,
  mustChangePassword: u.mustChangePassword, createdAt: u.createdAt,
});

export function setAuthCookie(res: Response, u: HydratedDocument<IUser>) {
  const token = jwt.sign({ sub: String(u._id), tv: u.tokenVersion }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] });
  const exp = (jwt.decode(token) as { exp: number }).exp * 1000;
  const sameSite = env.COOKIE_SAMESITE;
  const opts: CookieOptions = { httpOnly: true, secure: env.isProd || sameSite === 'none', sameSite, maxAge: exp - Date.now(), path: '/' };
  res.cookie(COOKIE_NAME, token, opts);
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body as { name: string; email: string; phone: string; password: string };
  const existing = await User.findOne({ email });
  if (existing) throw new AppError(409, existing.isGuest ? 'This email was used for a previous purchase. Use \"Forgot password\" to set a password.' : 'An account with this email already exists', 'EMAIL_TAKEN');
  const user = await User.create({ name, email, phone, password, role: 'USER' });
  setAuthCookie(res, user);
  void sendWelcomeEmail(user.email, user.name);
  void notifyAdmins({ type: 'NEW_USER', title: 'New user', message: `${user.name} (${user.email})`, link: '/admin/users' });
  ok(res, publicUser(user), 201, 'Registered');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await User.findOne({ email }).select('+password');
  const valid = user ? await verifyPassword(password, user.password) : false;
  if (!user || !valid) throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  if (!user.isActive) throw new AppError(403, 'This account has been disabled', 'ACCOUNT_DISABLED');
  setAuthCookie(res, user);
  ok(res, publicUser(user));
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: env.isProd || env.COOKIE_SAMESITE === 'none', sameSite: env.COOKIE_SAMESITE, path: '/' });
  ok(res, null, 200, 'Logged out');
});

export const me = asyncHandler(async (req: Request, res: Response) => ok(res, publicUser(req.user!)));

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone } = req.body as { name: string; phone: string };
  req.user!.name = name; req.user!.phone = phone;
  await req.user!.save();
  ok(res, publicUser(req.user!));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  const user = await User.findById(req.user!._id).select('+password');
  if (!user || !(await verifyPassword(currentPassword, user.password))) throw new AppError(401, 'Current password is incorrect', 'INVALID_CREDENTIALS');
  user.password = newPassword;
  user.tokenVersion += 1; // invalidates all other sessions
  user.mustChangePassword = false;
  await user.save();
  setAuthCookie(res, user);
  ok(res, publicUser(user), 200, 'Password updated');
});

const sha = (t: string) => crypto.createHash('sha256').update(t).digest('hex');

/** Always answers the same way so it cannot be used to discover which emails have accounts. */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  const user = await User.findOne({ email });
  if (user && user.isActive) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = sha(token);
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    void sendResetEmail(user.email, `${env.primaryFrontend}/reset-password?email=${encodeURIComponent(user.email)}&token=${token}`);
  }
  ok(res, null, 200, 'If that email has an account, a reset link is on its way.');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, token, password } = req.body as { email: string; token: string; password: string };
  const user = await User.findOne({ email }).select('+password +resetTokenHash +resetTokenExpires');
  const given = Buffer.from(sha(token)); const stored = Buffer.from(user?.resetTokenHash ?? '');
  const valid = Boolean(user && user.isActive && user.resetTokenExpires && user.resetTokenExpires.getTime() > Date.now() && given.length === stored.length && crypto.timingSafeEqual(given, stored));
  if (!user || !valid) throw new AppError(400, 'This reset link is invalid or has expired', 'INVALID_TOKEN');
  user.password = password;
  user.isGuest = false; // proving control of the email also claims a guest account
  user.mustChangePassword = false;
  user.tokenVersion += 1;
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
  setAuthCookie(res, user);
  ok(res, publicUser(user), 200, 'Password updated');
});
