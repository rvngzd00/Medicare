import { z } from 'zod';

const slug = z.string().trim().min(1).max(160).regex(/^[a-z0-9-]+$/);
const optionalId = z.string().uuid().optional().nullable();
const phone = z
  .string()
  .trim()
  .min(7)
  .max(32)
  .regex(/^[+()\d\s-]+$/, 'Invalid phone number format');

function bakuDateKey(value) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Baku',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(value);
  const date = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );
  return `${date.year}-${date.month}-${date.day}`;
}

const desiredDate = z.coerce
  .date()
  .refine(
    (value) => bakuDateKey(value) >= bakuDateKey(new Date()),
    'Date cannot be in the past'
  )
  .refine(
    (value) =>
      value.getTime() <= Date.now() + 366 * 24 * 60 * 60 * 1000,
    'Date cannot be more than one year in the future'
  );

export const slugParamsSchema = {
  params: z.object({ slug }).strict()
};

export const listQuerySchema = {
  query: z
    .object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
      search: z.string().trim().max(100).optional(),
      department: slug.optional(),
      branch: slug.optional(),
      category: slug.optional(),
      specialty: z.string().trim().max(120).optional(),
      minExperience: z.coerce.number().int().min(0).max(80).optional(),
      featured: z
        .enum(['true', 'false'])
        .transform((value) => value === 'true')
        .optional()
    })
    .strict()
};

export const appointmentSchema = {
  body: z
    .object({
      firstName: z.string().trim().min(2).max(80),
      lastName: z.string().trim().min(2).max(80),
      phone,
      email: z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((value) => value.toLowerCase())
        .optional()
        .or(z.literal('')),
      departmentId: optionalId,
      doctorId: optionalId,
      branchId: optionalId,
      desiredDate,
      desiredTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must use HH:mm format'),
      message: z.string().trim().max(2000).optional().or(z.literal('')),
      privacyConsent: z.literal(true),
      website: z.string().max(0).optional()
    })
    .strict()
};

export const contactSchema = {
  body: z
    .object({
      firstName: z.string().trim().min(2).max(80),
      lastName: z.string().trim().max(80).optional().or(z.literal('')),
      email: z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((value) => value.toLowerCase()),
      phone: phone.optional().or(z.literal('')),
      subject: z.string().trim().min(3).max(180),
      message: z.string().trim().min(10).max(5000),
      privacyConsent: z.literal(true),
      website: z.string().max(0).optional()
    })
    .strict()
};
