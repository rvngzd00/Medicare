import { prisma } from '../config/prisma.js';
import { adminEntities } from '../constants/admin-entities.js';
import { ApiError } from '../utils/api-error.js';
import { getPagination, paginationMeta } from '../utils/pagination.js';
import { toSlug } from '../utils/slug.js';

const idPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getDefinition(entity) {
  const definition = adminEntities[entity];
  if (!definition) {
    throw new ApiError(404, 'ADMIN_ENTITY_NOT_FOUND', 'Admin resource was not found.');
  }
  return definition;
}

function isSafeUrl(value, { allowInternal = false } = {}) {
  if (allowInternal && /^\/(?!\/)/.test(value)) return true;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function validateScalarTypes(definition, data) {
  for (const field of definition.integers || []) {
    if (
      data[field] !== undefined &&
      (!Number.isInteger(data[field]) || Math.abs(data[field]) > Number.MAX_SAFE_INTEGER)
    ) {
      throw new ApiError(422, 'VALIDATION_FAILED', `${field} must be an integer.`);
    }
  }
  for (const field of definition.booleans || []) {
    if (data[field] !== undefined && typeof data[field] !== 'boolean') {
      throw new ApiError(422, 'VALIDATION_FAILED', `${field} must be a boolean.`);
    }
  }
  for (const field of definition.stringArrays || []) {
    if (
      data[field] !== undefined &&
      (!Array.isArray(data[field]) ||
        data[field].some((value) => typeof value !== 'string'))
    ) {
      throw new ApiError(
        422,
        'VALIDATION_FAILED',
        `${field} must be an array of strings.`
      );
    }
  }
  for (const [field, maxLength] of Object.entries(definition.maxLengths || {})) {
    if (typeof data[field] === 'string' && data[field].trim().length > maxLength) {
      throw new ApiError(422, 'VALIDATION_FAILED', `${field} is too long.`);
    }
  }
  for (const [field, limits] of Object.entries(definition.arrayLimits || {})) {
    if (data[field] === undefined) continue;
    if (data[field].length > limits.maxItems) {
      throw new ApiError(422, 'VALIDATION_FAILED', `${field} has too many items.`);
    }
    if (data[field].some((value) => value.trim().length > limits.maxLength)) {
      throw new ApiError(422, 'VALIDATION_FAILED', `${field} contains an item that is too long.`);
    }
  }
  for (const field of definition.idArrays || []) {
    if (
      data[field] !== undefined &&
      (!Array.isArray(data[field]) ||
        data[field].some((value) => typeof value !== 'string' || !idPattern.test(value)))
    ) {
      throw new ApiError(
        422,
        'VALIDATION_FAILED',
        `${field} must be an array of UUID values.`
      );
    }
  }
  for (const [field, values] of Object.entries(definition.enums || {})) {
    if (data[field] !== undefined && !values.includes(data[field])) {
      throw new ApiError(422, 'VALIDATION_FAILED', `${field} is invalid.`);
    }
  }
  for (const field of definition.jsonFields || []) {
    if (
      data[field] !== undefined &&
      (typeof data[field] !== 'object' || Array.isArray(data[field]))
    ) {
      throw new ApiError(422, 'VALIDATION_FAILED', `${field} must be an object.`);
    }
  }

  for (const [field, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (
      field.endsWith('Id') &&
      typeof value === 'string' &&
      !idPattern.test(value)
    ) {
      throw new ApiError(422, 'VALIDATION_FAILED', `${field} must be a UUID.`);
    }
  }

  const nonStringFields = new Set([
    ...(definition.integers || []),
    ...(definition.booleans || []),
    ...(definition.stringArrays || []),
    ...(definition.idArrays || []),
    ...(definition.dateFields || []),
    ...(definition.jsonFields || []),
    ...Object.keys(definition.enums || {}),
    'seo',
    'priceFrom',
    'latitude',
    'longitude',
    'educations',
    'experiences',
    'certificates',
    'schedules',
    'priceItems'
  ]);
  for (const field of definition.writable) {
    const value = data[field];
    if (
      value !== undefined &&
      value !== null &&
      !nonStringFields.has(field) &&
      typeof value !== 'string'
    ) {
      throw new ApiError(422, 'VALIDATION_FAILED', `${field} must be a string.`);
    }
    if (typeof value === 'string' && value.length > 50_000) {
      throw new ApiError(422, 'VALIDATION_FAILED', `${field} is too long.`);
    }
  }
  for (const field of definition.webUrls || []) {
    if (
      data[field] !== undefined &&
      data[field] !== null &&
      data[field] !== '' &&
      !isSafeUrl(data[field])
    ) {
      throw new ApiError(422, 'VALIDATION_FAILED', `${field} must be a valid HTTP URL.`);
    }
  }
  for (const field of definition.linkUrls || []) {
    if (
      data[field] !== undefined &&
      data[field] !== null &&
      data[field] !== '' &&
      !isSafeUrl(data[field], { allowInternal: true })
    ) {
      throw new ApiError(
        422,
        'VALIDATION_FAILED',
        `${field} must be an internal path or a valid HTTP URL.`
      );
    }
  }

  for (const field of ['priceFrom', 'latitude', 'longitude']) {
    if (data[field] === undefined || data[field] === null) continue;
    if (
      (typeof data[field] !== 'number' && typeof data[field] !== 'string') ||
      !Number.isFinite(Number(data[field]))
    ) {
      throw new ApiError(422, 'VALIDATION_FAILED', `${field} must be numeric.`);
    }
  }
  if (data.priceFrom !== undefined && Number(data.priceFrom) < 0) {
    throw new ApiError(422, 'VALIDATION_FAILED', 'priceFrom cannot be negative.');
  }
  if (
    data.latitude !== undefined &&
    (Number(data.latitude) < -90 || Number(data.latitude) > 90)
  ) {
    throw new ApiError(422, 'VALIDATION_FAILED', 'latitude must be between -90 and 90.');
  }
  if (
    data.longitude !== undefined &&
    (Number(data.longitude) < -180 || Number(data.longitude) > 180)
  ) {
    throw new ApiError(
      422,
      'VALIDATION_FAILED',
      'longitude must be between -180 and 180.'
    );
  }
  if (
    data.rating !== undefined &&
    (data.rating < 1 || data.rating > 5)
  ) {
    throw new ApiError(422, 'VALIDATION_FAILED', 'rating must be between 1 and 5.');
  }
  if (
    data.experienceYears !== undefined &&
    (data.experienceYears < 0 || data.experienceYears > 80)
  ) {
    throw new ApiError(
      422,
      'VALIDATION_FAILED',
      'experienceYears must be between 0 and 80.'
    );
  }
}

function normalizeSeo(seo, action) {
  if (seo === null) return action === 'update' ? { disconnect: true } : undefined;
  if (!seo || typeof seo !== 'object' || Array.isArray(seo)) {
    throw new ApiError(422, 'VALIDATION_FAILED', 'seo must be an object.');
  }
  const writableSeo = [
    'pageKey',
    'title',
    'description',
    'canonicalUrl',
    'keywords',
    'robots',
    'ogTitle',
    'ogDescription',
    'ogImageId',
    'twitterCard',
    'structuredData'
  ];
  const unknown = Object.keys(seo).filter((key) => !writableSeo.includes(key));
  if (unknown.length > 0) {
    throw new ApiError(422, 'VALIDATION_FAILED', 'Unsupported SEO fields.', {
      fields: unknown
    });
  }
  if (!seo.title || !seo.description) {
    throw new ApiError(
      422,
      'VALIDATION_FAILED',
      'SEO title and description are required.'
    );
  }
  if (seo.canonicalUrl && !isSafeUrl(seo.canonicalUrl)) {
    throw new ApiError(
      422,
      'VALIDATION_FAILED',
      'SEO canonicalUrl must be a valid HTTP URL.'
    );
  }
  if (
    seo.keywords !== undefined &&
    (!Array.isArray(seo.keywords) ||
      seo.keywords.some((keyword) => typeof keyword !== 'string'))
  ) {
    throw new ApiError(
      422,
      'VALIDATION_FAILED',
      'SEO keywords must be an array of strings.'
    );
  }
  if (seo.ogImageId && !idPattern.test(seo.ogImageId)) {
    throw new ApiError(422, 'VALIDATION_FAILED', 'SEO image ID must be a UUID.');
  }
  const normalized = { ...seo, keywords: seo.keywords || [] };
  if (action === 'create') return { create: normalized };
  return { upsert: { create: normalized, update: normalized } };
}

function normalizeNestedCollection(value, name) {
  if (!Array.isArray(value) || value.some((item) => !item || typeof item !== 'object')) {
    throw new ApiError(422, 'VALIDATION_FAILED', `${name} must be an array of objects.`);
  }
  const rules = {
    educations: {
      allowed: [
        'institution',
        'degree',
        'field',
        'startYear',
        'endYear',
        'description',
        'sortOrder'
      ],
      required: ['institution', 'degree']
    },
    experiences: {
      allowed: [
        'organization',
        'position',
        'startDate',
        'endDate',
        'current',
        'description',
        'sortOrder'
      ],
      required: ['organization', 'position']
    },
    certificates: {
      allowed: [
        'title',
        'issuer',
        'issuedAt',
        'expiresAt',
        'credentialUrl',
        'sortOrder'
      ],
      required: ['title']
    },
    schedules: {
      allowed: [
        'branchId',
        'dayOfWeek',
        'startTime',
        'endTime',
        'slotMinutes',
        'active'
      ],
      required: ['branchId', 'dayOfWeek', 'startTime', 'endTime']
    },
    priceItems: {
      allowed: ['code', 'name', 'price', 'currency', 'note', 'active', 'sortOrder'],
      required: ['name']
    }
  };
  if (name === 'priceItems' && value.length > 200) {
    throw new ApiError(422, 'VALIDATION_FAILED', 'A service can contain at most 200 price items.');
  }
  const rule = rules[name];
  return value.map(({ id: _id, doctorId: _doctorId, serviceId: _serviceId, createdAt: _createdAt, updatedAt: _updatedAt, ...item }) => {
    for (const [field, fieldValue] of Object.entries(item)) {
      if (typeof fieldValue === 'string') item[field] = fieldValue.trim();
    }
    const unsupported = Object.keys(item).filter(
      (field) => !rule.allowed.includes(field)
    );
    if (unsupported.length > 0) {
      throw new ApiError(422, 'VALIDATION_FAILED', `Unsupported ${name} fields.`, {
        fields: unsupported
      });
    }
    const missing = rule.required.filter(
      (field) => item[field] === undefined || item[field] === null || item[field] === ''
    );
    if (missing.length > 0) {
      throw new ApiError(422, 'VALIDATION_FAILED', `Required ${name} fields are missing.`, {
        fields: missing
      });
    }
    if (item.branchId && !idPattern.test(item.branchId)) {
      throw new ApiError(422, 'VALIDATION_FAILED', 'Schedule branchId must be a UUID.');
    }
    if (
      item.dayOfWeek &&
      ![
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY'
      ].includes(item.dayOfWeek)
    ) {
      throw new ApiError(422, 'VALIDATION_FAILED', 'Schedule dayOfWeek is invalid.');
    }
    for (const timeField of ['startTime', 'endTime']) {
      if (
        item[timeField] &&
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(item[timeField])
      ) {
        throw new ApiError(
          422,
          'VALIDATION_FAILED',
          `${timeField} must use HH:mm format.`
        );
      }
    }
    for (const integerField of [
      'startYear',
      'endYear',
      'sortOrder',
      'slotMinutes'
    ]) {
      if (
        item[integerField] !== undefined &&
        (!Number.isInteger(item[integerField]) || item[integerField] < 0)
      ) {
        throw new ApiError(
          422,
          'VALIDATION_FAILED',
          `${integerField} must be a non-negative integer.`
        );
      }
    }
    for (const booleanField of ['current', 'active']) {
      if (
        item[booleanField] !== undefined &&
        typeof item[booleanField] !== 'boolean'
      ) {
        throw new ApiError(
          422,
          'VALIDATION_FAILED',
          `${booleanField} must be a boolean.`
        );
      }
    }
    if (name === 'priceItems') {
      if (item.name.length > 500 || item.code?.length > 80 || item.note?.length > 1000) {
        throw new ApiError(422, 'VALIDATION_FAILED', 'A price item field is too long.');
      }
      if (item.currency !== undefined && !['AZN', 'USD', 'EUR'].includes(item.currency)) {
        throw new ApiError(422, 'VALIDATION_FAILED', 'Price item currency is invalid.');
      }
      if (item.price === '' || item.price === null) item.price = null;
      else if (item.price !== undefined) {
        if (!Number.isFinite(Number(item.price)) || Number(item.price) < 0) {
          throw new ApiError(422, 'VALIDATION_FAILED', 'Price item price must be non-negative.');
        }
        item.price = Number(item.price).toFixed(2);
      }
      item.currency ||= 'AZN';
      item.active ??= true;
    }
    for (const key of ['startDate', 'endDate', 'issuedAt', 'expiresAt']) {
      if (item[key]) {
        const parsed = new Date(item[key]);
        if (Number.isNaN(parsed.getTime())) {
          throw new ApiError(422, 'VALIDATION_FAILED', `${key} must be a valid date.`);
        }
        item[key] = parsed;
      }
    }
    if (item.credentialUrl && !isSafeUrl(item.credentialUrl)) {
      throw new ApiError(
        422,
        'VALIDATION_FAILED',
        'credentialUrl must be a valid HTTP URL.'
      );
    }
    return item;
  });
}

function normalizeData(definition, input, action) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ApiError(422, 'VALIDATION_FAILED', 'Request body must be an object.');
  }
  const unknownFields = Object.keys(input).filter(
    (field) => !definition.writable.includes(field)
  );
  if (unknownFields.length > 0) {
    throw new ApiError(422, 'VALIDATION_FAILED', 'Unsupported fields were supplied.', {
      fields: unknownFields
    });
  }
  const missingFields = definition.required.filter((field) => {
    if (action === 'update' && !(field in input)) return false;
    const value = input[field];
    return (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '')
    );
  });
  if (missingFields.length > 0) {
    throw new ApiError(422, 'VALIDATION_FAILED', 'Required fields are missing.', {
      fields: missingFields
    });
  }

  validateScalarTypes(definition, input);
  const data = { ...input };

  for (const [field, value] of Object.entries(data)) {
    if (typeof value === 'string') data[field] = value.trim();
  }
  for (const field of definition.stringArrays || []) {
    if (data[field] !== undefined) {
      data[field] = data[field].map((value) => value.trim()).filter(Boolean);
    }
  }

  for (const dateField of definition.dateFields || []) {
    if (data[dateField] === null || data[dateField] === '') {
      data[dateField] = null;
    } else if (data[dateField] !== undefined) {
      const parsed = new Date(data[dateField]);
      if (Number.isNaN(parsed.getTime())) {
        throw new ApiError(
          422,
          'VALIDATION_FAILED',
          `${dateField} must be a valid date.`
        );
      }
      data[dateField] = parsed;
    }
  }

  if (definition.slugSource && !data.slug && action === 'create') {
    data.slug = toSlug(definition.slugSource(data));
  } else if (data.slug) {
    data.slug = toSlug(data.slug);
  }
  if (definition.slugSource && action === 'create' && !data.slug) {
    throw new ApiError(422, 'VALIDATION_FAILED', 'A valid slug could not be generated.');
  }

  if ('seo' in data) {
    data.seo = normalizeSeo(data.seo, action);
    if (!data.seo) delete data.seo;
  }

  const relationMaps = {
    serviceIds: 'services',
    doctorIds: 'doctors',
    branchIds: 'branches',
    departmentIds: 'departments',
    categoryIds: 'categories'
  };
  for (const [inputField, relation] of Object.entries(relationMaps)) {
    if (!(inputField in data)) continue;
    const connections = data[inputField].map((id) => ({ id }));
    data[relation] =
      action === 'create' ? { connect: connections } : { set: connections };
    delete data[inputField];
  }

  for (const collection of [
    'educations',
    'experiences',
    'certificates',
    'schedules',
    'priceItems'
  ]) {
    if (!(collection in data)) continue;
    const items = normalizeNestedCollection(data[collection], collection);
    if (collection === 'priceItems') {
      const prices = items
        .filter((item) => item.active !== false && item.price !== null && item.price !== undefined)
        .map((item) => Number(item.price));
      data.priceFrom = prices.length ? Math.min(...prices).toFixed(2) : null;
      data.currency = items.find((item) => item.currency)?.currency || data.currency || 'AZN';
    }
    data[collection] =
      action === 'create'
        ? { create: items }
        : { deleteMany: {}, create: items };
  }

  return data;
}

