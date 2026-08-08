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
  assert.equal(result.searchParams.get('connection_limit'), '2');
  assert.equal(result.searchParams.get('connect_timeout'), '3');
  assert.equal(result.searchParams.get('pool_timeout'), '5');
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
  assert.equal(result.searchParams.get('pool_timeout'), '5');
});

test('uses a single resilient connection for a remote development database', () => {
  const result = new URL(
    buildDatabaseUrl('mysql://user:secret@db.example.com/database')
  );

  assert.equal(result.hostname, 'db.example.com');
  assert.equal(result.searchParams.get('connection_limit'), '1');
  assert.equal(result.searchParams.get('connect_timeout'), '10');
  assert.equal(result.searchParams.get('pool_timeout'), '20');
});

test('does not tune a local development database', () => {
  const result = new URL(
    buildDatabaseUrl('mysql://user:secret@127.0.0.1:3306/database')
  );

  assert.equal(result.hostname, 'localhost');
  assert.equal(result.search, '');
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
