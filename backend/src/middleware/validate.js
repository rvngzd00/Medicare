import { ApiError } from '../utils/api-error.js';

export function validate(schemas) {
  return function validationMiddleware(request, _response, next) {
    const errors = [];

    for (const location of ['params', 'query', 'body']) {
      if (!schemas[location]) continue;
      const result = schemas[location].safeParse(request[location]);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((issue) => ({
            location,
            path: issue.path.join('.'),
            message: issue.message
          }))
        );
      } else {
        request[location] = result.data;
      }
    }

    if (errors.length > 0) {
      return next(
        new ApiError(422, 'VALIDATION_FAILED', 'The request data is invalid.', errors)
      );
    }
    return next();
  };
}
