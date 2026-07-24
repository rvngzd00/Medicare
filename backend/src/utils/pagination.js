export function getPagination(query, options = {}) {
  const defaultLimit = options.defaultLimit || 12;
  const maxLimit = options.maxLimit || 100;
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(Number.parseInt(query.limit, 10) || defaultLimit, 1),
    maxLimit
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit
  };
}

export function paginationMeta(total, page, limit) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPreviousPage: page > 1
  };
}
