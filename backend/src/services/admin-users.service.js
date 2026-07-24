import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/api-error.js';
import { getPagination, paginationMeta } from '../utils/pagination.js';
import { toSlug } from '../utils/slug.js';

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  status: true,
  failedLoginAttempts: true,
  lockedUntil: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: { id: true, name: true, slug: true }
  }
};

function isSuperAdmin(actor) {
  return actor?.role?.slug === 'super-admin';
}

async function getAssignableRole(roleId, actor) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });
  if (!role) throw new ApiError(422, 'INVALID_ROLE', 'The selected role is invalid.');
  if (isSuperAdmin(actor)) return role;

  if (
    role.slug === 'super-admin' ||
    role.permissions.some(
      ({ permission }) => !actor?.permissions?.has(permission.code)
    )
  ) {
    throw new ApiError(
      403,
      'ROLE_ESCALATION_FORBIDDEN',
      'You cannot assign a role with privileges above your own.'
    );
  }
  return role;
}

function assertTargetIsManageable(user, actor) {
  if (!isSuperAdmin(actor) && user.role?.slug === 'super-admin') {
    throw new ApiError(
      403,
      'SUPER_ADMIN_PROTECTED',
      'Only a super administrator can manage this account.'
    );
  }
}

async function assertPermissionGrant(permissionIds, actor) {
  if (!permissionIds || isSuperAdmin(actor)) return;
  const permissions = await prisma.permission.findMany({
    where: { id: { in: permissionIds } },
    select: { id: true, code: true }
  });
  if (
    permissions.length !== new Set(permissionIds).size ||
    permissions.some(({ code }) => !actor?.permissions?.has(code))
  ) {
    throw new ApiError(
      403,
      'PERMISSION_ESCALATION_FORBIDDEN',
      'You cannot grant permissions that you do not have.'
    );
  }
}

export async function listUsers(query) {
  const { page, limit, skip, take } = getPagination(query, {
    defaultLimit: 20,
    maxLimit: 100
  });
  const where = {
    deletedAt: null,
    ...(query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' } },
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } }
          ]
        }
      : {}),
    ...(query.status ? { status: query.status } : {})
  };
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: userSelect
    }),
    prisma.user.count({ where })
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}

export async function getUser(id) {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: userSelect
  });
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'User was not found.');
  return user;
}

export async function createUser(input, actor) {
  const { password, ...data } = input;
  await getAssignableRole(data.roleId, actor);
  return prisma.user.create({
    data: {
      ...data,
      passwordHash: await bcrypt.hash(password, 12)
    },
    select: userSelect
  });
}

export async function updateUser(id, input, actor) {
  const { password, ...data } = input;
  const existing = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: { role: true }
  });
  if (!existing) throw new ApiError(404, 'USER_NOT_FOUND', 'User was not found.');
  assertTargetIsManageable(existing, actor);
  if (data.roleId) await getAssignableRole(data.roleId, actor);

  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.update({
      where: { id },
      data: {
        ...data,
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
        ...(data.status === 'ACTIVE'
          ? { failedLoginAttempts: 0, lockedUntil: null }
          : {})
      },
      select: userSelect
    });
    if (password || (data.status && data.status !== 'ACTIVE')) {
      await transaction.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }
    return user;
  });
}

export async function deleteUser(id, actor) {
  if (id === actor.id) {
    throw new ApiError(409, 'SELF_DELETE_FORBIDDEN', 'You cannot delete your own account.');
  }
  const existing = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: { role: true }
  });
  if (!existing) throw new ApiError(404, 'USER_NOT_FOUND', 'User was not found.');
  assertTargetIsManageable(existing, actor);

  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' }
    }),
    prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  ]);
}

const roleInclude = {
  permissions: {
    include: { permission: true },
    orderBy: { permission: { code: 'asc' } }
  },
  _count: { select: { users: true } }
};

export async function listRoles() {
  return prisma.role.findMany({
    include: roleInclude,
    orderBy: { name: 'asc' }
  });
}

export async function listPermissions() {
  return prisma.permission.findMany({ orderBy: { code: 'asc' } });
}

export async function createRole(input, actor) {
  const { permissionIds, ...data } = input;
  await assertPermissionGrant(permissionIds, actor);
  return prisma.role.create({
    data: {
      ...data,
      slug: data.slug || toSlug(data.name),
      permissions: {
        create: permissionIds.map((permissionId) => ({ permissionId }))
      }
    },
    include: roleInclude
  });
}

export async function updateRole(id, input, actor) {
  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'ROLE_NOT_FOUND', 'Role was not found.');

  const { permissionIds, ...data } = input;
  if (existing.isSystem && !isSuperAdmin(actor)) {
    throw new ApiError(
      403,
      'SYSTEM_ROLE_PROTECTED',
      'Only a super administrator can change a system role.'
    );
  }
  if (existing.isSystem && (data.name || data.slug)) {
    throw new ApiError(
      409,
      'SYSTEM_ROLE_IMMUTABLE',
      'System role identity cannot be changed.'
    );
  }
  await assertPermissionGrant(permissionIds, actor);

  return prisma.$transaction(async (transaction) => {
    if (permissionIds) {
      await transaction.rolePermission.deleteMany({ where: { roleId: id } });
      await transaction.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: id, permissionId }))
      });
    }
    return transaction.role.update({
      where: { id },
      data: {
        ...data,
        ...(data.slug ? { slug: toSlug(data.slug) } : {})
      },
      include: roleInclude
    });
  });
}
