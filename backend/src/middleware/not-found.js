import { ApiError } from '../utils/api-error.js';

export function notFound(request, _response, next) {
  next(
    new ApiError(
      404,
      'ROUTE_NOT_FOUND',
      `No route matches ${request.method} ${request.originalUrl}.`
    )
  );
}
