import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import {
  databaseEndpointKind
} from './config/database-url.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { guardDatabaseAvailability } from './middleware/database-circuit.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { globalRateLimit } from './middleware/rate-limits.js';
import { requestContext } from './middleware/request-context.js';
import { sanitizeInput } from './middleware/sanitize.js';
import { adminRouter } from './routes/admin.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { publicRouter } from './routes/public.routes.js';
import { ApiError } from './utils/api-error.js';
import { asyncHandler } from './utils/async-handler.js';
import { classifyDatabaseError } from './utils/database-error.js';
import {
  getDatabaseCircuitState,
  resetDatabaseCircuit,
  tripDatabaseCircuit
} from './utils/database-circuit.js';
import { success } from './utils/api-response.js';

function corsOptions() {
  const allowedOrigins = new Set(
    [...env.corsOrigins, env.appUrl].filter(Boolean)
  );
  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(
        new ApiError(403, 'CORS_ORIGIN_DENIED', 'This origin is not allowed.')
      );
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'RateLimit', 'RateLimit-Policy']
  };
}

let activeDatabaseProbe = null;
let lastSuccessfulDatabaseProbeAt = 0;

async function databaseReadinessCheck() {
  const now = Date.now();
  const circuit = getDatabaseCircuitState(now);
  if (circuit.open) {
    const error = new Error('Database circuit is open.');
    error.databaseReason = circuit.lastFailure?.reason || 'circuit_open';
    throw error;
  }

  if (
    lastSuccessfulDatabaseProbeAt > 0 &&
    now - lastSuccessfulDatabaseProbeAt < env.databaseReadinessCacheMs
  ) {
    return true;
  }

  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error('Database readiness check timed out.');
      error.code = 'P1002';
      reject(error);
    }, 4_000);
    timer.unref();
  });
  if (!activeDatabaseProbe) {
    activeDatabaseProbe = prisma.$queryRaw`SELECT 1`.finally(() => {
      activeDatabaseProbe = null;
    });
  }
  try {
    const result = await Promise.race([activeDatabaseProbe, timeout]);
    lastSuccessfulDatabaseProbeAt = Date.now();
    resetDatabaseCircuit();
    return result;
  } finally {
    clearTimeout(timer);
  }
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.get('/debug/outbound-ip', async (req, res) => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/debug/db-source', async (req, res) => {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT
        USER() AS user,
        CURRENT_USER() AS currentUser
    `);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

  if (env.trustProxy) app.set('trust proxy', 1);

  app.use(requestContext);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );
  app.use(cors(corsOptions()));
  app.use(globalRateLimit);
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());
  app.use(sanitizeInput);
  app.use(
    '/uploads',
    express.static(env.uploadDirectory, {
      fallthrough: false,
      immutable: env.isProduction,
      maxAge: env.isProduction ? '30d' : 0,
      dotfiles: 'deny',
      index: false
    })
  );

  app.get('/health', (_request, response) =>
    success(response, {
      status: 'ok',
      service: 'medicare-api',
      timestamp: new Date().toISOString()
    })
  );
  app.get(
    '/ready',
    asyncHandler(async (_request, response) => {
      try {
        await databaseReadinessCheck();
        return success(response, { status: 'ready', database: 'connected' });
      } catch (error) {
        tripDatabaseCircuit(error, env.databaseCircuitCooldownMs);
        const databaseError = classifyDatabaseError(error);
        logger.error({ error, databaseError }, 'Database readiness check failed');
        throw new ApiError(
          503,
          'DATABASE_UNAVAILABLE',
          'The API is running but the database is unavailable.',
          {
            reason: databaseError.reason,
            ...(databaseError.code ? { code: databaseError.code } : {}),
            ...(databaseError.providerCode
              ? { providerCode: databaseError.providerCode }
              : {}),
            endpoint: databaseEndpointKind(env.databaseUrl)
          }
        );
      }
    })
  );

  app.use(env.apiPrefix, guardDatabaseAvailability);
  app.use(`${env.apiPrefix}/auth`, authRouter);
  app.use(`${env.apiPrefix}/public`, publicRouter);
  app.use(`${env.apiPrefix}/admin`, adminRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export const app = createApp();
