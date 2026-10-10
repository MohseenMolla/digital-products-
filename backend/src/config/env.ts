import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters'),
  FRONTEND_URL: z.string().min(1),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  BKASH_NUMBER: z.string().trim().optional(),
  NAGAD_NUMBER: z.string().trim().optional(),
  ROCKET_NUMBER: z.string().trim().optional(),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.coerce.number().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
const e = parsed.data;
const frontendOrigins = e.FRONTEND_URL.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);

export const env = {
  ...e,
  isProd: e.NODE_ENV === 'production',
  frontendOrigins,
  primaryFrontend: frontendOrigins[0],
  cloudinaryConfigured: Boolean(e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET),
  emailConfigured: Boolean(e.EMAIL_HOST && e.EMAIL_USER && e.EMAIL_PASSWORD),
};
