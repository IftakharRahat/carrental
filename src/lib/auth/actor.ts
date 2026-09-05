import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import type { AppRole, Permission } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/permissions";
import { isClerkConfigured, isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";

export type Actor = {
  profileId: string;
  authUserId: string;
  role: AppRole;
};

export class AuthenticationError extends Error {}
export class AuthorizationError extends Error {}
export class ServiceConfigurationError extends Error {}

export async function requireActor(permission?: Permission): Promise<Actor> {
  if (!isClerkConfigured() || !isDatabaseConfigured()) {
    throw new ServiceConfigurationError(
      "Connect Neon and Clerk before saving business data.",
    );
  }

  const { userId } = await auth();
  if (!userId) throw new AuthenticationError("Sign in to continue.");

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  if (!clerkUser || !email) {
    throw new AuthenticationError("Your account needs a primary email address.");
  }

  const profile = await db.$transaction(
    async (tx) => {
      const existing = await tx.userProfile.findUnique({
        where: { authUserId: userId },
      });
      if (existing) return existing;

      const profileCount = await tx.userProfile.count();
      return tx.userProfile.create({
        data: {
          authUserId: userId,
          email,
          name: clerkUser.fullName ?? email,
          role: profileCount === 0 ? "ADMIN" : "STAFF",
        },
      });
    },
    { isolationLevel: "Serializable" },
  );

  if (!profile.isActive) {
    throw new AuthorizationError("Your application access is disabled.");
  }

  const actor: Actor = {
    profileId: profile.id,
    authUserId: userId,
    role: profile.role,
  };

  if (permission && !hasPermission(actor.role, permission)) {
    throw new AuthorizationError("You do not have permission for this action.");
  }

  return actor;
}
