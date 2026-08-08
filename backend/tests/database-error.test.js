import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  classifyDatabaseError,
  isDatabaseAvailabilityError
} from '../src/utils/database-error.js';

test('classifies known Prisma connection errors without exposing their message', () => {
  const error = Object.assign(new Error('contains a secret connection string'), {
    code: 'P1000'
  });

  assert.deepEqual(classifyDatabaseError(error), {
    code: 'P1000',
    reason: 'authentication_failed'
  });
  assert.equal(isDatabaseAvailabilityError(error), true);
});

test('finds a Prisma error code through an error cause', () => {
  const error = new Error('wrapper', { cause: { code: 'P1001' } });

  assert.deepEqual(classifyDatabaseError(error), {
    code: 'P1001',
    reason: 'server_unreachable'
  });
});

test('does not misclassify unrelated application errors', () => {
  const error = Object.assign(new Error('unrelated'), { code: 'ENOENT' });

  assert.deepEqual(classifyDatabaseError(error), {
    code: null,
    reason: 'unknown'
  });
  assert.equal(isDatabaseAvailabilityError(error), false);
});
