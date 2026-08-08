import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  cacheAuthUser,
  clearAuthUserCache,
  getCachedAuthUser,
  invalidateAuthUser
} from '../src/utils/auth-user-cache.js';

test('auth user cache expires and supports explicit invalidation', () => {
  clearAuthUserCache();
  const user = { id: 'user-1' };
  cacheAuthUser(user.id, user, 2_000, 1_000);

  assert.equal(getCachedAuthUser(user.id, 2_999), user);
  assert.equal(getCachedAuthUser(user.id, 3_000), null);

  cacheAuthUser(user.id, user, 2_000, 5_000);
  invalidateAuthUser(user.id);
  assert.equal(getCachedAuthUser(user.id, 5_001), null);
});
