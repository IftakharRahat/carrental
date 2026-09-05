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

export function isBlobConfigured(): boolean {
  const value = process.env.BLOB_READ_WRITE_TOKEN;
  return Boolean(value && !value.includes("replace_me"));
}
