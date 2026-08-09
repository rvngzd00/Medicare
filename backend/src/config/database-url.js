const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', '[::1]']);

export function buildDatabaseUrl(rawUrl) {
  if (!rawUrl) return rawUrl;

  try {
    const url = new URL(rawUrl);

    if (url.protocol !== 'mysql:') {
      return rawUrl;
    }

    if (LOOPBACK_HOSTS.has(url.hostname)) {
      url.hostname = 'localhost';
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

export function databaseEndpointKind(rawUrl) {
  try {
    const url = new URL(rawUrl);

    return LOOPBACK_HOSTS.has(url.hostname) || url.hostname === 'localhost'
      ? 'local'
      : 'remote';
  } catch {
    return 'invalid';
  }
}