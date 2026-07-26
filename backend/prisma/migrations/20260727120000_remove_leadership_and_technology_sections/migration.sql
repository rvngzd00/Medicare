-- Remove retired public sections from the active CMS layout.
DELETE FROM "PageSection" AS section
USING "ContentPage" AS page
WHERE section."pageId" = page."id"
  AND (
    (page."slug" = 'about' AND section."key" = 'leadership')
    OR
    (page."slug" = 'home' AND section."key" = 'technology')
  );

-- Prevent an old CMS revision from restoring either retired section.
UPDATE "ContentRevision" AS revision
SET "snapshot" = jsonb_set(
  revision."snapshot",
  '{sections}',
  COALESCE(
    (
      SELECT jsonb_agg(section_item)
      FROM jsonb_array_elements(revision."snapshot"->'sections') AS section_item
      WHERE section_item->>'key' NOT IN ('leadership', 'technology')
    ),
    '[]'::JSONB
  ),
  FALSE
)
FROM "ContentPage" AS page
WHERE revision."pageId" = page."id"
  AND page."slug" IN ('about', 'home')
  AND jsonb_typeof(revision."snapshot"->'sections') = 'array';

-- Retire leadership data without destroying historical records.
UPDATE "LeadershipMember"
SET "active" = FALSE
WHERE "active" = TRUE;

DELETE FROM "Permission"
WHERE "code" LIKE 'leadership.%';

-- Technology claims are no longer part of department content.
UPDATE "Department"
SET "technologies" = ARRAY[]::TEXT[]
WHERE cardinality("technologies") > 0;

-- Hide any legacy MRI content that may exist outside the current seed.
UPDATE "Service"
SET
  "active" = FALSE,
  "deletedAt" = COALESCE("deletedAt", CURRENT_TIMESTAMP)
WHERE lower("slug") LIKE '%mrt%'
   OR lower("name") LIKE '%mrt%';

UPDATE "Article"
SET
  "status" = 'ARCHIVED',
  "deletedAt" = COALESCE("deletedAt", CURRENT_TIMESTAMP)
WHERE lower("slug") LIKE '%mrt%'
   OR lower("title") LIKE '%mrt%';
