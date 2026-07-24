import sanitizeHtml from 'sanitize-html';

const preservedKeys = new Set(['password', 'refreshToken', 'token']);
const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);

function clean(value, key = '') {
  if (preservedKeys.has(key)) return value;
  if (typeof value === 'string') {
    return sanitizeHtml(value.trim(), {
      allowedTags: [],
      allowedAttributes: {}
    });
  }
  if (Array.isArray(value)) return value.map((item) => clean(item));
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([entryKey]) => !forbiddenKeys.has(entryKey))
        .map(([entryKey, entryValue]) => [entryKey, clean(entryValue, entryKey)])
    );
  }
  return value;
}

export function sanitizeInput(request, _response, next) {
  if (request.body) request.body = clean(request.body);
  if (request.params) request.params = clean(request.params);
  next();
}
