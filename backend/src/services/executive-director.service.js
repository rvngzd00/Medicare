import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/api-error.js';

const PROFILE_KEY = 'primary';
const defaultProfile = Object.freeze({
  fullName: 'Dr. Kamran Rzayev',
  role: 'Baş direktor',
  message:
    'İnanırıq ki, keyfiyyətli tibbi xidmət dəqiq qərarla yanaşı, pasiyentə aydın və diqqətli münasibətdən başlayır.',
  signature: 'Dr. Kamran Rzayev',
  photoId: null,
  active: true
});

const mediaSelect = {
  id: true,
  url: true,
  thumbnailUrl: true,
  altText: true,
  width: true,
  height: true
};

const adminSelect = {
  id: true,
  key: true,
  fullName: true,
  role: true,
  message: true,
  signature: true,
  photoId: true,
  photo: { select: mediaSelect },
  active: true,
  createdAt: true,
  updatedAt: true
};

const publicSelect = {
  id: true,
  fullName: true,
  role: true,
  message: true,
  signature: true,
  photo: { select: mediaSelect },
  updatedAt: true
};

export async function getExecutiveDirectorForAdmin() {
  const profile = await prisma.executiveDirectorProfile.findUnique({
    where: { key: PROFILE_KEY },
    select: adminSelect
  });

  return profile || {
    id: null,
    key: PROFILE_KEY,
    ...defaultProfile,
    photo: null,
    createdAt: null,
    updatedAt: null
  };
}

export async function updateExecutiveDirector(data) {
  const photoId = data.photoId || null;
  const values = {
    fullName: data.fullName.trim(),
    role: data.role.trim(),
    message: data.message?.trim() || null,
    signature: data.signature?.trim() || null,
    photoId,
    active: data.active
  };

  return prisma.$transaction(async (transaction) => {
    if (photoId) {
      const media = await transaction.$queryRaw`
        SELECT "id"
        FROM "MediaFile"
        WHERE "id" = ${photoId} AND "deletedAt" IS NULL
        FOR UPDATE
      `;
      if (media.length === 0) {
        throw new ApiError(
          422,
          'DIRECTOR_PHOTO_NOT_FOUND',
          'The selected executive director photo was not found.'
        );
      }
    }

    return transaction.executiveDirectorProfile.upsert({
      where: { key: PROFILE_KEY },
      update: values,
      create: { key: PROFILE_KEY, ...values },
      select: adminSelect
    });
  });
}

export async function getPublicExecutiveDirector() {
  return prisma.executiveDirectorProfile.findFirst({
    where: { key: PROFILE_KEY, active: true },
    select: publicSelect
  });
}
