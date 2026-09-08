// @vitest-environment node
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("Password Hashing Utility", () => {
  it("hashes password and verifies correctly", async () => {
    const plain = "securePassword123";
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(hash.startsWith("$2")).toBe(true);

    const match = await verifyPassword(plain, hash);
    expect(match).toBe(true);

    const wrongMatch = await verifyPassword("wrongPassword", hash);
    expect(wrongMatch).toBe(false);
  });
});
