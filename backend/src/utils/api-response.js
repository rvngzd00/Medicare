export function success(response, data, options = {}) {
  const body = { success: true, data };
  if (options.meta) body.meta = options.meta;
  if (options.message) body.message = options.message;
  return response.status(options.statusCode || 200).json(body);
}
