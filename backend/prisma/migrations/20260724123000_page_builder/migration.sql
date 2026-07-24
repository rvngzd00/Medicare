-- AlterTable
ALTER TABLE "ContentPage"
ADD COLUMN "template" TEXT NOT NULL DEFAULT 'STANDARD';

-- CreateTable
CREATE TABLE "PageSection" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RICH_TEXT',
    "label" TEXT NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT,
    "description" TEXT,
    "content" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRevision" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "reason" TEXT,
    "actorId" TEXT,
    "actorLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageSection_pageId_key_key" ON "PageSection"("pageId", "key");

-- CreateIndex
CREATE INDEX "PageSection_pageId_active_sortOrder_idx" ON "PageSection"("pageId", "active", "sortOrder");

-- CreateIndex
CREATE INDEX "PageSection_deletedAt_idx" ON "PageSection"("deletedAt");

-- CreateIndex
CREATE INDEX "ContentRevision_pageId_createdAt_idx" ON "ContentRevision"("pageId", "createdAt");

-- AddForeignKey
ALTER TABLE "PageSection"
ADD CONSTRAINT "PageSection_pageId_fkey"
FOREIGN KEY ("pageId") REFERENCES "ContentPage"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRevision"
ADD CONSTRAINT "ContentRevision_pageId_fkey"
FOREIGN KEY ("pageId") REFERENCES "ContentPage"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
