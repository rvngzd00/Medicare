import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif'
]);

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.uploadMaxBytes,
    files: 1,
    fields: 10,
    fieldSize: 16 * 1024,
    fieldNameSize: 100,
    parts: 11,
    headerPairs: 100
  },
  fileFilter(_request, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new ApiError(
          422,
          'UNSUPPORTED_FILE_TYPE',
          'Only JPEG, PNG, WebP and AVIF images are accepted.'
        )
      );
      return;
    }
    callback(null, true);
  }
});
