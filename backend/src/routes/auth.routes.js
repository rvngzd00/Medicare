import { Router } from 'express';
import {
  loginController,
  logoutAllController,
  logoutController,
  meController,
  refreshController
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rate-limits.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { loginSchema, refreshSchema } from '../validators/auth.validators.js';

export const authRouter = Router();

authRouter.use((_request, response, next) => {
  response.setHeader('Cache-Control', 'no-store');
  next();
});

authRouter.post(
  '/login',
  authRateLimit,
  validate(loginSchema),
  asyncHandler(loginController)
);
authRouter.post(
  '/refresh',
  authRateLimit,
  validate(refreshSchema),
  asyncHandler(refreshController)
);
authRouter.post(
  '/logout',
  validate(refreshSchema),
  asyncHandler(logoutController)
);
authRouter.post('/logout-all', authenticate, asyncHandler(logoutAllController));
authRouter.get('/me', authenticate, asyncHandler(meController));
