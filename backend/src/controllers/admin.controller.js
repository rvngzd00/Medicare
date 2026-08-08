import { prisma } from '../config/prisma.js';
import {
  createAdminRecord,
  deleteAdminRecord,
  getAdminDefinition,
  getAdminRecord,
  listAdminRecords,
  reorderAdminRecords,
  restoreAdminRecord,
  updateAdminRecord
} from '../services/admin-crud.service.js';
import {
  createRole,
  createUser,
  deleteUser,
  getUser,
  listPermissions,
  listRoles,
  listUsers,
  updateRole,
  updateUser
} from '../services/admin-users.service.js';
import {
  getServicePricingVisibility,
  updateServicePricingVisibility
} from '../services/service-pricing.service.js';
import { ApiError } from '../utils/api-error.js';
import { success } from '../utils/api-response.js';
import { getPagination, paginationMeta } from '../utils/pagination.js';

function ensureEntityPermission(request, action) {
  const definition = getAdminDefinition(request.params.entity);
  const permission = `${definition.permission}.${action}`;
  if (
    request.user.role.slug !== 'super-admin' &&
    !request.user.permissions.has(permission)
  ) {
    throw new ApiError(
      403,
      'INSUFFICIENT_PERMISSION',
      'You do not have permission to perform this action.'
    );
  }
  if (
    request.params.entity === 'articles' &&
    ['PUBLISHED', 'SCHEDULED'].includes(request.body?.status) &&
    request.user.role.slug !== 'super-admin' &&
    !request.user.permissions.has('articles.publish')
  ) {
    throw new ApiError(
      403,
      'PUBLISH_PERMISSION_REQUIRED',
      'Publishing permission is required for this status.'
    );
  }
}

export async function dashboardController(_request, response) {
  const [
    doctors,
    departments,
    services,
    unreadMessages,
    publishedArticles,
    recentActivity
  ] = await Promise.all([
    prisma.doctor.count({ where: { active: true, deletedAt: null } }),
    prisma.department.count({ where: { active: true, deletedAt: null } }),
    prisma.service.count({ where: { active: true, deletedAt: null } }),
    prisma.contactMessage.count({ where: { status: 'NEW', deletedAt: null } }),
    prisma.article.count({
      where: { status: 'PUBLISHED', deletedAt: null }
    }),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } }
      }
    })
  ]);
  return success(response, {
    counts: {
      doctors,
      departments,
      services,
      unreadMessages,
      publishedArticles
    },
    recentActivity
  });
}

export async function getServicePricingVisibilityController(_request, response) {
  return success(response, await getServicePricingVisibility());
}

export async function updateServicePricingVisibilityController(request, response) {
  return success(
    response,
    await updateServicePricingVisibility(request.body.visible),
    {
      message: request.body.visible
        ? 'Public service prices are now visible.'
        : 'Public service prices are now hidden.'
    }
  );
}

export async function listRecordsController(request, response) {
  ensureEntityPermission(request, 'read');
  const result = await listAdminRecords(request.params.entity, request.query);
  return success(response, result.items, { meta: result.meta });
}

export async function getRecordController(request, response) {
  ensureEntityPermission(request, 'read');
  return success(
    response,
    await getAdminRecord(request.params.entity, request.params.id)
  );
}

export async function createRecordController(request, response) {
  ensureEntityPermission(request, 'write');
  return success(
    response,
    await createAdminRecord(request.params.entity, request.body),
    { statusCode: 201, message: 'Resource created successfully.' }
  );
}

export async function updateRecordController(request, response) {
  ensureEntityPermission(request, 'write');
  return success(
    response,
    await updateAdminRecord(
      request.params.entity,
      request.params.id,
      request.body
    ),
    { message: 'Resource updated successfully.' }
  );
}

export async function deleteRecordController(request, response) {
  ensureEntityPermission(request, 'delete');
  await deleteAdminRecord(request.params.entity, request.params.id);
  return success(response, null, { message: 'Resource deleted successfully.' });
}

export async function restoreRecordController(request, response) {
  ensureEntityPermission(request, 'write');
  return success(
    response,
    await restoreAdminRecord(request.params.entity, request.params.id),
    { message: 'Resource restored successfully.' }
  );
}

export async function reorderRecordsController(request, response) {
  ensureEntityPermission(request, 'write');
  return success(
    response,
    await reorderAdminRecords(request.params.entity, request.body.ids),
    { message: 'Resources reordered successfully.' }
  );
}

export async function listUsersController(request, response) {
  const result = await listUsers(request.query);
  return success(response, result.items, { meta: result.meta });
}

export async function getUserController(request, response) {
  return success(response, await getUser(request.params.id));
}

export async function createUserController(request, response) {
  return success(response, await createUser(request.body, request.user), {
    statusCode: 201,
    message: 'Admin user created successfully.'
  });
}

export async function updateUserController(request, response) {
  return success(
    response,
    await updateUser(request.params.id, request.body, request.user),
    {
    message: 'Admin user updated successfully.'
    }
  );
}

export async function deleteUserController(request, response) {
  await deleteUser(request.params.id, request.user);
  return success(response, null, { message: 'Admin user deleted successfully.' });
}

export async function listRolesController(_request, response) {
  return success(response, await listRoles());
}

export async function listPermissionsController(_request, response) {
  return success(response, await listPermissions());
}

export async function createRoleController(request, response) {
  return success(response, await createRole(request.body, request.user), {
    statusCode: 201,
    message: 'Role created successfully.'
  });
}

export async function updateRoleController(request, response) {
  return success(
    response,
    await updateRole(request.params.id, request.body, request.user),
    {
    message: 'Role updated successfully.'
    }
  );
}

export async function activityController(request, response) {
  const { page, limit, skip, take } = getPagination(request.query, {
    defaultLimit: 30,
    maxLimit: 100
  });
  const where = request.query.search
    ? {
        OR: [
          { action: { contains: request.query.search } },
          { entityType: { contains: request.query.search } }
        ]
      }
    : {};
  const [items, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    }),
    prisma.activityLog.count({ where })
  ]);
  return success(response, items, { meta: paginationMeta(total, page, limit) });
}
