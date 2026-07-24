import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/api-error.js';
import { toSlug } from '../utils/slug.js';

const sectionInclude = {
  where: { deletedAt: null },
  orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
};

const pageInclude = {
  seo: true,
  sections: sectionInclude
};
const reservedSlugs = new Set([
  'admin',
  'api',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml'
]);

function actorDetails(actor) {
  if (!actor) return { actorId: null, actorLabel: null };
  return {
    actorId: actor.id || null,
    actorLabel:
      [actor.firstName, actor.lastName].filter(Boolean).join(' ') ||
      actor.email ||
      null
  };
}

function pageSnapshot(page) {
  return {
    version: 1,
    page: {
      slug: page.slug,
      title: page.title,
      excerpt: page.excerpt,
      body: page.body,
      template: page.template,
      status: page.status,
      seo: page.seo
        ? {
            title: page.seo.title,
            description: page.seo.description,
            canonicalUrl: page.seo.canonicalUrl,
            keywords: page.seo.keywords,
            robots: page.seo.robots,
            ogTitle: page.seo.ogTitle,
            ogDescription: page.seo.ogDescription,
            twitterCard: page.seo.twitterCard,
            structuredData: page.seo.structuredData
          }
        : null
    },
    sections: page.sections.map((section) => ({
      id: section.id,
      key: section.key,
      type: section.type,
      label: section.label,
      eyebrow: section.eyebrow,
      title: section.title,
      description: section.description,
      content: section.content,
      active: section.active,
      locked: section.locked,
      sortOrder: section.sortOrder
    }))
  };
}

async function findPageOrThrow(client, id) {
  const page = await client.contentPage.findFirst({
    where: { id, deletedAt: null },
    include: pageInclude
  });
  if (!page) {
    throw new ApiError(404, 'PAGE_NOT_FOUND', 'Content page was not found.');
  }
  return page;
}

async function assertSlugAvailable(client, slug, exceptId) {
  if (reservedSlugs.has(slug)) {
    throw new ApiError(
      422,
      'PAGE_SLUG_RESERVED',
      'This URL slug is reserved by the application.'
    );
  }
  const existing = await client.contentPage.findFirst({
    where: {
      slug,
      ...(exceptId ? { id: { not: exceptId } } : {})
    },
    select: { id: true }
  });
  if (existing) {
    throw new ApiError(
      409,
      'PAGE_SLUG_EXISTS',
      'Another page already uses this URL slug.'
    );
  }
}

function normalizeSections(sections) {
  const keys = new Set();
  return sections.map((section, index) => {
    const key = toSlug(section.key || section.label || `section-${index + 1}`);
    if (!key) {
      throw new ApiError(
        422,
        'SECTION_KEY_INVALID',
        'Every page section needs a valid key.'
      );
    }
    if (keys.has(key)) {
      throw new ApiError(
        422,
        'SECTION_KEY_DUPLICATE',
        `The section key "${key}" is used more than once.`
      );
    }
    keys.add(key);
    validateContentLinks(section.content || {}, section.label);
    return {
      ...section,
      key,
      label: section.label.trim(),
      type: section.type.trim().toUpperCase(),
      eyebrow: section.eyebrow || null,
      title: section.title || null,
      description: section.description || null,
      content: section.content || {},
      active: section.active !== false,
      locked: Boolean(section.locked),
      sortOrder: index
    };
  });
}

function validateContentLinks(value, sectionLabel, field = '') {
  if (Array.isArray(value)) {
    value.forEach((item) => validateContentLinks(item, sectionLabel, field));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, nestedValue] of Object.entries(value)) {
    if (
      typeof nestedValue === 'string' &&
      /(href|url|image)$/i.test(key) &&
      nestedValue &&
      !/^(?:\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(nestedValue)
    ) {
      throw new ApiError(
        422,
        'SECTION_LINK_INVALID',
        `The "${sectionLabel}" section contains an unsafe ${key} value.`
      );
    }
    validateContentLinks(nestedValue, sectionLabel, key);
  }
}

function seoMutation(existingSeoId, seo) {
  if (seo === undefined) return undefined;
  if (seo === null) return existingSeoId ? { disconnect: true } : undefined;
  const data = {
    title: seo.title,
    description: seo.description,
    canonicalUrl: seo.canonicalUrl || null,
    keywords: seo.keywords || [],
    robots: seo.robots || 'index,follow',
    ogTitle: seo.ogTitle || null,
    ogDescription: seo.ogDescription || null,
    twitterCard: seo.twitterCard || 'summary_large_image',
    structuredData: seo.structuredData || undefined
  };
  return existingSeoId ? { update: data } : { create: data };
}

async function createRevision(client, page, reason, actor) {
  return client.contentRevision.create({
    data: {
      pageId: page.id,
      snapshot: pageSnapshot(page),
      reason,
      ...actorDetails(actor)
    }
  });
}

