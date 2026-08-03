import { Router } from 'express';
import {
  activityController,
  createRecordController,
  createRoleController,
  createUserController,
  dashboardController,
  deleteRecordController,
  deleteUserController,
  getServicePricingVisibilityController,
  getUserController,
  getRecordController,
  listPermissionsController,
  listRecordsController,
  listRolesController,
  listUsersController,
  reorderRecordsController,
  restoreRecordController,
  updateRecordController,
  updateRoleController,
  updateServicePricingVisibilityController,
  updateUserController
} from '../controllers/admin.controller.js';
import {
  deleteMediaController,
  listMediaController,
  replaceMediaController,
  uploadMediaController
} from '../controllers/media.controller.js';
import {
  createCmsPageController,
  getCmsPageController,
  listCmsPagesController,
  listCmsRevisionsController,
  restoreCmsRevisionController,
  saveCmsPageController
} from '../controllers/cms.controller.js';
import { auditChanges } from '../middleware/audit.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadImage } from '../middleware/upload.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  adminBodySchema,
  adminEntityParamsSchema,
  adminListSchema,
  adminReorderSchema,
  adminRecordParamsSchema,
  idParamsSchema,
  roleCreateSchema,
  roleUpdateSchema,
  servicePricingVisibilitySchema,
  userCreateSchema,
  userUpdateSchema
} from '../validators/admin.validators.js';
import {
  cmsPageCreateSchema,
  cmsPageIdSchema,
  cmsPageSaveSchema,
  cmsRevisionParamsSchema
} from '../validators/cms.validators.js';

export const adminRouter = Router();

adminRouter.use((_request, response, next) => {
  response.setHeader('Cache-Control', 'no-store');
  next();
});
adminRouter.use(authenticate, auditChanges);

adminRouter.get(
  '/dashboard',
  requirePermission('dashboard.read'),
  asyncHandler(dashboardController)
);

adminRouter.get(
  '/users',
  requirePermission('users.read'),
  validate(adminListSchema),
  asyncHandler(listUsersController)
);
adminRouter.get(
  '/users/:id',
  requirePermission('users.read'),
  validate(idParamsSchema),
  asyncHandler(getUserController)
);
adminRouter.post(
  '/users',
  requirePermission('users.write'),
  validate(userCreateSchema),
  asyncHandler(createUserController)
);
adminRouter.patch(
  '/users/:id',
  requirePermission('users.write'),
  validate(userUpdateSchema),
  asyncHandler(updateUserController)
);
adminRouter.delete(
  '/users/:id',
  requirePermission('users.delete'),
  validate(idParamsSchema),
  asyncHandler(deleteUserController)
);

adminRouter.get(
  '/roles',
  requirePermission('roles.read'),
  asyncHandler(listRolesController)
);
adminRouter.get(
  '/permissions',
  requirePermission('roles.read'),
  asyncHandler(listPermissionsController)
);
adminRouter.post(
  '/roles',
  requirePermission('roles.write'),
  validate(roleCreateSchema),
  asyncHandler(createRoleController)
);
adminRouter.patch(
  '/roles/:id',
  requirePermission('roles.write'),
  validate(roleUpdateSchema),
  asyncHandler(updateRoleController)
);

adminRouter.get(
  '/activity-logs',
  requirePermission('audit.read'),
  validate(adminListSchema),
  asyncHandler(activityController)
);

adminRouter.get(
  '/media',
  requirePermission('media.read'),
  validate(adminListSchema),
  asyncHandler(listMediaController)
);
adminRouter.post(
  '/media',
  requirePermission('media.write'),
  uploadImage.single('image'),
  asyncHandler(uploadMediaController)
);
adminRouter.put(
  '/media/:id',
  requirePermission('media.write'),
  validate(idParamsSchema),
  uploadImage.single('image'),
  asyncHandler(replaceMediaController)
);
adminRouter.delete(
  '/media/:id',
  requirePermission('media.delete'),
  validate(idParamsSchema),
  asyncHandler(deleteMediaController)
);

adminRouter.get(
  '/cms/pages',
  requirePermission('pages.read'),
  asyncHandler(listCmsPagesController)
);
adminRouter.post(
  '/cms/pages',
  requirePermission('pages.write'),
  validate(cmsPageCreateSchema),
  asyncHandler(createCmsPageController)
);
adminRouter.get(
  '/cms/pages/:id',
  requirePermission('pages.read'),
  validate(cmsPageIdSchema),
  asyncHandler(getCmsPageController)
);
adminRouter.put(
  '/cms/pages/:id',
  requirePermission('pages.write'),
  validate(cmsPageSaveSchema),
  asyncHandler(saveCmsPageController)
);
adminRouter.get(
  '/cms/pages/:id/revisions',
  requirePermission('pages.read'),
  validate(cmsPageIdSchema),
  asyncHandler(listCmsRevisionsController)
);
adminRouter.post(
  '/cms/pages/:id/revisions/:revisionId/restore',
  requirePermission('pages.write'),
  validate(cmsRevisionParamsSchema),
  asyncHandler(restoreCmsRevisionController)
);

adminRouter.get(
  '/services/pricing-visibility',
  requirePermission('services.read'),
  asyncHandler(getServicePricingVisibilityController)
);
adminRouter.put(
  '/services/pricing-visibility',
  requirePermission('services.write'),
  validate(servicePricingVisibilitySchema),
  asyncHandler(updateServicePricingVisibilityController)
);

adminRouter.post(
  '/:entity/:id/restore',
  validate({ ...adminRecordParamsSchema, ...adminBodySchema }),
  asyncHandler(restoreRecordController)
);
adminRouter.post(
  '/:entity/reorder',
  validate(adminReorderSchema),
  asyncHandler(reorderRecordsController)
);
adminRouter.get(
  '/:entity',
  validate({ ...adminEntityParamsSchema, ...adminListSchema }),
  asyncHandler(listRecordsController)
);
adminRouter.post(
  '/:entity',
  validate({ ...adminEntityParamsSchema, ...adminBodySchema }),
  asyncHandler(createRecordController)
);
adminRouter.get(
  '/:entity/:id',
  validate(adminRecordParamsSchema),
  asyncHandler(getRecordController)
);
adminRouter.patch(
  '/:entity/:id',
  validate({ ...adminRecordParamsSchema, ...adminBodySchema }),
  asyncHandler(updateRecordController)
);
adminRouter.delete(
  '/:entity/:id',
  validate(adminRecordParamsSchema),
  asyncHandler(deleteRecordController)
);
