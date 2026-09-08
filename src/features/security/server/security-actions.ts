"use server";

import { revalidatePath } from "next/cache";

import { requireActor } from "@/lib/auth/actor";
import { hashPassword } from "@/lib/auth/password";
import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";
import { validateUserDeactivation } from "../domain/security-calculations";
import {
  createUserSchema,
  updateUserRoleSchema,
  type UserProfileItem,
  type UserRole,
} from "../domain/security-types";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; message: string };

/**
 * Updates a user's role and active status (Admin only).
 */
export async function updateUserRoleAction(
  userId: string,
  role: UserRole,
  isActive: boolean,
): Promise<ActionResult<{ id: string }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const actor = await requireActor();
  if (actor.role !== "ADMIN") {
    return {
      ok: false,
      message: "Only Administrators are permitted to modify user roles.",
    };
  }

  const parsed = updateUserRoleSchema.safeParse({ userId, role, isActive });
  if (!parsed.success) {
    return { ok: false, message: "Invalid user update parameters." };
  }

  const rawUsers = await db.userProfile.findMany();
  const users: UserProfileItem[] = rawUsers.map((u) => ({
    id: u.id,
    authUserId: u.authUserId,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString().slice(0, 10),
    updatedAt: u.updatedAt.toISOString().slice(0, 10),
  }));

  const validation = validateUserDeactivation(users, userId, isActive, role);
  if (!validation.allowed) {
    return { ok: false, message: validation.reason || "Update not permitted." };
  }

  const targetUser = rawUsers.find((u) => u.id === userId);

  const updated = await db.userProfile.update({
    where: { id: userId },
    data: { role, isActive },
  });

  // Write audit log
  await db.auditLog.create({
    data: {
      actorId: actor.profileId,
      action: "UPDATE",
      entityType: "UserProfile",
      entityId: updated.id,
      reason: `Updated role to ${role}, active status to ${isActive}`,
      before: targetUser ? JSON.parse(JSON.stringify(targetUser)) : undefined,
      after: JSON.parse(JSON.stringify(updated)),
    },
  });

  revalidatePath("/settings/security");
  return { ok: true, data: { id: updated.id } };
}

/**
 * Invites / creates a new user profile (Admin only).
 */
export async function createUserAction(
  email: string,
  name: string,
  role: UserRole,
): Promise<ActionResult<{ id: string }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const actor = await requireActor();
  if (actor.role !== "ADMIN") {
    return {
      ok: false,
      message: "Only Administrators are permitted to invite or create users.",
    };
  }

  const parsed = createUserSchema.safeParse({ email, name, role });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const existing = await db.userProfile.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existing) {
    return {
      ok: false,
      message: `A user with email "${email}" already exists.`,
    };
  }

  const defaultPassword = "password123";
  const passwordHash = await hashPassword(defaultPassword);

  const created = await db.userProfile.create({
    data: {
      authUserId: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      passwordHash,
      role,
      isActive: true,
    },
  });

  // Write audit log
  await db.auditLog.create({
    data: {
      actorId: actor.profileId,
      action: "CREATE",
      entityType: "UserProfile",
      entityId: created.id,
      reason: `Invited user ${name} (${email}) as ${role}`,
      after: JSON.parse(JSON.stringify(created)),
    },
  });

  revalidatePath("/settings/security");
  return { ok: true, data: { id: created.id } };
}

/**
 * Generates a full system database backup snapshot (Admin only, Section 17.4).
 */
export async function generateFullDatabaseBackupAction(): Promise<
  ActionResult<{
    filename: string;
    jsonContent: string;
    recordCounts: Record<string, number>;
  }>
> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const actor = await requireActor();
  if (actor.role !== "ADMIN") {
    return {
      ok: false,
      message: "Only Administrators are authorized to generate system database backups.",
    };
  }

  // Concurrently extract all application tables
  const [
    cars,
    carExpenses,
    businessExpenses,
    recoveries,
    cashTransactions,
    sellers,
    sources,
    buyers,
    buyerTypes,
    monthlySnapshots,
    userProfiles,
    auditLogs,
  ] = await Promise.all([
    db.car.findMany(),
    db.carExpense.findMany(),
    db.businessExpense.findMany(),
    db.recoveryTransaction.findMany(),
    db.cashTransaction.findMany(),
    db.seller.findMany(),
    db.source.findMany(),
    db.buyer.findMany(),
    db.buyerType.findMany(),
    db.monthlySnapshot.findMany(),
    db.userProfile.findMany({ select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true } }),
    db.auditLog.findMany({ take: 500, orderBy: { createdAt: "desc" } }),
  ]);

  const timestamp = new Date().toISOString();
  const recordCounts = {
    cars: cars.length,
    carExpenses: carExpenses.length,
    businessExpenses: businessExpenses.length,
    recoveries: recoveries.length,
    cashTransactions: cashTransactions.length,
    sellers: sellers.length,
    sources: sources.length,
    buyers: buyers.length,
    buyerTypes: buyerTypes.length,
    monthlySnapshots: monthlySnapshots.length,
    userProfiles: userProfiles.length,
    auditLogs: auditLogs.length,
  };

  const backupData = {
    metadata: {
      system: "Car Scrap Business Management",
      version: "1.0",
      backupType: "FULL_SYSTEM_SNAPSHOT",
      generatedAt: timestamp,
      generatedBy: actor.profileId,
      recordCounts,
      restoreInstructions:
        "Backup can be restored to Neon PostgreSQL using standard JSON import or Prisma seed procedures.",
    },
    tables: {
      cars,
      carExpenses,
      businessExpenses,
      recoveries,
      cashTransactions,
      sellers,
      sources,
      buyers,
      buyerTypes,
      monthlySnapshots,
      userProfiles,
      auditLogs,
    },
  };

  const jsonContent = JSON.stringify(backupData, null, 2);
  const filename = `car-scrap-backup-${timestamp.slice(0, 10)}-${Date.now().toString().slice(-4)}.json`;

  // Write audit log
  await db.auditLog.create({
    data: {
      actorId: actor.profileId,
      action: "CREATE",
      entityType: "SystemBackup",
      entityId: filename,
      reason: `Full system database backup exported (${Object.values(recordCounts).reduce((a, b) => a + b, 0)} records)`,
    },
  });

  return {
    ok: true,
    data: {
      filename,
      jsonContent,
      recordCounts,
    },
  };
}
