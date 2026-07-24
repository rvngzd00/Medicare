import multer from 'multer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/api-error.js';

function normalizeError(error) {
  if (error instanceof ApiError) return error;

  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'The uploaded image exceeds the allowed size.'
        : 'The file upload could not be processed.';
    return new ApiError(422, 'UPLOAD_FAILED', message);
  }

  if (error?.code === 'P2002') {
    return new ApiError(409, 'DUPLICATE_VALUE', 'A record with this value already exists.', {
      fields: error.meta?.target
    });
  }
  if (error?.code === 'P2003') {
    return new ApiError(
      409,
      'RELATION_CONFLICT',
      'This operation conflicts with a related record.'
    );
  }
  if (error?.code === 'P2025') {
    return new ApiError(404, 'RESOURCE_NOT_FOUND', 'The requested resource was not found.');
  }
  if (['P2000', 'P2006', 'P2011', 'P2023'].includes(error?.code)) {
    return new ApiError(422, 'INVALID_DATABASE_VALUE', 'A supplied value is invalid.');
  }
  if (error?.name === 'PrismaClientValidationError') {
    return new ApiError(422, 'VALIDATION_FAILED', 'The request data is invalid.');
  }
  if (Number.isInteger(error?.status) && error.status >= 400 && error.status < 500) {
    return new ApiError(
      error.status,
      error.status === 404 ? 'RESOURCE_NOT_FOUND' : 'REQUEST_FAILED',
      error.status === 404 ? 'The requested resource was not found.' : 'The request failed.'
    );
  }

  return new ApiError(500, 'INTERNAL_ERROR', 'An unexpected server error occurred.');
}

export function errorHandler(error, request, response, _next) {
  const normalized = normalizeError(error);
  const logPayload = {
    error,
    requestId: request.id,
    method: request.method,
    path: request.originalUrl,
    statusCode: normalized.statusCode
  };

  if (normalized.statusCode >= 500) logger.error(logPayload, 'Request failed');
  else logger.warn(logPayload, 'Request rejected');

  const body = {
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details ? { details: normalized.details } : {})
    },
    requestId: request.id
  };

  if (!env.isProduction && normalized.statusCode === 500) {
    body.error.debug = error.message;
  }

  response.status(normalized.statusCode).json(body);
}
