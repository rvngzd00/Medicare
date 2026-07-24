import { z } from 'zod';

const nullableText = (max) =>
  z.string().trim().max(max).nullable().optional();
const nullableWebUrl = z
  .string()
  .trim()
  .url()
  .max(500)
  .refine((value) => /^https?:\/\//i.test(value), 'Only HTTP URLs are allowed')
  .nullable()
  .optional();

const seoSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    description: z.string().trim().min(10).max(500),
    canonicalUrl: nullableWebUrl,
    keywords: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
    robots: z.string().trim().max(100).optional(),
    ogTitle: nullableText(160),
    ogDescription: nullableText(500),
    twitterCard: z
      .enum(['summary', 'summary_large_image'])
      .optional(),
    structuredData: z.record(z.unknown()).optional()
  })
  .strict();

const pageSectionSchema = z
  .object({
    id: z.string().uuid().optional(),
    key: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[a-zA-Z0-9əğıöşüçƏĞİIÖŞÜÇ _-]+$/),
    type: z
      .enum([
        'HERO',
        'RICH_TEXT',
        'STATISTICS',
        'COLLECTION',
        'FEATURE_GRID',
        'MEDIA',
        'CTA',
        'FAQ',
        'CONTACT',
        'CUSTOM'
      ]),
    label: z.string().trim().min(1).max(120),
    eyebrow: nullableText(160),
    title: nullableText(240),
    description: nullableText(2000),
    content: z.record(z.unknown()).default({}),
    active: z.boolean().default(true),
    locked: z.boolean().default(false),
    sortOrder: z.number().int().min(0).max(500).optional()
  })
  .strict();

const pageFields = {
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(1).max(160),
  excerpt: nullableText(1000),
  template: z
    .enum(['HOME', 'STANDARD', 'LEGAL', 'CONTACT', 'LANDING'])
    .default('STANDARD'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  body: z.record(z.unknown()).optional(),
  seo: seoSchema.nullable().optional(),
  sections: z.array(pageSectionSchema).max(60).default([])
};

export const cmsPageIdSchema = {
  params: z.object({ id: z.string().uuid() }).strict()
};

export const cmsRevisionParamsSchema = {
  params: z
    .object({
      id: z.string().uuid(),
      revisionId: z.string().uuid()
    })
    .strict()
};

export const cmsPageCreateSchema = {
  body: z.object(pageFields).strict()
};

export const cmsPageSaveSchema = {
  params: cmsPageIdSchema.params,
  body: z.object(pageFields).strict()
};
