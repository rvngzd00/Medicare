const DATABASE_ERROR_REASONS = Object.freeze({
  P1000: 'authentication_failed',
  P1001: 'server_unreachable',
  P1002: 'connection_timeout',
  P1003: 'database_missing',
  P1010: 'access_denied',
  P1011: 'tls_error',
  P1012: 'configuration_invalid',
  P2010: 'query_failed',
  P2021: 'table_missing',
  P2022: 'column_missing',
  P2024: 'pool_timeout'
});

const MYSQL_ERROR_REASONS = Object.freeze({
  1044: 'access_denied',
  1045: 'authentication_failed',
  1049: 'database_missing',
  1129: 'host_blocked',
  1203: 'connection_limit',
  1226: 'resource_limit',
  2002: 'server_unreachable',
  2003: 'server_unreachable',
  2005: 'dns_failed',
  2013: 'connection_lost'
});

const SOCKET_ERROR_REASONS = Object.freeze({
  ECONNREFUSED: 'server_unreachable',
  ENOTFOUND: 'dns_failed',
  EAI_AGAIN: 'dns_failed',
  ETIMEDOUT: 'connection_timeout',
  ECONNRESET: 'connection_lost',
  EPIPE: 'connection_lost',
  EACCES: 'access_denied',
  EPERM: 'operation_not_permitted'
});

function errorObjects(error) {
  const queue = [error];
  const visited = new Set();
  const objects = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);
    objects.push(current);
    if (current.cause) queue.push(current.cause);
    if (current.originalError) queue.push(current.originalError);
    if (current.meta) queue.push(current.meta);
    if (Array.isArray(current.errors)) queue.push(...current.errors);
  }

  return objects;
}

function findPrismaCode(objects) {
  for (const current of objects) {
    for (const candidate of [current.code, current.errorCode]) {
      if (typeof candidate === 'string' && /^P\d{4}$/.test(candidate)) {
        return candidate;
      }
    }
  }
  return null;
}

function findProviderCode(objects) {
  for (const current of objects) {
    for (const candidate of [current.errno, current.code]) {
      const normalized = String(candidate || '').replace(/^MYSQL_/, '');
      if (MYSQL_ERROR_REASONS[normalized]) return normalized;
      if (SOCKET_ERROR_REASONS[normalized]) return normalized;
    }
  }
  return null;
}

function classifyMessage(objects) {
  const message = objects
    .map((current) => (typeof current.message === 'string' ? current.message : ''))
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!message) return null;
  if (message.includes('too many connections')) return 'connection_limit';
  if (message.includes('operation not permitted')) return 'operation_not_permitted';
  if (message.includes('access denied')) return 'authentication_failed';
  if (message.includes('unknown database')) return 'database_missing';
  if (message.includes("can't reach database server")) return 'server_unreachable';
  if (message.includes('connection refused')) return 'server_unreachable';
  if (message.includes('timed out') || message.includes('timeout')) {
    return 'connection_timeout';
  }
  if (message.includes('permission denied')) return 'access_denied';
  if (message.includes('connection reset') || message.includes('closed the connection')) {
    return 'connection_lost';
  }

  return null;
}

export function classifyDatabaseError(error) {
  const objects = errorObjects(error);
  const code = findPrismaCode(objects);
  const providerCode = findProviderCode(objects);
  const providerReason =
    MYSQL_ERROR_REASONS[providerCode] || SOCKET_ERROR_REASONS[providerCode];
  const initializationError = objects.some(
    (current) => current.name === 'PrismaClientInitializationError'
  );
  return {
    code,
    ...(providerCode ? { providerCode } : {}),
    reason:
      error?.databaseReason ||
      providerReason ||
      (code === 'P2010' ? classifyMessage(objects) : null) ||
      DATABASE_ERROR_REASONS[code] ||
      classifyMessage(objects) ||
      (initializationError
        ? 'initialization_failed'
        : 'unknown')
  };
}

export function isDatabaseAvailabilityError(error) {
  const { code, reason } = classifyDatabaseError(error);
  return (
    error?.name === 'PrismaClientInitializationError' ||
    [
      'authentication_failed',
      'server_unreachable',
      'connection_timeout',
      'database_missing',
      'access_denied',
      'tls_error',
      'configuration_invalid',
      'pool_timeout',
      'host_blocked',
      'connection_limit',
      'resource_limit',
      'dns_failed',
      'connection_lost',
      'operation_not_permitted'
    ].includes(reason) ||
    Boolean(
      code &&
        (code.startsWith('P10') ||
          code === 'P2021' ||
          code === 'P2022' ||
          code === 'P2024')
    )
  );
}
