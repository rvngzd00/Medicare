import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from './api-error.js';

function requireAccessSecret() {
  if (!env.jwtAccessSecret) {
    throw new ApiError(
      500,
      'AUTH_NOT_CONFIGURED',
      'Authentication is not configured on this server.'
    );
  }
  return env.jwtAccessSecret;
}

export function signAccessToken(user) {
  return jwt.sign(
    {
      type: 'access',
      role: user.role?.slug
    },
    requireAccessSecret(),
    {
      subject: user.id,
      expiresIn: env.jwtAccessExpiresIn,
      issuer: 'medicare-api',
      audience: 'medicare-admin'
    }
  );
}

export function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, requireAccessSecret(), {
      issuer: 'medicare-api',
      audience: 'medicare-admin'
    });
    if (payload.type !== 'access') throw new Error('Invalid token type');
    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'INVALID_ACCESS_TOKEN', 'Access token is invalid or expired.');
  }
}

export function createRefreshToken() {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
