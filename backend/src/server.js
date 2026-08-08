import { app } from './app.js';
import { env, validateRuntimeEnv } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { startMaintenanceJobs } from './jobs/maintenance.js';

validateRuntimeEnv();

const server = app.listen(env.port, () => {
  logger.info({ port: env.port, apiPrefix: env.apiPrefix }, 'Medicare API started');
});
const stopMaintenanceJobs = env.maintenanceJobsEnabled
  ? startMaintenanceJobs()
  : () => {};

if (!env.maintenanceJobsEnabled) {
  logger.info('Background maintenance jobs are disabled for this runtime');
}
let shutdownStarted = false;

async function shutdown(signal) {
  if (shutdownStarted) return;
  shutdownStarted = true;

  logger.info({ signal }, 'Graceful shutdown started');
  stopMaintenanceJobs();

  try {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  } catch (error) {
    logger.error({ error }, 'HTTP server shutdown failed');
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (error) => {
  logger.error({ error }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  process.exit(1);
});
