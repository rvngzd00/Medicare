import { Router } from 'express';
import { z } from 'zod';
import {
  articleController,
  articlesController,
  configurationController,
  contentPageController,
  contentPagesController,
  createContactController,
  departmentController,
  departmentsController,
  doctorController,
  doctorsController,
  searchController,
  serviceController,
  servicesController,
  simpleContentController
} from '../controllers/public.controller.js';
import { formRateLimit } from '../middleware/rate-limits.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { contactSchema, listQuerySchema, slugParamsSchema } from '../validators/public.validators.js';

export const publicRouter = Router();

publicRouter.get('/configuration', asyncHandler(configurationController));
publicRouter.get('/doctors', validate(listQuerySchema), asyncHandler(doctorsController));
publicRouter.get('/doctors/:slug', validate(slugParamsSchema), asyncHandler(doctorController));
publicRouter.get(
  '/departments',
  validate(listQuerySchema),
  asyncHandler(departmentsController)
);
publicRouter.get(
  '/departments/:slug',
  validate(slugParamsSchema),
  asyncHandler(departmentController)
);
publicRouter.get('/services', validate(listQuerySchema), asyncHandler(servicesController));
publicRouter.get('/services/:slug', validate(slugParamsSchema), asyncHandler(serviceController));
publicRouter.get('/articles', validate(listQuerySchema), asyncHandler(articlesController));
publicRouter.get('/articles/:slug', validate(slugParamsSchema), asyncHandler(articleController));
publicRouter.get(
  '/content/:type',
  validate({
    params: z
      .object({
        type: z.enum([
          'branches',
          'faqs',
          'testimonials',
          'gallery',
          'certificates',
          'article-categories'
        ])
      })
      .strict(),
    query: listQuerySchema.query
  }),
  asyncHandler(simpleContentController)
);
publicRouter.get('/pages', asyncHandler(contentPagesController));
publicRouter.get('/pages/:slug', validate(slugParamsSchema), asyncHandler(contentPageController));
publicRouter.get(
  '/search',
  validate({
    query: z.object({ q: z.string().trim().min(2).max(100) }).strict()
  }),
  asyncHandler(searchController)
);
publicRouter.post(
  '/contact',
  formRateLimit,
  validate(contactSchema),
  asyncHandler(createContactController)
);
