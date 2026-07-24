import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';

const ONE_DAY = 24 * 60 * 60 * 1000;

async function runMaintenance() {
  const now = new Date();
  const refreshRetentionCutoff = new Date(Date.now() - 7 * ONE_DAY);

  const [published, removedTokens] = await prisma.$transaction([
    prisma.article.updateMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
        deletedAt: null
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: now
      }
    }),
    prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: refreshRetentionCutoff } },
          { revokedAt: { lt: refreshRetentionCutoff } }
        ]
      }
    })
  ]);

  if (published.count || removedTokens.count) {
    logger.info(
      {
        scheduledArticlesPublished: published.count,
        staleRefreshTokensRemoved: removedTokens.count
      },
      'Maintenance job completed'
    );
  }
}

export function startMaintenanceJobs() {
  const timer = setInterval(() => {
    runMaintenance().catch((error) =>
      logger.warn({ error }, 'Maintenance job failed')
    );
  }, 60 * 1000);
  timer.unref();
  return () => clearInterval(timer);
}
