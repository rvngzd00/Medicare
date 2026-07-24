import { z } from 'zod';

export const loginSchema = {
  body: z
    .object({
      email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
      password: z.string().min(8).max(128)
    })
    .strict()
};

export const refreshSchema = {
  body: z
    .object({
      refreshToken: z.string().min(32).max(512).optional()
    })
    .strict()
    .default({})
};
