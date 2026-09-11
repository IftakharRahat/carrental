import type {
  DatabaseTableCount,
  RolePermissionItem,
  UserProfileItem,
  UserRole,
} from "./security-types";

export const ROLE_DEFINITIONS: RolePermissionItem[] = [
  {
    role: "ADMIN",
    label: "Administrator",
    badgeVariant: "default",
    description:
      "Full administrative access to all business operations, financial corrections, and security controls.",
    permissions: [
      "Manage user accounts, roles & access permissions",
      "Full control of cars, sellers, sources & buyers",
      "Record, edit & void financial transactions (Section 12.5)",
      "Configure Opening Cash & custom cash categories",
      "Save & regenerate month-end business snapshots",
      "Generate & download full database backups",
    ],
    restrictedFrom: [],
  },
  {
    role: "STAFF",
    label: "Staff / Operator",
    badgeVariant: "secondary",
    description:
      "Operational access to inventory, sales, expenses, and contacts. Restricted from destructive financial actions.",
    permissions: [
      "Buy cars and record initial purchase details",
      "Record dismantling, part sales & recovery transactions",
      "Add car-specific and business overhead expenses",
      "Manage contacts (sellers, sources, buyers)",
      "View stock inventory and financial cash flow",
    ],
    restrictedFrom: [
      "Destructive financial corrections / voiding transactions",
      "Modifying system opening cash balance",
      "Managing user accounts and system security settings",
      "Generating full database exports",
    ],
  },
  {
    role: "VIEWER",
    label: "Viewer (Read-Only)",
    badgeVariant: "outline",
    description:
      "Auditor and investor access. Strictly read-only visibility into operational and reporting data.",
    permissions: [
      "View Dashboard metrics and summary KPIs",
      "View Stock inventory and vehicle profiles",
      "View Monthly Reports and financial ledger",
      "View Business Analytics across brands and conditions",
      "Export reports to CSV (Sanitized without source or buyer details)",
    ],
    restrictedFrom: [
      "Creating or editing any car records",
      "Recording any expense or recovery transactions",
      "Managing contacts or finance ledger entries",
      "Accessing security configuration or backups",
      "Viewing source or buyer contact info (profiles, phone numbers, locations)",
      "Exporting reports with sensitive source or buyer details",
    ],
  },
];

export function summarizeUserRoles(users: readonly UserProfileItem[]): {
  totalUsers: number;
  activeUsers: number;
  activeAdmins: number;
  activeStaff: number;
  activeViewers: number;
  inactiveUsers: number;
} {
  let activeUsers = 0;
  let activeAdmins = 0;
  let activeStaff = 0;
  let activeViewers = 0;
  let inactiveUsers = 0;

  for (const user of users) {
    if (user.isActive) {
      activeUsers += 1;
      if (user.role === "ADMIN") activeAdmins += 1;
      else if (user.role === "STAFF") activeStaff += 1;
      else if (user.role === "VIEWER") activeViewers += 1;
    } else {
      inactiveUsers += 1;
    }
  }

  return {
    totalUsers: users.length,
    activeUsers,
    activeAdmins,
    activeStaff,
    activeViewers,
    inactiveUsers,
  };
}

export function validateUserDeactivation(
  users: readonly UserProfileItem[],
  targetUserId: string,
  nextIsActive: boolean,
  nextRole: UserRole,
): { allowed: boolean; reason?: string } {
  const targetUser = users.find((u) => u.id === targetUserId);
  if (!targetUser) {
    return { allowed: false, reason: "Target user profile not found." };
  }

  // If the target is currently an active Admin and is being deactivated or demoted:
  if (targetUser.isActive && targetUser.role === "ADMIN") {
    const isDeactivating = !nextIsActive;
    const isDemoting = nextRole !== "ADMIN";

    if (isDeactivating || isDemoting) {
      const remainingAdmins = users.filter(
        (u) => u.id !== targetUserId && u.isActive && u.role === "ADMIN",
      );

      if (remainingAdmins.length === 0) {
        return {
          allowed: false,
          reason:
            "Cannot modify this user. The application requires at least one active Administrator.",
        };
      }
    }
  }

  return { allowed: true };
}

export function calculateTotalRecords(tableCounts: readonly DatabaseTableCount[]): number {
  return tableCounts.reduce((sum, item) => sum + item.count, 0);
}