async function lockMediaReferences(transaction, definition, data) {
  const mediaIds = (definition.mediaFields || [])
    .map((field) => data[field])
    .filter(Boolean);
  for (const mediaId of new Set(mediaIds)) {
    const records = await transaction.$queryRaw`
      SELECT "id"
      FROM "MediaFile"
      WHERE "id" = ${mediaId} AND "deletedAt" IS NULL
      FOR UPDATE
    `;
    if (records.length === 0) {
      throw new ApiError(422, 'VALIDATION_FAILED', 'The selected image was not found.');
    }
  }
}

export async function listAdminRecords(entity, query) {
  const definition = getDefinition(entity);
  const delegate = prisma[definition.delegate];
  const { page, limit, skip, take } = getPagination(query, {
    defaultLimit: 20,
    maxLimit: 100
  });
  const where = {
    ...(definition.softDelete ? { deletedAt: null } : {}),
    ...(query.search
      ? {
          OR: definition.searchFields.map((field) => ({
            [field]: { contains: query.search, mode: 'insensitive' }
          }))
        }
      : {}),
    ...(query.status && definition.writable.includes('status')
      ? { status: query.status }
      : {}),
    ...(query.active !== undefined && definition.booleans?.includes('active')
      ? { active: query.active }
      : {})
  };

  const [items, total] = await prisma.$transaction([
    delegate.findMany({
      where,
      skip,
      take,
      orderBy: definition.orderBy,
      ...(definition.include ? { include: definition.include } : {})
    }),
    delegate.count({ where })
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}

export async function getAdminRecord(entity, id) {
  const definition = getDefinition(entity);
  const record = await prisma[definition.delegate].findFirst({
    where: {
      id,
      ...(definition.softDelete ? { deletedAt: null } : {})
    },
    ...(definition.include ? { include: definition.include } : {})
  });
  if (!record) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Resource was not found.');
  return record;
}

export async function createAdminRecord(entity, input) {
  const definition = getDefinition(entity);
  if (definition.allowCreate === false) {
    throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'This resource cannot be created here.');
  }
  const data = normalizeData(definition, input, 'create');
  if (!definition.mediaFields?.length) {
    return prisma[definition.delegate].create({
      data,
      ...(definition.include ? { include: definition.include } : {})
    });
  }
  return prisma.$transaction(async (transaction) => {
    await lockMediaReferences(transaction, definition, data);
    return transaction[definition.delegate].create({
      data,
      ...(definition.include ? { include: definition.include } : {})
    });
  });
}

export async function updateAdminRecord(entity, id, input) {
  const definition = getDefinition(entity);
  await getAdminRecord(entity, id);
  const data = normalizeData(definition, input, 'update');
  if (!definition.mediaFields?.length) {
    return prisma[definition.delegate].update({
      where: { id },
      data,
      ...(definition.include ? { include: definition.include } : {})
    });
  }
  return prisma.$transaction(async (transaction) => {
    await lockMediaReferences(transaction, definition, data);
    return transaction[definition.delegate].update({
      where: { id },
      data,
      ...(definition.include ? { include: definition.include } : {})
    });
  });
}

export async function reorderAdminRecords(entity, ids) {
  const definition = getDefinition(entity);
  if (!definition.integers?.includes('sortOrder')) {
    throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'This resource cannot be reordered.');
  }
  const existing = await prisma[definition.delegate].findMany({
    where: {
      id: { in: ids },
      ...(definition.softDelete ? { deletedAt: null } : {})
    },
    select: { id: true }
  });
  if (existing.length !== ids.length) {
    throw new ApiError(422, 'VALIDATION_FAILED', 'One or more records were not found.');
  }
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma[definition.delegate].update({
        where: { id },
        data: { sortOrder: index + 1 }
      })
    )
  );
  return prisma[definition.delegate].findMany({
    where: {
      id: { in: ids },
      ...(definition.softDelete ? { deletedAt: null } : {})
    },
    orderBy: definition.orderBy,
    ...(definition.include ? { include: definition.include } : {})
  });
}

export async function deleteAdminRecord(entity, id) {
  const definition = getDefinition(entity);
  if (definition.allowDelete === false) {
    throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'This resource cannot be deleted.');
  }
  await getAdminRecord(entity, id);
  if (definition.softDelete) {
    return prisma[definition.delegate].update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
  return prisma[definition.delegate].delete({ where: { id } });
}

export async function restoreAdminRecord(entity, id) {
  const definition = getDefinition(entity);
  if (!definition.softDelete) {
    throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'This resource cannot be restored.');
  }
  const existing = await prisma[definition.delegate].findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Resource was not found.');
  return prisma[definition.delegate].update({
    where: { id },
    data: { deletedAt: null },
    ...(definition.include ? { include: definition.include } : {})
  });
}

export function getAdminDefinition(entity) {
  return getDefinition(entity);
}