async function applySections(client, pageId, sections) {
  const normalized = normalizeSections(sections);
  const allExisting = await client.pageSection.findMany({ where: { pageId } });
  const liveById = new Map(
    allExisting
      .filter((section) => !section.deletedAt)
      .map((section) => [section.id, section])
  );
  const reusableByKey = new Map(
    allExisting
      .filter((section) => section.deletedAt)
      .map((section) => [section.key, section])
  );

  const resolved = normalized.map((section) => {
    if (section.id) {
      if (!liveById.has(section.id)) {
        throw new ApiError(
          422,
          'SECTION_PAGE_MISMATCH',
          'A supplied section does not belong to this page.'
        );
      }
      return section;
    }
    const reusable = reusableByKey.get(section.key);
    return reusable ? { ...section, id: reusable.id } : section;
  });

  const incomingIds = new Set(resolved.map((section) => section.id).filter(Boolean));
  const removedIds = [...liveById.keys()].filter((id) => !incomingIds.has(id));
  const incomingKeys = new Set(resolved.map((section) => section.key));
  const keyCollisions = allExisting.filter(
    (section) =>
      !incomingIds.has(section.id) && incomingKeys.has(section.key)
  );
  for (const section of keyCollisions) {
    await client.pageSection.update({
      where: { id: section.id },
      data: {
        key: `deleted-${section.id}`,
        ...(removedIds.includes(section.id)
          ? { deletedAt: new Date(), active: false }
          : {})
      }
    });
  }
  const remainingRemovedIds = removedIds.filter(
    (id) => !keyCollisions.some((section) => section.id === id)
  );
  if (remainingRemovedIds.length) {
    await client.pageSection.updateMany({
      where: { id: { in: remainingRemovedIds }, pageId },
      data: { deletedAt: new Date(), active: false }
    });
  }

  const existingIncomingIds = resolved
    .map((section) => section.id)
    .filter((id) => id && allExisting.some((existing) => existing.id === id));
  for (const id of existingIncomingIds) {
    await client.pageSection.update({
      where: { id },
      data: { key: `temporary-${id}` }
    });
  }

  for (const section of resolved) {
    const data = {
      key: section.key,
      type: section.type,
      label: section.label,
      eyebrow: section.eyebrow,
      title: section.title,
      description: section.description,
      content: section.content,
      active: section.active,
      locked: section.locked,
      sortOrder: section.sortOrder,
      deletedAt: null
    };
    if (section.id) {
      await client.pageSection.update({ where: { id: section.id }, data });
    } else {
      await client.pageSection.create({ data: { ...data, pageId } });
    }
  }
}

async function applyPage(client, existingPage, input) {
  const slug = toSlug(input.slug || input.title || existingPage.slug);
  if (!slug) {
    throw new ApiError(422, 'PAGE_SLUG_INVALID', 'Page URL slug is invalid.');
  }
  await assertSlugAvailable(client, slug, existingPage.id);
  await client.contentPage.update({
    where: { id: existingPage.id },
    data: {
      slug,
      title: input.title,
      excerpt: input.excerpt || null,
      template: input.template || 'STANDARD',
      status: input.status,
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.seo !== undefined
        ? { seo: seoMutation(existingPage.seoId, input.seo) }
        : {})
    }
  });
  await applySections(client, existingPage.id, input.sections);
  return findPageOrThrow(client, existingPage.id);
}

async function pruneRevisions(pageId) {
  const oldRevisions = await prisma.contentRevision.findMany({
    where: { pageId },
    orderBy: { createdAt: 'desc' },
    skip: 40,
    select: { id: true }
  });
  if (oldRevisions.length) {
    await prisma.contentRevision.deleteMany({
      where: { id: { in: oldRevisions.map((revision) => revision.id) } }
    });
  }
}

export async function listCmsPages() {
  return prisma.contentPage.findMany({
    where: { deletedAt: null },
    orderBy: [{ updatedAt: 'desc' }, { title: 'asc' }],
    include: {
      seo: true,
      _count: {
        select: { sections: { where: { deletedAt: null } } }
      }
    }
  });
}

export async function getCmsPage(id) {
  return findPageOrThrow(prisma, id);
}

export async function createCmsPage(input) {
  const slug = toSlug(input.slug || input.title);
  if (!slug) {
    throw new ApiError(422, 'PAGE_SLUG_INVALID', 'Page URL slug is invalid.');
  }
  await assertSlugAvailable(prisma, slug);
  const sections = normalizeSections(input.sections || []);
  return prisma.contentPage.create({
    data: {
      slug,
      title: input.title,
      excerpt: input.excerpt || null,
      body: input.body || { version: 2, blocks: [] },
      template: input.template || 'STANDARD',
      status: input.status || 'DRAFT',
      ...(input.seo ? { seo: { create: input.seo } } : {}),
      sections: {
        create: sections.map(({ id: _id, ...section }) => section)
      }
    },
    include: pageInclude
  });
}

export async function saveCmsPage(id, input, actor) {
  const saved = await prisma.$transaction(async (client) => {
    const existing = await findPageOrThrow(client, id);
    await createRevision(client, existing, 'manual-save', actor);
    return applyPage(client, existing, input);
  });
  await pruneRevisions(id);
  return saved;
}

export async function listCmsRevisions(pageId) {
  await findPageOrThrow(prisma, pageId);
  return prisma.contentRevision.findMany({
    where: { pageId },
    take: 40,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      reason: true,
      actorLabel: true,
      createdAt: true
    }
  });
}

export async function restoreCmsRevision(pageId, revisionId, actor) {
  const restored = await prisma.$transaction(async (client) => {
    const current = await findPageOrThrow(client, pageId);
    const revision = await client.contentRevision.findFirst({
      where: { id: revisionId, pageId }
    });
    if (!revision) {
      throw new ApiError(
        404,
        'REVISION_NOT_FOUND',
        'Content revision was not found.'
      );
    }
    const snapshot = revision.snapshot;
    if (!snapshot?.page || !Array.isArray(snapshot.sections)) {
      throw new ApiError(
        422,
        'REVISION_INVALID',
        'The selected content revision is invalid.'
      );
    }
    await createRevision(client, current, 'before-restore', actor);
    return applyPage(client, current, {
      ...snapshot.page,
      body: snapshot.page.body || { version: 2, blocks: [] },
      status: snapshot.page.status || 'DRAFT',
      template: snapshot.page.template || 'STANDARD',
      sections: snapshot.sections
    });
  });
  await pruneRevisions(pageId);
  return restored;
}
