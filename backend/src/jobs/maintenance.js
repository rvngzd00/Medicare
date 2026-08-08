import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { tripDatabaseCircuit } from '../utils/database-circuit.js';

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
  let running = false;
  const timer = setInterval(async () => {
    if (running) {
      logger.warn('Skipping overlapping maintenance job');
      return;
    }
    running = true;
    try {
      await runMaintenance();
    } catch (error) {
      tripDatabaseCircuit(error, env.databaseCircuitCooldownMs);
      logger.warn({ error }, 'Maintenance job failed');
    } finally {
      running = false;
    }
  }, env.maintenanceIntervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
