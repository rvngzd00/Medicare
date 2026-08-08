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

test('uses an explicit safe socket classification without exposing the error message', () => {
  const error = Object.assign(new Error('sensitive network details'), {
    databaseReason: 'socket_refused'
  });

  assert.deepEqual(classifyDatabaseError(error), {
    code: null,
    reason: 'socket_refused'
  });
});

test('classifies nested MySQL provider errors from Prisma raw queries', () => {
  const error = Object.assign(new Error('Raw query failed'), {
    code: 'P2010',
    meta: {
      code: '1045',
      message: 'Access denied for a database user with sensitive details'
    }
  });
  const result = classifyDatabaseError(error);
  assert.equal(result.code, 'P2010');
  assert.equal(result.providerCode, '1045');
  assert.equal(result.reason, 'authentication_failed');
  assert.equal(isDatabaseAvailabilityError(error), true);
});

test('classifies aggregate and nested connection failures', () => {
  const error = new AggregateError([
    Object.assign(new Error('connect failed'), { code: 'ECONNREFUSED' })
  ]);
  const result = classifyDatabaseError(error);
  assert.equal(result.providerCode, 'ECONNREFUSED');
  assert.equal(result.reason, 'server_unreachable');
  assert.equal(isDatabaseAvailabilityError(error), true);
});
