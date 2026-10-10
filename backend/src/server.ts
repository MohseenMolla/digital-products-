import mongoose from 'mongoose';
import { app } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';

async function main() {
  await connectDB();
  const server = app.listen(env.PORT, () => logger.info({ port: env.PORT, env: env.NODE_ENV }, 'API listening'));
  const shutdown = (sig: string) => {
    logger.info({ sig }, 'Shutting down');
    server.close(async () => { await mongoose.disconnect(); process.exit(0); });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((e) => { logger.error({ err: (e as Error).message }, 'Fatal startup error'); process.exit(1); });
