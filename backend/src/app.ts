import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/error';
import { globalLimiter, originGuard } from './middleware/security';
import { api } from './routes';
import { AppError } from './utils/AppError';

export const app = express();
app.set('trust proxy', env.TRUST_PROXY_HOPS);
app.disable('x-powered-by');

app.use(helmet());

// ফিক্সড CORS: সব ডোমেইন অ্যালাউ করার জন্য origin: true দেওয়া হয়েছে
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(globalLimiter);
app.use(originGuard);

app.get('/health', (_req, res) => { res.json({ ok: true }); });
app.use('/api', api);
app.use(notFound);
app.use(errorHandler);