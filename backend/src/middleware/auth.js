import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { verifyAccessToken } from '../utils/tokens.js';

export const authenticate = asyncHandler(async (request, _response, next) => {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    throw new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.');
  }

  const payload = verifyAccessToken(authorization.slice(7));
  const user = await prisma.user.findFirst({
    where: {
      id: payload.sub,
      deletedAt: null
    },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    }
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new ApiError(401, 'ACCOUNT_UNAVAILABLE', 'This account is not available.');
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new ApiError(423, 'ACCOUNT_LOCKED', 'This account is temporarily locked.');
  }

  request.user = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: {
      id: user.role.id,
      name: user.role.name,
      slug: user.role.slug
    },
    permissions: new Set(
      user.role.permissions.map(({ permission }) => permission.code)
    )
  };
  next();
});

export function requirePermission(...requiredPermissions) {
  return function permissionMiddleware(request, _response, next) {
    const hasPermission =
      request.user?.role.slug === 'super-admin' ||
      requiredPermissions.some((permission) =>
        request.user?.permissions.has(permission)
      );

    if (!hasPermission) {
      return next(
        new ApiError(
          403,
          'INSUFFICIENT_PERMISSION',
          'You do not have permission to perform this action.'
        )
      );
    }
    return next();
  };
}
