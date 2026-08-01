-- Restore leadership as an ordered multi-person content module.
ALTER TABLE "LeadershipMember"
ADD COLUMN "education" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "experience" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Register static portrait assets so seeded doctors and leadership never render empty.
INSERT INTO "MediaFile" (
  "id", "provider", "storageKey", "filename", "originalName", "mimeType",
  "size", "width", "height", "url", "altText", "createdAt", "updatedAt"
) VALUES
  ('10000000-0000-4000-8000-000000000001', 'S3', 'static/doctors/leyla-memmedova.png', 'leyla-memmedova.png', 'leyla-memmedova.png', 'image/png', 1744153, 864, 1821, '/images/doctors/leyla-memmedova.png', 'Dr. Aydan Məmmədova', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000002', 'S3', 'static/doctors/orxan-aliyev.png', 'orxan-aliyev.png', 'orxan-aliyev.png', 'image/png', 2209323, 1024, 1536, '/images/doctors/orxan-aliyev.png', 'Dr. Elvin Əliyev', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000003', 'S3', 'static/doctors/nigar-aliyeva.png', 'nigar-aliyeva.png', 'nigar-aliyeva.png', 'image/png', 1723074, 1023, 1537, '/images/doctors/nigar-aliyeva.png', 'Dr. Nigar Hüseynli', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000004', 'S3', 'static/doctors/orxan-huseynli.png', 'orxan-huseynli.png', 'orxan-huseynli.png', 'image/png', 1985890, 1024, 1536, '/images/doctors/orxan-huseynli.png', 'Dr. Kamran Rzayev', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000005', 'S3', 'static/doctors/leyla-quliyeva.png', 'leyla-quliyeva.png', 'leyla-quliyeva.png', 'image/png', 1973834, 1024, 1536, '/images/doctors/leyla-quliyeva.png', 'Dr. Nərmin Məmmədova', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000006', 'S3', 'static/doctors/elcin-memmedov.png', 'elcin-memmedov.png', 'elcin-memmedov.png', 'image/png', 2051005, 1024, 1536, '/images/doctors/elcin-memmedov.png', 'Elçin Məmmədov', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("storageKey") DO NOTHING;

UPDATE "Doctor" SET "profileImageId" = '10000000-0000-4000-8000-000000000001' WHERE "slug" = 'dr-aydan-memmedova' AND "profileImageId" IS NULL;
UPDATE "Doctor" SET "profileImageId" = '10000000-0000-4000-8000-000000000002' WHERE "slug" = 'dr-elvin-eliyev' AND "profileImageId" IS NULL;
UPDATE "Doctor" SET "profileImageId" = '10000000-0000-4000-8000-000000000003' WHERE "slug" = 'dr-nigar-huseynli' AND "profileImageId" IS NULL;

-- Convert the former singleton into the first leadership card before removing it.
INSERT INTO "LeadershipMember" (
  "id", "slug", "firstName", "lastName", "position", "bio", "education",
  "experience", "imageId", "active", "sortOrder", "createdAt", "updatedAt", "deletedAt"
)
SELECT
  '20000000-0000-4000-8000-000000000001',
  'dr-kamran-rzayev',
  COALESCE(NULLIF(regexp_replace(regexp_replace("fullName", E'^Dr\\.\\s*', '', 'i'), E'\\s+\\S+$', ''), ''), 'Kamran'),
  COALESCE(NULLIF(regexp_replace("fullName", '^.*\\s+', ''), ''), 'Rzayev'),
  "role",
  COALESCE(NULLIF("message", ''), 'Medicare Hospital-da klinik keyfiyyət, pasiyent təhlükəsizliyi və komanda əməkdaşlığı üzrə inkişaf proqramlarına rəhbərlik edir.'),
  ARRAY['Azərbaycan Tibb Universiteti — Müalicə işi']::TEXT[],
  ARRAY['Səhiyyə idarəçiliyi və klinik keyfiyyət üzrə uzunmüddətli rəhbərlik təcrübəsi']::TEXT[],
  COALESCE("photoId", '10000000-0000-4000-8000-000000000004'),
  "active",
  1,
  "createdAt",
  CURRENT_TIMESTAMP,
  NULL
FROM "ExecutiveDirectorProfile"
WHERE "key" = 'primary'
ON CONFLICT ("slug") DO UPDATE SET
  "position" = EXCLUDED."position",
  "bio" = EXCLUDED."bio",
  "imageId" = EXCLUDED."imageId",
  "active" = EXCLUDED."active",
  "deletedAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "LeadershipMember" (
  "id", "slug", "firstName", "lastName", "position", "bio", "education",
  "experience", "imageId", "active", "sortOrder", "createdAt", "updatedAt"
) VALUES
  (
    '20000000-0000-4000-8000-000000000002', 'dr-nermin-memmedova', 'Dr. Nərmin', 'Məmmədova', 'Tibbi direktor',
    'Klinik protokolların, multidissiplinar komanda işinin və pasiyent təhlükəsizliyi standartlarının davamlı inkişafına rəhbərlik edir.',
    ARRAY['Azərbaycan Tibb Universiteti — Müalicə işi', 'Klinik idarəetmə üzrə ixtisasartırma proqramı']::TEXT[],
    ARRAY['Klinik xidmətlərin təşkili və keyfiyyət idarəetməsi üzrə 15 ildən artıq təcrübə']::TEXT[],
    '10000000-0000-4000-8000-000000000005', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    '20000000-0000-4000-8000-000000000003', 'elcin-memmedov', 'Elçin', 'Məmmədov', 'İnzibati işlər üzrə direktor',
    'Hospitalın əməliyyat proseslərini, xidmət koordinasiyasını və pasiyent təcrübəsinin təşkilati inkişafını idarə edir.',
    ARRAY['Azərbaycan Dövlət İqtisad Universiteti — Menecment']::TEXT[],
    ARRAY['Səhiyyə müəssisələrinin əməliyyat idarəçiliyi üzrə 12 ildən artıq təcrübə']::TEXT[],
    '10000000-0000-4000-8000-000000000006', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
ON CONFLICT ("slug") DO NOTHING;

-- Legacy rows may contain nulls; keep them valid without making them public.
UPDATE "LeadershipMember"
SET
  "bio" = COALESCE(NULLIF("bio", ''), "position"),
  "imageId" = COALESCE("imageId", '10000000-0000-4000-8000-000000000004')
WHERE "bio" IS NULL OR "bio" = '' OR "imageId" IS NULL;

ALTER TABLE "LeadershipMember"
ALTER COLUMN "bio" SET NOT NULL,
ALTER COLUMN "imageId" SET NOT NULL;

ALTER TABLE "LeadershipMember" DROP CONSTRAINT "LeadershipMember_imageId_fkey";
ALTER TABLE "LeadershipMember"
ADD CONSTRAINT "LeadershipMember_imageId_fkey"
FOREIGN KEY ("imageId") REFERENCES "MediaFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TABLE "ExecutiveDirectorProfile";

-- Restore granular leadership permissions for existing production roles.
INSERT INTO "Permission" ("id", "code", "name", "description", "createdAt", "updatedAt") VALUES
  ('30000000-0000-4000-8000-000000000001', 'leadership.read', 'leadership.read', 'Rəhbərlik qeydlərinə baxış icazəsi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('30000000-0000-4000-8000-000000000002', 'leadership.write', 'leadership.write', 'Rəhbərlik qeydlərini dəyişmək icazəsi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('30000000-0000-4000-8000-000000000003', 'leadership.delete', 'leadership.delete', 'Rəhbərlik qeydlərini silmək icazəsi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId", "createdAt")
SELECT role."id", permission."id", CURRENT_TIMESTAMP
FROM "Role" AS role
CROSS JOIN "Permission" AS permission
WHERE role."slug" IN ('super-admin', 'content-manager')
  AND permission."code" IN ('leadership.read', 'leadership.write', 'leadership.delete')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Add the public leadership collection immediately after the doctor section.
UPDATE "PageSection" AS section
SET "sortOrder" = section."sortOrder" + 1, "updatedAt" = CURRENT_TIMESTAMP
FROM "ContentPage" AS page
WHERE section."pageId" = page."id"
  AND page."slug" = 'home'
  AND section."sortOrder" >= 6
  AND NOT EXISTS (
    SELECT 1 FROM "PageSection" AS existing
    WHERE existing."pageId" = page."id" AND existing."key" = 'leadership'
  );

INSERT INTO "PageSection" (
  "id", "pageId", "key", "type", "label", "eyebrow", "title", "description",
  "content", "active", "locked", "sortOrder", "createdAt", "updatedAt"
)
SELECT
  '40000000-0000-4000-8000-000000000001', page."id", 'leadership', 'COLLECTION',
  'Rəhbərlik', 'Rəhbərlik', 'Medicare-i gələcəyə aparan komanda',
  'Klinik keyfiyyət, pasiyent təhlükəsizliyi və davamlı inkişaf üçün çalışan rəhbərlik komandamızla tanış olun.',
  '{"collection":"leadership","limit":6}'::JSONB, true, true, 6,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "ContentPage" AS page
WHERE page."slug" = 'home'
ON CONFLICT ("pageId", "key") DO UPDATE SET
  "deletedAt" = NULL,
  "active" = true,
  "locked" = true,
  "type" = 'COLLECTION',
  "updatedAt" = CURRENT_TIMESTAMP;
