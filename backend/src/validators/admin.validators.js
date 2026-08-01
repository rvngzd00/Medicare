import { z } from 'zod';
import { adminEntities } from '../constants/admin-entities.js';

const password = z
  .string()
  .min(12)
  .max(128)
  .refine(
    (value) =>
      /[a-z]/.test(value) &&
      /[A-Z]/.test(value) &&
      /\d/.test(value) &&
      /[^A-Za-z0-9]/.test(value),
    'Password must include upper/lowercase letters, a number and a symbol'
  );

export const adminEntityParamsSchema = {
  params: z
    .object({
      entity: z.enum(Object.keys(adminEntities))
    })
    .strict()
};

export const adminRecordParamsSchema = {
  params: z
    .object({
      entity: z.enum(Object.keys(adminEntities)),
      id: z.string().uuid()
    })
    .strict()
};

export const adminListSchema = {
  query: z
    .object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
      search: z.string().trim().max(100).optional(),
      status: z.string().trim().max(40).optional(),
      active: z
        .enum(['true', 'false'])
        .transform((value) => value === 'true')
        .optional()
    })
    .strict()
};

export const adminBodySchema = {
  body: z.record(z.unknown()).refine((value) => Object.keys(value).length <= 100, {
    message: 'Too many fields were supplied'
  })
};

export const adminReorderSchema = {
  params: adminEntityParamsSchema.params,
  body: z
    .object({
      ids: z.array(z.string().uuid()).min(1).max(100)
    })
    .strict()
    .refine((value) => new Set(value.ids).size === value.ids.length, {
      message: 'Record IDs must be unique'
    })
};

export const userCreateSchema = {
  body: z
    .object({
      email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
      password,
      firstName: z.string().trim().min(2).max(80),
      lastName: z.string().trim().min(2).max(80),
      roleId: z.string().uuid(),
      status: z.enum(['ACTIVE', 'INACTIVE']).optional()
    })
    .strict()
};

export const userUpdateSchema = {
  params: z.object({ id: z.string().uuid() }).strict(),
  body: z
    .object({
      email: z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((value) => value.toLowerCase())
        .optional(),
      password: password.optional(),
      firstName: z.string().trim().min(2).max(80).optional(),
      lastName: z.string().trim().min(2).max(80).optional(),
      roleId: z.string().uuid().optional(),
      status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']).optional()
    })
    .strict()
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required')
};

export const idParamsSchema = {
  params: z.object({ id: z.string().uuid() }).strict()
};

export const roleCreateSchema = {
  body: z
    .object({
      name: z.string().trim().min(2).max(80),
      slug: z
        .string()
        .trim()
        .min(2)
        .max(80)
        .regex(/^[a-z0-9-]+$/)
        .optional(),
      description: z.string().trim().max(500).optional().nullable(),
      permissionIds: z
        .array(z.string().uuid())
        .max(100)
        .refine(
          (values) => new Set(values).size === values.length,
          'Permission IDs must be unique'
        )
    })
    .strict()
};

export const roleUpdateSchema = {
  params: z.object({ id: z.string().uuid() }).strict(),
  body: roleCreateSchema.body
    .partial()
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required')
};
