export function resolvePageSections(page, fallbackSections = []) {
  const defaults = new Map(
    fallbackSections.map((section, index) => [
      section.key,
      {
        ...section,
        content: section.content || {},
        sortOrder: section.sortOrder ?? index,
      },
    ]),
  );
  const configuredSections = Array.isArray(page?.sections)
    ? page.sections
    : [];
  const hasConfiguredLayout =
    Boolean(page?.sectionLayoutConfigured) || configuredSections.length > 0;

  if (!hasConfiguredLayout) {
    return [...defaults.values()].sort(
      (first, second) => first.sortOrder - second.sortOrder,
    );
  }

  return configuredSections
    .map((section, index) => ({
      ...(defaults.get(section.key) || {}),
      ...section,
      content: {
        ...(defaults.get(section.key)?.content || {}),
        ...(section.content || {}),
      },
      sortOrder: section.sortOrder ?? index,
    }))
    .filter((section) => section.active !== false)
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

export function sectionText(section, fallback = "") {
  return section?.description?.trim() || fallback;
}

export function positiveSectionLimit(section, fallback) {
  const value = Number(section?.content?.limit);
  return Number.isInteger(value) && value > 0
    ? Math.min(value, 100)
    : fallback;
}
