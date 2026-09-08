import { z } from "zod";

export type UserRole = "ADMIN" | "STAFF" | "VIEWER";

export type UserProfileItem = {
  id: string;
  authUserId?: string | null;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RolePermissionItem = {
  role: UserRole;
  label: string;
  badgeVariant: "default" | "secondary" | "outline";
  description: string;
  permissions: string[];
  restrictedFrom: string[];
};

export type DatabaseTableCount = {
  tableName: string;
  label: string;
  count: number;
};

export type SystemSecurityPosture = {
  authConfigured: boolean;
  databaseConfigured: boolean;
  storageConfigured: boolean;
  sessionStrategy: string;
  passwordPolicy: string;
  rateLimitEnabled: boolean;
  privateGoogleSheets: {
    isServerSideOnly: boolean;
    isPublicWebDisabled: boolean;
    credentialsConfigured: boolean;
  };
};

export type AuditLogItem = {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string | null;
  createdAt: string;
};

export type SecuritySettingsViewData = {
  users: UserProfileItem[];
  tableCounts: DatabaseTableCount[];
  posture: SystemSecurityPosture;
  recentAuditLogs: AuditLogItem[];
  currentUserRole: UserRole;
};

export const updateUserRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z.enum(["ADMIN", "STAFF", "VIEWER"]),
  isActive: z.boolean(),
});

export const createUserSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["ADMIN", "STAFF", "VIEWER"]),
});
