const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', '[::1]']);

export function buildDatabaseUrl(rawUrl, { production = false } = {}) {
  if (!rawUrl) return rawUrl;

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'mysql:') return rawUrl;

    if (LOOPBACK_HOSTS.has(url.hostname)) url.hostname = 'localhost';

    if (production) {
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '2');
      }
      if (!url.searchParams.has('connect_timeout')) {
        url.searchParams.set('connect_timeout', '3');
      }
      if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '5');
      }
    } else if (!LOOPBACK_HOSTS.has(url.hostname) && url.hostname !== 'localhost') {
      // Remote development databases are commonly reached through a restricted
      // firewall/NAT path. Keep one persistent connection instead of opening a
      // large local pool that can intermittently land on a different route.
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '1');
      }
      if (!url.searchParams.has('connect_timeout')) {
        url.searchParams.set('connect_timeout', '10');
      }
      if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '20');
      }
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
