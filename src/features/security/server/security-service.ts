import "server-only";

import { requireActor } from "@/lib/auth/actor";
import {
  isAuthConfigured,
  isBlobConfigured,
  isDatabaseConfigured,
} from "@/lib/config-state";
import { db } from "@/lib/db";
import type {
  AuditLogItem,
  DatabaseTableCount,
  SecuritySettingsViewData,
  SystemSecurityPosture,
  UserProfileItem,
} from "../domain/security-types";

export async function getSecuritySettingsData(): Promise<SecuritySettingsViewData> {
  const actor = await requireActor();

  // Concurrently fetch users, table counts, and recent audit logs
  const [
    rawUsers,
    carCount,
    carExpCount,
    bizExpCount,
    recoveryCount,
    cashCount,
    sellerCount,
    sourceCount,
    buyerCount,
    snapshotCount,
    auditLogCount,
    rawAuditLogs,
  ] = await Promise.all([
    db.userProfile.findMany({
      orderBy: { createdAt: "asc" },
    }),
    db.car.count(),
    db.carExpense.count(),
    db.businessExpense.count(),
    db.recoveryTransaction.count(),
    db.cashTransaction.count(),
    db.seller.count(),
    db.source.count(),
    db.buyer.count(),
    db.monthlySnapshot.count(),
    db.auditLog.count(),
    db.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
  ]);

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

  const tableCounts: DatabaseTableCount[] = [
    { tableName: "cars", label: "Cars / Vehicles", count: carCount },
    { tableName: "car_expenses", label: "Car Expenses", count: carExpCount },
    { tableName: "business_expenses", label: "Business Overheads", count: bizExpCount },
    { tableName: "recovery_transactions", label: "Sales & Recoveries", count: recoveryCount },
    { tableName: "cash_transactions", label: "Cash Flow Ledger", count: cashCount },
    { tableName: "sellers", label: "Registered Sellers", count: sellerCount },
    { tableName: "sources", label: "Sourcing Channels", count: sourceCount },
    { tableName: "buyers", label: "Buyers & Categories", count: buyerCount },
    { tableName: "monthly_snapshots", label: "Monthly Snapshots", count: snapshotCount },
    { tableName: "audit_logs", label: "System Audit Logs", count: auditLogCount },
  ];

  const recentAuditLogs: AuditLogItem[] = rawAuditLogs.map((log) => ({
    id: log.id,
    actorId: log.actorId,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    reason: log.reason,
    createdAt: log.createdAt.toISOString(),
  }));

  const posture: SystemSecurityPosture = {
    authConfigured: isAuthConfigured(),
    databaseConfigured: isDatabaseConfigured(),
    storageConfigured: isBlobConfigured(),
    sessionStrategy: "JWT Signed Session Cookie (HS256 / HTTP-Only)",
    passwordPolicy: "Bcrypt (10 Salt Rounds) - Never stored in plain text",
    rateLimitEnabled: true,
    privateGoogleSheets: {
      isServerSideOnly: true,
      isPublicWebDisabled: true,
      credentialsConfigured: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SHEETS_ID),
    },
  };

  return {
    users,
    tableCounts,
    posture,
    recentAuditLogs,
    currentUserRole: actor.role,
  };
}
