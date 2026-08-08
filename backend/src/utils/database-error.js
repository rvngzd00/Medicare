const DATABASE_ERROR_REASONS = Object.freeze({
  P1000: 'authentication_failed',
  P1001: 'server_unreachable',
  P1002: 'connection_timeout',
  P1003: 'database_missing',
  P1010: 'access_denied',
  P1011: 'tls_error',
  P1012: 'configuration_invalid',
  P2021: 'table_missing',
  P2022: 'column_missing'
});

function findPrismaCode(error) {
  let current = error;
  const visited = new Set();

  while (current && typeof current === 'object' && !visited.has(current)) {
    visited.add(current);
    if (typeof current.code === 'string' && /^P\d{4}$/.test(current.code)) {
      return current.code;
    }
    current = current.cause;
  }

  return null;
}

export function classifyDatabaseError(error) {
  const code = findPrismaCode(error);
  return {
    code,
    reason: DATABASE_ERROR_REASONS[code] || 'unknown'
  };
}

export function isDatabaseAvailabilityError(error) {
  const { code } = classifyDatabaseError(error);
  return Boolean(code && (code.startsWith('P10') || code === 'P2021' || code === 'P2022'));
}
