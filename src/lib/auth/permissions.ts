export const appRoles = ["ADMIN", "STAFF", "VIEWER"] as const;
export type AppRole = (typeof appRoles)[number];

export const permissions = [
  "cars:read",
  "cars:write",
  "finance:read",
  "finance:write",
  "finance:void",
  "reports:read",
  "users:manage",
  "contacts:read",
  "contacts:manage",
] as const;

export type Permission = (typeof permissions)[number];

const rolePermissions: Record<AppRole, ReadonlySet<Permission>> = {
  ADMIN: new Set(permissions),
  STAFF: new Set([
    "cars:read",
    "cars:write",
    "finance:read",
    "finance:write",
    "reports:read",
    "contacts:read",
    "contacts:manage",
  ]),
  VIEWER: new Set(["cars:read", "finance:read", "reports:read"]),
};

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return rolePermissions[role].has(permission);
}
