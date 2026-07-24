import crypto from 'node:crypto';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

function monthPath(date = new Date()) {
  return [String(date.getUTCFullYear()), String(date.getUTCMonth() + 1).padStart(2, '0')];
}

function publicUrl(storageKey) {
  return `/uploads/${storageKey.split(path.sep).join('/')}`;
}

function safePath(storageKey) {
  const resolved = path.resolve(env.uploadDirectory, storageKey);
  const root = `${path.resolve(env.uploadDirectory)}${path.sep}`;
  if (!resolved.startsWith(root)) {
    throw new ApiError(400, 'INVALID_STORAGE_KEY', 'Invalid media storage key.');
  }
  return resolved;
}

export const localImageStorage = {
  provider: 'LOCAL',

  async save(buffer) {
    const image = sharp(buffer, {
      failOn: 'error',
      limitInputPixels: 40_000_000
    }).rotate();
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      throw new ApiError(422, 'INVALID_IMAGE', 'The uploaded file is not a valid image.');
    }

    const [year, month] = monthPath();
    const directory = path.join(env.uploadDirectory, year, month);
    await mkdir(directory, { recursive: true });

    const basename = crypto.randomUUID();
    const filename = `${basename}.webp`;
    const thumbnailFilename = `${basename}-thumb.webp`;
    const storageKey = path.join(year, month, filename);
    const thumbnailKey = path.join(year, month, thumbnailFilename);

    const [optimized, thumbnail] = await Promise.all([
      image
        .clone()
        .resize({
          width: 2400,
          height: 2400,
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 84, effort: 5 })
        .toBuffer({ resolveWithObject: true }),
      image
        .clone()
        .resize({
          width: 480,
          height: 480,
          fit: 'cover',
          position: 'attention',
          withoutEnlargement: false
        })
        .webp({ quality: 78, effort: 5 })
        .toBuffer()
    ]);

    await Promise.all([
      sharp(optimized.data).toFile(safePath(storageKey)),
      sharp(thumbnail).toFile(safePath(thumbnailKey))
    ]);

    return {
      storageKey,
      thumbnailKey,
      filename,
      mimeType: 'image/webp',
      size: optimized.data.byteLength,
      width: optimized.info.width,
      height: optimized.info.height,
      url: publicUrl(storageKey),
      thumbnailUrl: publicUrl(thumbnailKey)
    };
  },

  async delete(storageKey, thumbnailUrl) {
    const keys = [storageKey];
    if (thumbnailUrl?.startsWith('/uploads/')) {
      keys.push(thumbnailUrl.slice('/uploads/'.length));
    }
    await Promise.all(
      keys.map(async (key) => {
        try {
          await unlink(safePath(key));
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
        }
      })
    );
  }
};
