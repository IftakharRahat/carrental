import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { del, put } from "@vercel/blob";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

import { getPhotoStorageProvider } from "@/lib/config-state";

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

export function validateCarPhotos(
  files: readonly File[],
  mainIndex: number,
): void {
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

function configureCloudinary(): void {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
  } else if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
}

async function uploadToCloudinary(
  file: File,
  filenameId: string,
): Promise<{ pathname: string; url: string; bytes: number }> {
  configureCloudinary();
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "cars",
        public_id: filenameId,
        resource_type: "image",
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed"));
        }
        resolve({
          pathname: result.public_id,
          url: result.secure_url,
          bytes: result.bytes,
        });
      },
    );
    stream.end(buffer);
  });
}

async function uploadToLocal(
  file: File,
  filename: string,
): Promise<{ pathname: string; url: string; bytes: number }> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "cars");
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return {
    pathname: `uploads/cars/${filename}`,
    url: `/uploads/cars/${filename}`,
    bytes: file.size,
  };
}

export async function uploadCarPhotos(
  files: readonly File[],
  mainIndex: number,
): Promise<UploadedCarPhoto[]> {
  validateCarPhotos(files, mainIndex);
  if (files.length === 0) return [];

  const provider = getPhotoStorageProvider();
  const uploaded: UploadedCarPhoto[] = [];

  try {
    for (const [index, file] of files.entries()) {
      const extension = supportedImageTypes.get(file.type)!;
      const fileId = crypto.randomUUID();
      const filename = `${fileId}.${extension}`;

      if (provider === "cloudinary") {
        const result = await uploadToCloudinary(file, fileId);
        uploaded.push({
          pathname: result.pathname,
          url: result.url,
          contentType: file.type,
          sizeBytes: result.bytes,
          isMain: index === mainIndex,
        });
      } else if (provider === "vercel-blob") {
        const blob = await put(`cars/pending/${filename}`, file, {
          access: "private",
          addRandomSuffix: false,
        });
        uploaded.push({
          pathname: blob.pathname,
          url: blob.url,
          contentType: file.type,
          sizeBytes: file.size,
          isMain: index === mainIndex,
        });
      } else {
        const result = await uploadToLocal(file, filename);
        uploaded.push({
          pathname: result.pathname,
          url: result.url,
          contentType: file.type,
          sizeBytes: result.bytes,
          isMain: index === mainIndex,
        });
      }
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

  const provider = getPhotoStorageProvider();

  for (const photo of photos) {
    try {
      if (provider === "cloudinary") {
        configureCloudinary();
        await cloudinary.uploader.destroy(photo.pathname, {
          resource_type: "image",
        });
      } else if (provider === "vercel-blob") {
        await del(photo.url);
      } else {
        const localPath = path.join(process.cwd(), "public", photo.pathname);
        await fs.unlink(localPath).catch(() => {});
      }
    } catch {
      // Database correctness takes precedence; orphan cleanup can be retried later.
    }
  }
}
