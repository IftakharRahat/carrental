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
  if (!isDatabaseConfigured()) {
    throw new ServiceConfigurationError(
      "Saving is not available yet. Contact an administrator.",
    );
  }

  if (!isClerkConfigured()) {
    if (process.env.NODE_ENV !== "development") {
      throw new ServiceConfigurationError(
        "Saving is not available yet. Contact an administrator.",
      );
    }

    const profile = await db.userProfile.upsert({
      where: { authUserId: "local-development" },
      update: {},
      create: {
        authUserId: "local-development",
        email: "admin@local.car-scrap.test",
        name: "Local Administrator",
        role: "ADMIN",
      },
    });

    return authorizeProfile(profile, permission);
  }

  const { userId } = await auth();
  if (!userId) throw new AuthenticationError("Sign in to continue.");

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  if (!clerkUser || !email) {
    throw new AuthenticationError(
      "Your account needs a primary email address.",
    );
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

  return authorizeProfile(profile, permission);
}

function authorizeProfile(
  profile: {
    id: string;
    authUserId: string;
    role: AppRole;
    isActive: boolean;
  },
  permission?: Permission,
): Actor {
  if (!profile.isActive) {
    throw new AuthorizationError("Your application access is disabled.");
  }

  const actor: Actor = {
    profileId: profile.id,
    authUserId: profile.authUserId,
    role: profile.role,
  };

  if (permission && !hasPermission(actor.role, permission)) {
    throw new AuthorizationError("You do not have permission for this action.");
  }

  return actor;
}
