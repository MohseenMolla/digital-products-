import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: ['password', '*.password', 'apiKey', '*.apiKey', 'authorization', 'req.headers.cookie', 'req.headers.authorization', 'token'],
    censor: '[REDACTED]',
  },
});
