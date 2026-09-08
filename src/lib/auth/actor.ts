import "server-only";

import { cookies } from "next/headers";

import type { AppRole, Permission } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/permissions";
import { COOKIE_NAME, verifyToken } from "@/lib/auth/jwt";
import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";

export type Actor = {
  profileId: string;
  authUserId: string;
  email: string;
  name: string;
  role: AppRole;
};

export class AuthenticationError extends Error {}
export class AuthorizationError extends Error {}
export class ServiceConfigurationError extends Error {}

/**
 * Reads the session token from cookies and returns the active user actor, or null if unauthenticated.
 */
export async function getSessionActor(): Promise<Actor | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  if (!isDatabaseConfigured()) {
    return {
      profileId: payload.profileId,
      authUserId: payload.profileId,
      email: payload.email,
      name: payload.name,
      role: payload.role as AppRole,
    };
  }

  const profile = await db.userProfile.findUnique({
    where: { id: payload.profileId },
  });

  if (!profile || !profile.isActive) {
    return null;
  }

  return {
    profileId: profile.id,
    authUserId: profile.authUserId ?? profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role as AppRole,
  };
}

/**
 * Asserts that the current request has an authenticated active user and optional permission.
 */
export async function requireActor(permission?: Permission): Promise<Actor> {
  if (!isDatabaseConfigured()) {
    throw new ServiceConfigurationError(
      "Database is not configured yet. Contact an administrator.",
    );
  }

  const actor = await getSessionActor();
  if (!actor) {
    throw new AuthenticationError("Sign in to continue.");
  }

  if (permission && !hasPermission(actor.role, permission)) {
    throw new AuthorizationError("You do not have permission for this action.");
  }

  return actor;
}
