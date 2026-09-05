export function isDatabaseConfigured(): boolean {
  const value = process.env.DATABASE_URL;

  return Boolean(
    value &&
    !value.includes("johndoe:randompassword") &&
    !value.includes("USER:PASSWORD"),
  );
}

export function isClerkConfigured(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  return Boolean(
    publishableKey &&
    secretKey &&
    !publishableKey.includes("replace_me") &&
    !secretKey.includes("replace_me"),
  );
}

export function isCloudinaryConfigured(): boolean {
  if (
    process.env.CLOUDINARY_URL &&
    !process.env.CLOUDINARY_URL.includes("replace_me")
  ) {
    return true;
  }
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    !process.env.CLOUDINARY_CLOUD_NAME.includes("replace_me"),
  );
}

export function isBlobConfigured(): boolean {
  const value = process.env.BLOB_READ_WRITE_TOKEN;
  return Boolean(value && !value.includes("replace_me"));
}

export function getPhotoStorageProvider():
  "cloudinary" | "vercel-blob" | "local" {
  if (isCloudinaryConfigured()) return "cloudinary";
  if (isBlobConfigured()) return "vercel-blob";
  return "local";
}
