import { ApiError } from '../utils/api-error.js';
import { getDatabaseCircuitState } from '../utils/database-circuit.js';

export function guardDatabaseAvailability(_request, response, next) {
  const state = getDatabaseCircuitState();
  if (!state.open) return next();

  const retryAfterSeconds = Math.max(1, Math.ceil(state.retryAfterMs / 1000));
  response.setHeader('Retry-After', String(retryAfterSeconds));
  return next(
    new ApiError(
      503,
      'DATABASE_UNAVAILABLE',
      'The database is temporarily unavailable.',
      {
        reason: state.lastFailure?.reason || 'circuit_open',
        retryAfterSeconds
      }
    )
  );
}
