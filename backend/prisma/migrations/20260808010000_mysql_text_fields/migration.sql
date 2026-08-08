-- Widen content fields for the MySQL production schema.
-- Prisma maps String to VARCHAR(191) on MySQL by default, which is too small
-- for CMS, SEO, biographies, messages, URLs and service price catalog text.

ALTER TABLE `Role`
  MODIFY `description` TEXT NULL;

ALTER TABLE `Permission`
  MODIFY `description` TEXT NULL;

ALTER TABLE `ActivityLog`
  MODIFY `path` TEXT NULL,
  MODIFY `userAgent` TEXT NULL;

ALTER TABLE `MediaFile`
  MODIFY `url` TEXT NOT NULL,
  MODIFY `thumbnailUrl` TEXT NULL,
  MODIFY `altText` TEXT NULL;

ALTER TABLE `SeoMetadata`
  MODIFY `description` TEXT NOT NULL,
  MODIFY `canonicalUrl` TEXT NULL,
  MODIFY `ogDescription` TEXT NULL;

ALTER TABLE `Doctor`
  MODIFY `shortBio` TEXT NOT NULL,
  MODIFY `bio` TEXT NOT NULL;

ALTER TABLE `DoctorEducation`
  MODIFY `description` TEXT NULL;

ALTER TABLE `DoctorExperience`
  MODIFY `description` TEXT NULL;

ALTER TABLE `DoctorCertificate`
  MODIFY `credentialUrl` TEXT NULL;

ALTER TABLE `Department`
  MODIFY `summary` TEXT NOT NULL,
  MODIFY `description` TEXT NOT NULL;

ALTER TABLE `Service`
  MODIFY `summary` TEXT NOT NULL,
  MODIFY `description` TEXT NOT NULL;

ALTER TABLE `ServicePriceItem`
  DROP INDEX `ServicePriceItem_name_idx`;

ALTER TABLE `ServicePriceItem`
  MODIFY `name` TEXT NOT NULL,
  MODIFY `note` TEXT NULL;

ALTER TABLE `Branch`
  MODIFY `address` TEXT NOT NULL,
  MODIFY `mapEmbedUrl` TEXT NULL;

ALTER TABLE `ContactMessage`
  MODIFY `message` TEXT NOT NULL,
  MODIFY `adminNotes` TEXT NULL;

ALTER TABLE `ArticleCategory`
  MODIFY `description` TEXT NULL;

ALTER TABLE `Article`
  MODIFY `excerpt` TEXT NOT NULL;

ALTER TABLE `FAQ`
  MODIFY `question` TEXT NOT NULL,
  MODIFY `answer` TEXT NOT NULL;

ALTER TABLE `Testimonial`
  MODIFY `quote` TEXT NOT NULL;

ALTER TABLE `GalleryItem`
  MODIFY `description` TEXT NULL;

ALTER TABLE `Certificate`
  MODIFY `description` TEXT NULL;

ALTER TABLE `LeadershipMember`
  MODIFY `bio` TEXT NOT NULL;

ALTER TABLE `NavigationItem`
  MODIFY `url` TEXT NOT NULL;

ALTER TABLE `ContentPage`
  MODIFY `excerpt` TEXT NULL;

ALTER TABLE `PageSection`
  MODIFY `description` TEXT NULL;

ALTER TABLE `ContentRevision`
  MODIFY `reason` TEXT NULL;

ALTER TABLE `SocialLink`
  MODIFY `url` TEXT NOT NULL;
