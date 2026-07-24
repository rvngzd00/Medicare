-- Preserve historical requests outside the active application schema.
ALTER TABLE "AppointmentRequest"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;

ALTER TABLE "AppointmentRequest"
  RENAME TO "ArchivedAppointmentRequest";

ALTER INDEX "AppointmentRequest_pkey"
  RENAME TO "ArchivedAppointmentRequest_pkey";
ALTER INDEX "AppointmentRequest_status_createdAt_idx"
  RENAME TO "ArchivedAppointmentRequest_status_createdAt_idx";
ALTER INDEX "AppointmentRequest_doctorId_desiredDate_idx"
  RENAME TO "ArchivedAppointmentRequest_doctorId_desiredDate_idx";
ALTER INDEX "AppointmentRequest_assignedToId_idx"
  RENAME TO "ArchivedAppointmentRequest_assignedToId_idx";
ALTER INDEX "AppointmentRequest_deletedAt_idx"
  RENAME TO "ArchivedAppointmentRequest_deletedAt_idx";

DROP TYPE "AppointmentStatus";

-- Remove permissions that no longer map to an application feature.
DELETE FROM "Permission"
WHERE "code" LIKE 'appointments.%';

-- Remove the former public booking page and its detached SEO record.
WITH removed_page AS (
  DELETE FROM "ContentPage"
  WHERE "slug" = 'appointment'
  RETURNING "seoId"
)
DELETE FROM "SeoMetadata"
WHERE "id" IN (
  SELECT "seoId"
  FROM removed_page
  WHERE "seoId" IS NOT NULL
);

-- Convert all editable CTA blocks and their revision snapshots to phone contact.
DELETE FROM "PageSection" AS old_section
USING "PageSection" AS contact_section
WHERE old_section."pageId" = contact_section."pageId"
  AND old_section."key" = 'appointment'
  AND contact_section."key" = 'contact-cta';

UPDATE "PageSection"
SET
  "key" = 'contact-cta',
  "label" = 'Telefon əlaqə çağırışı',
  "eyebrow" = 'Əlaqə',
  "content" = REPLACE(
    REPLACE("content"::TEXT, '/appointment', 'tel:+994124503291'),
    'Qəbula yazıl',
    'Bizimlə əlaqə saxla'
  )::JSONB
WHERE "key" = 'appointment'
  AND "type" = 'CTA';

UPDATE "HomeSection"
SET "content" = REPLACE(
  REPLACE("content"::TEXT, '/appointment', 'tel:+994124503291'),
  'Qəbula yazıl',
  'Bizimlə əlaqə saxla'
)::JSONB
WHERE "content"::TEXT LIKE '%/appointment%'
   OR "content"::TEXT LIKE '%Qəbula yazıl%';

UPDATE "ContentRevision"
SET "snapshot" = REPLACE(
  REPLACE("snapshot"::TEXT, '/appointment', 'tel:+994124503291'),
  'Qəbula yazıl',
  'Bizimlə əlaqə saxla'
)::JSONB
WHERE "snapshot"::TEXT LIKE '%/appointment%'
   OR "snapshot"::TEXT LIKE '%Qəbula yazıl%';

UPDATE "NavigationItem"
SET
  "label" = 'Bizimlə əlaqə saxla',
  "url" = 'tel:+994124503291',
  "isExternal" = FALSE
WHERE "url" = '/appointment'
   OR "url" LIKE '/appointment?%';

UPDATE "FAQ"
SET
  "question" = 'Hospital ilə necə əlaqə saxlaya bilərəm?',
  "answer" = '+994 12 450 32 91 nömrəsinə zəng edərək hospitalın əlaqə mərkəzi ilə danışa bilərsiniz.',
  "category" = 'Əlaqə'
WHERE "question" = 'Qəbula necə yazıla bilərəm?';

-- Keep published legal content aligned with the contact-only flow.
UPDATE "PageSection" AS section
SET
  "description" = 'Əlaqə forması ilə təqdim etdiyiniz məlumatları yalnız sorğunuzu cavablandırmaq və sizinlə əlaqə saxlamaq üçün toplayırıq.',
  "content" = '{"text":"Ad, soyad və əlaqə məlumatları.\\n\\nSorğunun mövzusu və mesajı.\\n\\nSorğuda könüllü paylaşdığınız digər məlumatlar."}'::JSONB
FROM "ContentPage" AS page
WHERE section."pageId" = page."id"
  AND page."slug" = 'privacy-policy'
  AND section."key" = 'collected-data';

UPDATE "PageSection" AS section
SET "description" = 'Şəxsi məlumatlar sorğuların cavablandırılması, xidmət keyfiyyətinin yaxşılaşdırılması və qanuni öhdəliklərin icrası üçün işlənir.'
FROM "ContentPage" AS page
WHERE section."pageId" = page."id"
  AND page."slug" = 'privacy-policy'
  AND section."key" = 'data-use';

UPDATE "PageSection" AS section
SET "content" = '{"text":"Onlayn əlaqə forması hospital ilə ünsiyyəti asanlaşdırır."}'::JSONB
FROM "ContentPage" AS page
WHERE section."pageId" = page."id"
  AND page."slug" = 'terms'
  AND section."key" = 'purpose';

UPDATE "PageSection" AS section
SET
  "key" = 'contact-form',
  "label" = 'Əlaqə forması',
  "title" = 'Əlaqə forması',
  "description" = 'Onlayn formanın göndərilməsi tibbi məsləhət və ya xidmət təsdiqi sayılmır.',
  "content" = '{"text":"Təcili olmayan suallar üçün əlaqə formundan və ya hospitalın telefon nömrəsindən istifadə edə bilərsiniz."}'::JSONB
FROM "ContentPage" AS page
WHERE section."pageId" = page."id"
  AND page."slug" = 'terms'
  AND section."key" = 'appointments';

UPDATE "ContentPage"
SET "excerpt" = 'Saytdan istifadə və onlayn əlaqə üzrə şərtlər.'
WHERE "slug" = 'terms';

UPDATE "SeoMetadata" AS seo
SET
  "description" = REPLACE(
    REPLACE(seo."description", 'onlayn qəbul sorğusu', 'onlayn əlaqə'),
    'qəbul sorğusu',
    'əlaqə'
  ),
  "ogDescription" = CASE
    WHEN seo."ogDescription" IS NULL THEN NULL
    ELSE REPLACE(
      REPLACE(seo."ogDescription", 'onlayn qəbul sorğusu', 'onlayn əlaqə'),
      'qəbul sorğusu',
      'əlaqə'
    )
  END
FROM "ContentPage" AS page
WHERE page."seoId" = seo."id"
  AND page."slug" IN ('privacy-policy', 'terms');
