import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildDatabaseUrl,
  databaseEndpointKind
} from '../src/config/database-url.js';

test('normalizes a MySQL loopback host and adds production pool safeguards', () => {
  const result = new URL(
    buildDatabaseUrl('mysql://user:secret@127.0.0.1:3306/database', {
      production: true
    })
  );

  assert.equal(result.hostname, 'localhost');
  assert.equal(result.searchParams.get('connection_limit'), '5');
  assert.equal(result.searchParams.get('connect_timeout'), '5');
  assert.equal(result.searchParams.get('pool_timeout'), '10');
});

test('preserves explicit production connection tuning', () => {
  const result = new URL(
    buildDatabaseUrl(
      'mysql://user:secret@db.example.com/database?connection_limit=2&connect_timeout=9',
      { production: true }
    )
  );

  assert.equal(result.hostname, 'db.example.com');
  assert.equal(result.searchParams.get('connection_limit'), '2');
  assert.equal(result.searchParams.get('connect_timeout'), '9');
  assert.equal(result.searchParams.get('pool_timeout'), '10');
});

test('classifies database endpoints without exposing credentials', () => {
  assert.equal(
    databaseEndpointKind('mysql://user:secret@localhost/database'),
    'local'
  );
  assert.equal(
    databaseEndpointKind('mysql://user:secret@db.example.com/database'),
    'remote'
  );
  assert.equal(databaseEndpointKind('not-a-url'), 'invalid');
});
