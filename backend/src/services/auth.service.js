import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/api-error.js';
import {
  createRefreshToken,
  hashToken,
  signAccessToken
} from '../utils/tokens.js';
import { env } from '../config/env.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const dummyHashPromise = bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12);

const userInclude = {
  role: {
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  }
};

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: {
      id: user.role.id,
      name: user.role.name,
      slug: user.role.slug
    },
    permissions: user.role.permissions.map(({ permission }) => permission.code)
  };
}

function refreshExpiry() {
  return new Date(Date.now() + env.refreshTokenExpiresDays * 24 * 60 * 60 * 1000);
}

async function persistRefreshToken(userId, context, familyId = crypto.randomUUID()) {
  const refreshToken = createRefreshToken();
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      familyId,
      userId,
      expiresAt: refreshExpiry(),
      createdByIp: context.ip,
      userAgent: context.userAgent?.slice(0, 500)
    }
  });
  return refreshToken;
}

async function writeAuthLog(userId, action, context, metadata) {
  await prisma.activityLog.create({
    data: {
      userId,
      action,
      entityType: 'User',
      entityId: userId,
      method: context.method,
      path: context.path,
      ip: context.ip,
      userAgent: context.userAgent?.slice(0, 500),
      metadata
    }
  });
}

export async function login(email, password, context) {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    include: userInclude
  });

  const passwordMatches = await bcrypt.compare(
    password,
    user?.passwordHash || (await dummyHashPromise)
  );

  if (!user || !passwordMatches) {
    if (user) {
      const failedLoginAttempts = user.failedLoginAttempts + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts,
          ...(failedLoginAttempts >= MAX_FAILED_ATTEMPTS
            ? {
                status: 'LOCKED',
                lockedUntil: new Date(Date.now() + LOCK_DURATION_MS)
              }
            : {})
        }
      });
      await writeAuthLog(user.id, 'LOGIN_FAILED', context, {
        failedLoginAttempts
      });
    }
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }

  if (user.status === 'INACTIVE') {
    throw new ApiError(403, 'ACCOUNT_INACTIVE', 'This account is inactive.');
  }
  if (user.status === 'LOCKED') {
    if (!user.lockedUntil || user.lockedUntil > new Date()) {
      throw new ApiError(423, 'ACCOUNT_LOCKED', 'This account is locked.');
    }
  }

  const restoredUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date()
    },
    include: userInclude
  });
  const refreshToken = await persistRefreshToken(restoredUser.id, context);
  await writeAuthLog(restoredUser.id, 'LOGIN', context, { successful: true });

  return {
    accessToken: signAccessToken(restoredUser),
    refreshToken,
    user: publicUser(restoredUser)
  };
}

export async function rotateRefreshToken(rawToken, context) {
  if (!rawToken) {
    throw new ApiError(401, 'REFRESH_TOKEN_REQUIRED', 'A refresh token is required.');
  }

  const current = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: { include: userInclude } }
  });

  if (!current) {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid.');
  }

  if (current.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { familyId: current.familyId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    throw new ApiError(
      401,
      'REFRESH_TOKEN_REUSE',
      'Refresh token reuse was detected. Please sign in again.'
    );
  }

  if (current.expiresAt <= new Date()) {
    await prisma.refreshToken.update({
      where: { id: current.id },
      data: { revokedAt: new Date() }
    });
    throw new ApiError(401, 'REFRESH_TOKEN_EXPIRED', 'Refresh token has expired.');
  }
  if (
    current.user.deletedAt ||
    current.user.status !== 'ACTIVE'
  ) {
    throw new ApiError(401, 'ACCOUNT_UNAVAILABLE', 'This account is not available.');
  }

  const replacement = createRefreshToken();
  const replacementHash = hashToken(replacement);

  try {
    await prisma.$transaction(async (transaction) => {
      const revoked = await transaction.refreshToken.updateMany({
        where: { id: current.id, revokedAt: null },
        data: {
          revokedAt: new Date(),
          replacedByTokenHash: replacementHash
        }
      });
      if (revoked.count !== 1) throw new Error('REFRESH_ROTATION_RACE');

      await transaction.refreshToken.create({
        data: {
          tokenHash: replacementHash,
          familyId: current.familyId,
          userId: current.userId,
          expiresAt: refreshExpiry(),
          createdByIp: context.ip,
          userAgent: context.userAgent?.slice(0, 500)
        }
      });
    });
  } catch (error) {
    if (error.message === 'REFRESH_ROTATION_RACE') {
      await prisma.refreshToken.updateMany({
        where: { familyId: current.familyId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
      throw new ApiError(
        401,
        'REFRESH_TOKEN_REUSE',
        'Refresh token reuse was detected. Please sign in again.'
      );
    }
    throw error;
  }

  return {
    accessToken: signAccessToken(current.user),
    refreshToken: replacement,
    user: publicUser(current.user)
  };
}

export async function logout(rawToken, context) {
  if (!rawToken) return;
  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) }
  });
  if (!existing) return;

  await prisma.refreshToken.updateMany({
    where: { id: existing.id, revokedAt: null },
    data: { revokedAt: new Date() }
  });
  await writeAuthLog(existing.userId, 'LOGOUT', context, { successful: true });
}

export async function logoutAll(userId, context) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
  await writeAuthLog(userId, 'LOGOUT_ALL', context, { successful: true });
}
