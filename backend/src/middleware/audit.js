import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';

const actions = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE'
};

export function auditChanges(request, response, next) {
  if (!request.user || !actions[request.method]) return next();

  response.once('finish', () => {
    if (response.statusCode >= 500) return;
    const segments = request.path.split('/').filter(Boolean);
    prisma.activityLog
      .create({
        data: {
          userId: request.user.id,
          action: actions[request.method],
          entityType: segments[0] || null,
          entityId: request.params.id || null,
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          ip: request.ip,
          userAgent: request.get('user-agent')?.slice(0, 500),
          metadata: {
            requestId: request.id,
            successful: response.statusCode < 400
          }
        }
      })
      .catch((error) => logger.error({ error }, 'Unable to persist audit log'));
  });

  return next();
}
