import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function integer(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

function list(value) {
  return (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const sameSite = ['lax', 'strict', 'none'].includes(process.env.COOKIE_SAME_SITE)
  ? process.env.COOKIE_SAME_SITE
  : 'lax';
const nodeEnv = process.env.NODE_ENV || 'development';

export const env = Object.freeze({
  nodeEnv,
  port: integer(process.env.PORT, 4000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  appUrl:
    process.env.APP_URL || (nodeEnv === 'production' ? undefined : 'http://localhost:3000'),
  databaseUrl: process.env.DATABASE_URL,
  corsOrigins: list(process.env.CORS_ORIGINS),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshTokenExpiresDays: integer(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 30),
  refreshCookieName: process.env.REFRESH_COOKIE_NAME || 'medicare_refresh',
  cookieSecure: boolean(process.env.COOKIE_SECURE),
  cookieSameSite: sameSite,
  logLevel: process.env.LOG_LEVEL || 'info',
  trustProxy: boolean(process.env.TRUST_PROXY),
  rateLimitWindowMs: integer(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: integer(process.env.RATE_LIMIT_MAX, 300),
  authRateLimitMax: integer(process.env.AUTH_RATE_LIMIT_MAX, 10),
  uploadMaxBytes: integer(process.env.UPLOAD_MAX_MB, 8) * 1024 * 1024,
  uploadDirectory: path.resolve(projectRoot, process.env.UPLOAD_DIR || 'uploads'),
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test'
});

export function validateRuntimeEnv() {
  const errors = [];
  if (!env.databaseUrl) errors.push('DATABASE_URL is required');
  if (env.isProduction && !env.appUrl) errors.push('APP_URL is required in production');
  if (!env.jwtAccessSecret || env.jwtAccessSecret.length < 32) {
    errors.push('JWT_ACCESS_SECRET must contain at least 32 characters');
  }
  if (env.cookieSameSite === 'none' && !env.cookieSecure) {
    errors.push('COOKIE_SECURE must be true when COOKIE_SAME_SITE=none');
  }
  if (env.isProduction && env.corsOrigins.length === 0) {
    errors.push('CORS_ORIGINS must contain at least one production origin');
  }
  for (const origin of [...env.corsOrigins, env.appUrl].filter(Boolean)) {
    try {
      const parsed = new URL(origin);
      if (parsed.origin !== origin.replace(/\/$/, '')) {
        errors.push(`${origin} must be an origin without a path`);
      }
    } catch {
      errors.push(`${origin} is not a valid URL origin`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration: ${errors.join('; ')}`);
  }
}
