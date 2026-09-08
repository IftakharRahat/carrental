import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const COOKIE_NAME = "session";
const TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export type SessionPayload = {
  profileId: string;
  email: string;
  name: string;
  role: string;
};

function getSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ??
    (process.env.NODE_ENV !== "production"
      ? "dev-jwt-secret-do-not-use-in-production"
      : undefined);

  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is required in production.",
    );
  }

  return new TextEncoder().encode(secret);
}

/**
 * Sign a session payload into a JWT token string.
 */
export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

/**
 * Verify a JWT token and return the session payload.
 * Returns `null` if the token is invalid or expired.
 */
export async function verifyToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const { profileId, email, name, role } = payload as unknown as SessionPayload;
    if (!profileId || !email || !role) return null;
    return { profileId, email, name: name ?? email, role };
  } catch {
    return null;
  }
}

/** The cookie name used for the session token. */
export { COOKIE_NAME, TOKEN_MAX_AGE_SECONDS };
