import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
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

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
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
        await prisma.$queryRaw`SELECT 1`;
        return success(response, { status: 'ready', database: 'connected' });
      } catch {
        throw new ApiError(
          503,
          'DATABASE_UNAVAILABLE',
          'The API is running but the database is unavailable.'
        );
      }
    })
  );

  app.use(`${env.apiPrefix}/auth`, authRouter);
  app.use(`${env.apiPrefix}/public`, publicRouter);
  app.use(`${env.apiPrefix}/admin`, adminRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export const app = createApp();
