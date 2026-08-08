import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const commonOptions = {
  windowMs: env.rateLimitWindowMs,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (request) =>
    env.isTest || request.path === '/health' || request.path === '/ready',
  handler(_request, response) {
    response.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.'
      }
    });
  }
};

export const globalRateLimit = rateLimit({
  ...commonOptions,
  limit: env.rateLimitMax
});

export const authRateLimit = rateLimit({
  ...commonOptions,
  limit: env.authRateLimitMax
});

export const formRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 60 * 60 * 1000,
  limit: 20
});
