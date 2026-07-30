-- CreateTable
CREATE TABLE "ExecutiveDirectorProfile" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'primary',
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "message" TEXT,
    "signature" TEXT,
    "photoId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutiveDirectorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExecutiveDirectorProfile_key_key" ON "ExecutiveDirectorProfile"("key");

-- CreateIndex
CREATE INDEX "ExecutiveDirectorProfile_photoId_idx" ON "ExecutiveDirectorProfile"("photoId");

-- CreateIndex
CREATE INDEX "ExecutiveDirectorProfile_active_idx" ON "ExecutiveDirectorProfile"("active");

-- AddForeignKey
ALTER TABLE "ExecutiveDirectorProfile" ADD CONSTRAINT "ExecutiveDirectorProfile_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "MediaFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the singleton without touching later admin edits.
INSERT INTO "ExecutiveDirectorProfile" (
    "id",
    "key",
    "fullName",
    "role",
    "message",
    "signature",
    "active",
    "createdAt",
    "updatedAt"
) VALUES (
    '00000000-0000-4000-8000-000000000001',
    'primary',
    'Dr. Kamran Rzayev',
    'Baş direktor',
    'İnanırıq ki, keyfiyyətli tibbi xidmət dəqiq qərarla yanaşı, pasiyentə aydın və diqqətli münasibətdən başlayır.',
    'Dr. Kamran Rzayev',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("key") DO NOTHING;
