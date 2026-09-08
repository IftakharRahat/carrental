// @vitest-environment node
import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "./jwt";

describe("JWT Authentication Utility", () => {
  it("signs and verifies a valid JWT session payload", async () => {
    const payload = {
      profileId: "user-uuid-123",
      email: "test@carscrap.ae",
      name: "Test User",
      role: "ADMIN",
    };

    const token = await signToken(payload);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const verified = await verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.profileId).toBe(payload.profileId);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.name).toBe(payload.name);
    expect(verified?.role).toBe(payload.role);
  });

  it("returns null for malformed or tampered token", async () => {
    const verified = await verifyToken("invalid-token-string");
    expect(verified).toBeNull();
  });
});
