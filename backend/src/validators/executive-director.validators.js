import { z } from 'zod';

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional();

export const executiveDirectorUpdateSchema = {
  body: z
    .object({
      fullName: z.string().trim().min(2).max(160),
      role: z.string().trim().min(2).max(160),
      message: optionalText(2000),
      signature: optionalText(300),
      photoId: z.string().uuid().nullable().optional(),
      active: z.boolean()
    })
    .strict()
};
