import "server-only";

import { del, put } from "@vercel/blob";

import { isBlobConfigured } from "@/lib/config-state";

export const MAX_CAR_PHOTOS = 8;
export const MAX_CAR_PHOTO_BYTES = 5 * 1024 * 1024;

const supportedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export type UploadedCarPhoto = {
  pathname: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  isMain: boolean;
};

export class PhotoValidationError extends Error {}

export function validateCarPhotos(files: readonly File[], mainIndex: number): void {
  if (files.length > MAX_CAR_PHOTOS) {
    throw new PhotoValidationError(
      `Upload no more than ${MAX_CAR_PHOTOS} vehicle photos.`,
    );
  }

  for (const file of files) {
    if (!supportedImageTypes.has(file.type)) {
      throw new PhotoValidationError(
        "Photos must be JPEG, PNG or WebP images.",
      );
    }
    if (file.size < 1 || file.size > MAX_CAR_PHOTO_BYTES) {
      throw new PhotoValidationError("Each photo must be 5 MB or smaller.");
    }
  }

  if (files.length > 0 && (mainIndex < 0 || mainIndex >= files.length)) {
    throw new PhotoValidationError("Choose a valid main vehicle photo.");
  }
}

export async function uploadCarPhotos(
  files: readonly File[],
  mainIndex: number,
): Promise<UploadedCarPhoto[]> {
  validateCarPhotos(files, mainIndex);
  if (files.length === 0) return [];

  if (!isBlobConfigured()) {
    throw new PhotoValidationError(
      "Connect Vercel Blob before uploading vehicle photos.",
    );
  }

  const uploaded: UploadedCarPhoto[] = [];
  try {
    for (const [index, file] of files.entries()) {
      const extension = supportedImageTypes.get(file.type)!;
      const blob = await put(
        `cars/pending/${crypto.randomUUID()}.${extension}`,
        file,
        { access: "private", addRandomSuffix: false },
      );
      uploaded.push({
        pathname: blob.pathname,
        url: blob.url,
        contentType: file.type,
        sizeBytes: file.size,
        isMain: index === mainIndex,
      });
    }

    return uploaded;
  } catch (error) {
    await cleanupCarPhotos(uploaded);
    throw error;
  }
}

export async function cleanupCarPhotos(
  photos: readonly UploadedCarPhoto[],
): Promise<void> {
  if (photos.length === 0) return;

  try {
    await del(photos.map((photo) => photo.url));
  } catch {
    // Database correctness takes precedence; orphan cleanup can be retried later.
  }
}
