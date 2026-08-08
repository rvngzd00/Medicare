import { PrismaClient } from '@prisma/client';
import { buildDatabaseUrl } from './database-url.js';
import { env } from './env.js';
import { logger } from './logger.js';

const globalPrisma = globalThis;

export const prisma =
  globalPrisma.__medicarePrisma ||
  new PrismaClient({
    datasourceUrl: buildDatabaseUrl(env.databaseUrl, {
      production: env.isProduction
    }),
    log: env.isProduction
      ? [{ emit: 'event', level: 'error' }]
      : [
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' }
        ]
  });

prisma.$on('warn', (event) => logger.warn({ prisma: event }, 'Prisma warning'));
prisma.$on('error', (event) => logger.error({ prisma: event }, 'Prisma error'));

if (!env.isProduction) globalPrisma.__medicarePrisma = prisma;
