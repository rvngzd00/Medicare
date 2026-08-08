import { classifyDatabaseError, isDatabaseAvailabilityError } from './database-error.js';

let openedUntil = 0;
let lastFailure = null;

export function tripDatabaseCircuit(error, cooldownMs = 15_000, now = Date.now()) {
  if (!isDatabaseAvailabilityError(error)) return false;

  const databaseError = classifyDatabaseError(error);
  openedUntil = Math.max(openedUntil, now + Math.max(1_000, cooldownMs));
  lastFailure = {
    code: databaseError.code,
    reason: databaseError.reason,
    at: now
  };
  return true;
}

export function resetDatabaseCircuit() {
  openedUntil = 0;
  lastFailure = null;
}

export function getDatabaseCircuitState(now = Date.now()) {
  if (openedUntil <= now) {
    resetDatabaseCircuit();
    return { open: false, retryAfterMs: 0, lastFailure: null };
  }

  return {
    open: true,
    retryAfterMs: openedUntil - now,
    lastFailure
  };
}
