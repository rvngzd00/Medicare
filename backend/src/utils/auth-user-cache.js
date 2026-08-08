const DEFAULT_TTL_MS = 30_000;
const MAX_ENTRIES = 250;
const cache = new Map();

export function getCachedAuthUser(userId, now = Date.now()) {
  const entry = cache.get(userId);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    cache.delete(userId);
    return null;
  }
  return entry.user;
}

export function cacheAuthUser(userId, user, ttlMs = DEFAULT_TTL_MS, now = Date.now()) {
  if (cache.size >= MAX_ENTRIES && !cache.has(userId)) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(userId, {
    user,
    expiresAt: now + Math.max(1_000, ttlMs)
  });
  return user;
}

export function invalidateAuthUser(userId) {
  cache.delete(userId);
}

export function clearAuthUserCache() {
  cache.clear();
}
