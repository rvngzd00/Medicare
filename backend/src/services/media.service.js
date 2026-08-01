import path from 'node:path';
import sanitizeHtml from 'sanitize-html';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import { localImageStorage } from '../storage/local-image.storage.js';
import { ApiError } from '../utils/api-error.js';
import { getPagination, paginationMeta } from '../utils/pagination.js';

const storage = localImageStorage;

function safeOriginalName(originalName) {
  return path.basename(originalName).replace(/[^\p{L}\p{N}._ -]/gu, '').slice(0, 255);
}

function cleanAltText(altText) {
  if (altText === undefined || altText === null || altText === '') return null;
  const cleaned = sanitizeHtml(String(altText).trim(), {
    allowedTags: [],
    allowedAttributes: {}
  });
  if (cleaned.length > 300) {
    throw new ApiError(422, 'VALIDATION_FAILED', 'Alternative text is too long.');
  }
  return cleaned || null;
}

export async function uploadMedia(file, altText, userId) {
  if (!file) throw new ApiError(422, 'IMAGE_REQUIRED', 'An image file is required.');
  const sanitizedAltText = cleanAltText(altText);
  let stored;
  try {
    stored = await storage.save(file.buffer);
    return await prisma.mediaFile.create({
      data: {
        provider: storage.provider,
        storageKey: stored.storageKey,
        filename: stored.filename,
        originalName: safeOriginalName(file.originalname) || 'image',
        mimeType: stored.mimeType,
        size: stored.size,
        width: stored.width,
        height: stored.height,
        url: stored.url,
        thumbnailUrl: stored.thumbnailUrl,
        altText: sanitizedAltText,
        uploadedById: userId
      }
    });
  } catch (error) {
    if (stored) {
      await storage
        .delete(stored.storageKey, stored.thumbnailUrl)
        .catch((cleanupError) =>
          logger.warn({ cleanupError }, 'Unable to clean up failed media upload')
        );
    }
    throw error;
  }
}

export async function replaceMedia(id, file, altText) {
  if (!file) throw new ApiError(422, 'IMAGE_REQUIRED', 'An image file is required.');
  const sanitizedAltText = cleanAltText(altText);
  const existing = await prisma.mediaFile.findFirst({
    where: { id, deletedAt: null }
  });
  if (!existing) throw new ApiError(404, 'MEDIA_NOT_FOUND', 'Media file was not found.');
  if (existing.provider !== 'LOCAL') {
    throw new ApiError(
      409,
      'STORAGE_PROVIDER_MISMATCH',
      'This media file must be replaced through its storage provider.'
    );
  }

  const stored = await storage.save(file.buffer);
  try {
    const updated = await prisma.mediaFile.update({
      where: { id },
      data: {
        storageKey: stored.storageKey,
        filename: stored.filename,
        originalName: safeOriginalName(file.originalname) || existing.originalName,
        mimeType: stored.mimeType,
        size: stored.size,
        width: stored.width,
        height: stored.height,
        url: stored.url,
        thumbnailUrl: stored.thumbnailUrl,
        ...(altText !== undefined ? { altText: sanitizedAltText } : {})
      }
    });
    await storage
      .delete(existing.storageKey, existing.thumbnailUrl)
      .catch((error) => logger.warn({ error, mediaId: id }, 'Old media cleanup failed'));
    return updated;
  } catch (error) {
    await storage
      .delete(stored.storageKey, stored.thumbnailUrl)
      .catch((cleanupError) =>
        logger.warn({ cleanupError }, 'Replacement cleanup failed')
      );
    throw error;
  }
}

export async function listMedia(query) {
  const { page, limit, skip, take } = getPagination(query, {
    defaultLimit: 24,
    maxLimit: 100
  });
  const where = {
    deletedAt: null,
    ...(query.search
      ? {
          OR: [
            { originalName: { contains: query.search, mode: 'insensitive' } },
            { altText: { contains: query.search, mode: 'insensitive' } }
          ]
        }
      : {})
  };
  const [items, total] = await prisma.$transaction([
    prisma.mediaFile.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    }),
    prisma.mediaFile.count({ where })
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}

export async function deleteMedia(id) {
  const media = await prisma.$transaction(async (transaction) => {
    const lockedMedia = await transaction.$queryRaw`
      SELECT "id"
      FROM "MediaFile"
      WHERE "id" = ${id} AND "deletedAt" IS NULL
      FOR UPDATE
    `;
    if (lockedMedia.length === 0) {
      throw new ApiError(404, 'MEDIA_NOT_FOUND', 'Media file was not found.');
    }

    const record = await transaction.mediaFile.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            doctorImages: true,
            departmentImages: true,
            serviceImages: true,
            branchImages: true,
            articleImages: true,
            testimonialImages: true,
            galleryItems: true,
            certificateFiles: true,
            leadershipImages: true,
            seoImages: true
          }
        }
      }
    });
    const references = Object.values(record._count).reduce((sum, count) => sum + count, 0);
    if (references > 0) {
      throw new ApiError(
        409,
        'MEDIA_IN_USE',
        'Media is still referenced and cannot be deleted.',
        { references }
      );
    }

    await transaction.mediaFile.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    return record;
  });

  if (media.provider === 'LOCAL') {
    await storage
      .delete(media.storageKey, media.thumbnailUrl)
      .catch((error) => logger.error({ error, mediaId: id }, 'Media file cleanup failed'));
  }
}
