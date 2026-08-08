import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getDatabaseCircuitState,
  resetDatabaseCircuit,
  tripDatabaseCircuit
} from '../src/utils/database-circuit.js';
import { guardDatabaseAvailability } from '../src/middleware/database-circuit.js';

test('opens the circuit only for database availability failures', () => {
  resetDatabaseCircuit();
  assert.equal(tripDatabaseCircuit(new Error('ordinary error'), 5_000, 1_000), false);
  assert.equal(getDatabaseCircuitState(1_000).open, false);

  const error = new Error('database unavailable');
  error.name = 'PrismaClientInitializationError';
  assert.equal(tripDatabaseCircuit(error, 5_000, 1_000), true);

  const state = getDatabaseCircuitState(2_000);
  assert.equal(state.open, true);
  assert.equal(state.retryAfterMs, 4_000);
  assert.equal(state.lastFailure.reason, 'initialization_failed');
});

test('automatically closes the circuit after its cooldown', () => {
  resetDatabaseCircuit();
  const error = Object.assign(new Error('pool timeout'), { code: 'P2024' });
  tripDatabaseCircuit(error, 2_000, 10_000);

  assert.equal(getDatabaseCircuitState(11_999).open, true);
  assert.equal(getDatabaseCircuitState(12_000).open, false);
});

test('rejects DB-backed routes immediately while the circuit is open', () => {
  resetDatabaseCircuit();
  const error = Object.assign(new Error('pool timeout'), { code: 'P2024' });
  tripDatabaseCircuit(error, 5_000);

  const headers = new Map();
  let forwardedError = null;
  guardDatabaseAvailability(
    {},
    { setHeader: (name, value) => headers.set(name, value) },
    (nextError) => {
      forwardedError = nextError || null;
    }
  );

  assert.equal(forwardedError?.statusCode, 503);
  assert.equal(forwardedError?.code, 'DATABASE_UNAVAILABLE');
  assert.equal(headers.has('Retry-After'), true);
  resetDatabaseCircuit();
});
