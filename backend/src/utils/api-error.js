export class ApiError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export function assert(condition, statusCode, code, message, details) {
  if (!condition) throw new ApiError(statusCode, code, message, details);
}
