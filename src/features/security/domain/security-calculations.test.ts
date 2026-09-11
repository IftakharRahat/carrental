import { describe, expect, it } from "vitest";

import {
  calculateTotalRecords,
  ROLE_DEFINITIONS,
  summarizeUserRoles,
  validateUserDeactivation,
} from "./security-calculations";
import type { UserProfileItem } from "./security-types";

describe("security-calculations", () => {
  it("defines Section 17.2 role matrix accurately", () => {
    expect(ROLE_DEFINITIONS).toHaveLength(3);
    const admin = ROLE_DEFINITIONS.find((r) => r.role === "ADMIN");
    expect(admin?.permissions).toContain("Manage user accounts, roles & access permissions");

    const staff = ROLE_DEFINITIONS.find((r) => r.role === "STAFF");
    expect(staff?.restrictedFrom).toContain("Destructive financial corrections / voiding transactions");

    const viewer = ROLE_DEFINITIONS.find((r) => r.role === "VIEWER");
    expect(viewer?.restrictedFrom).toContain("Creating or editing any car records");
    expect(viewer?.restrictedFrom).toContain(
      "Viewing source or buyer contact info (profiles, phone numbers, locations)",
    );
    expect(viewer?.permissions).toContain(
      "Export reports to CSV (Sanitized without source or buyer details)",
    );
  });

  it("summarizes user roles correctly", () => {
    const users: UserProfileItem[] = [
      {
        id: "1",
        authUserId: "auth-1",
        name: "Admin User",
        email: "admin@test.com",
        role: "ADMIN",
        isActive: true,
        createdAt: "2026-08-01",
        updatedAt: "2026-08-01",
      },
      {
        id: "2",
        authUserId: "auth-2",
        name: "Staff User",
        email: "staff@test.com",
        role: "STAFF",
        isActive: true,
        createdAt: "2026-08-01",
        updatedAt: "2026-08-01",
      },
      {
        id: "3",
        authUserId: "auth-3",
        name: "Inactive Viewer",
        email: "viewer@test.com",
        role: "VIEWER",
        isActive: false,
        createdAt: "2026-08-01",
        updatedAt: "2026-08-01",
      },
    ];

    const summary = summarizeUserRoles(users);
    expect(summary.totalUsers).toBe(3);
    expect(summary.activeUsers).toBe(2);
    expect(summary.activeAdmins).toBe(1);
    expect(summary.activeStaff).toBe(1);
    expect(summary.activeViewers).toBe(0);
    expect(summary.inactiveUsers).toBe(1);
  });

  it("prevents demoting or deactivating the last remaining active Admin", () => {
    const users: UserProfileItem[] = [
      {
        id: "admin-sole",
        authUserId: "auth-1",
        name: "Sole Admin",
        email: "admin@test.com",
        role: "ADMIN",
        isActive: true,
        createdAt: "2026-08-01",
        updatedAt: "2026-08-01",
      },
      {
        id: "staff-1",
        authUserId: "auth-2",
        name: "Staff Guy",
        email: "staff@test.com",
        role: "STAFF",
        isActive: true,
        createdAt: "2026-08-01",
        updatedAt: "2026-08-01",
      },
    ];

    // Attempting to deactivate sole admin
    const deactCheck = validateUserDeactivation(users, "admin-sole", false, "ADMIN");
    expect(deactCheck.allowed).toBe(false);
    expect(deactCheck.reason).toContain("requires at least one active Administrator");

    // Attempting to demote sole admin to STAFF
    const demoteCheck = validateUserDeactivation(users, "admin-sole", true, "STAFF");
    expect(demoteCheck.allowed).toBe(false);

    // Modifying non-admin user is allowed
    const staffCheck = validateUserDeactivation(users, "staff-1", false, "STAFF");
    expect(staffCheck.allowed).toBe(true);
  });

  it("calculates total database table records sum", () => {
    const counts = [
      { tableName: "cars", label: "Cars", count: 12 },
      { tableName: "expenses", label: "Expenses", count: 45 },
      { tableName: "transactions", label: "Ledger", count: 78 },
    ];
    expect(calculateTotalRecords(counts)).toBe(135);
  });
});
