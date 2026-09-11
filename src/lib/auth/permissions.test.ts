import { describe, expect, it } from "vitest";
import { hasPermission } from "./permissions";

describe("permissions", () => {
  it("enforces that VIEWER cannot access contacts", () => {
    expect(hasPermission("VIEWER", "contacts:read")).toBe(false);
    expect(hasPermission("VIEWER", "contacts:manage")).toBe(false);
    expect(hasPermission("VIEWER", "cars:write")).toBe(false);
    expect(hasPermission("VIEWER", "finance:write")).toBe(false);
    expect(hasPermission("VIEWER", "cars:read")).toBe(true);
    expect(hasPermission("VIEWER", "reports:read")).toBe(true);
    expect(hasPermission("VIEWER", "finance:read")).toBe(true);
  });

  it("allows ADMIN and STAFF to read and manage contacts", () => {
    expect(hasPermission("ADMIN", "contacts:read")).toBe(true);
    expect(hasPermission("ADMIN", "contacts:manage")).toBe(true);
    expect(hasPermission("STAFF", "contacts:read")).toBe(true);
    expect(hasPermission("STAFF", "contacts:manage")).toBe(true);
  });
});
