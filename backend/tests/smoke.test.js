import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import request from 'supertest';

let app;

before(async () => {
  process.env.NODE_ENV = 'test';
  ({ app } = await import('../src/app.js'));
});

test('liveness endpoint does not require a database connection', async () => {
  const response = await request(app).get('/health').expect(200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.status, 'ok');
  assert.ok(response.headers['x-request-id']);
});

test('security headers are enabled', async () => {
  const response = await request(app).get('/health').expect(200);
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['x-frame-options'], 'SAMEORIGIN');
});

test('invalid contact payload is rejected before database access', async () => {
  const response = await request(app)
    .post('/api/v1/public/contact')
    .send({ firstName: 'A' })
    .expect(422);
  assert.equal(response.body.error.code, 'VALIDATION_FAILED');
});

test('admin routes require authentication', async () => {
  const response = await request(app).get('/api/v1/admin/dashboard').expect(401);
  assert.equal(response.body.error.code, 'AUTHENTICATION_REQUIRED');
});

test('unknown routes return a consistent error envelope', async () => {
  const response = await request(app).get('/does-not-exist').expect(404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, 'ROUTE_NOT_FOUND');
});
