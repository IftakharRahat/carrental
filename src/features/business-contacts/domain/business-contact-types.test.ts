import { describe, expect, it } from "vitest";
import {
  createBusinessContactSchema,
  updateBusinessContactSchema,
} from "./business-contact-types";

describe("Business Contact Schema Validation", () => {
  it("validates a valid business contact with all fields", () => {
    const input = {
      name: "rahat",
      businessName: "ABC Web Solutions",
      category: "Web & IT",
      purpose: "webpage handling website development",
      phone: "+880 1700 000000",
      whatsapp: "+880 1700 000000",
      email: "rahat@example.com",
      location: "Dhaka",
      notes: "Website developer from Dhaka",
      isImportant: true,
    };

    const parsed = createBusinessContactSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("rahat");
      expect(parsed.data.businessName).toBe("ABC Web Solutions");
      expect(parsed.data.category).toBe("Web & IT");
      expect(parsed.data.isImportant).toBe(true);
    }
  });

  it("requires a non-empty name and category", () => {
    const invalidInput = {
      name: "  ",
      category: "",
    };

    const parsed = createBusinessContactSchema.safeParse(invalidInput);
    expect(parsed.success).toBe(false);
  });

  it("validates optional email format only if provided", () => {
    const emptyEmail = {
      name: "Test Partner",
      category: "Legal & PRO",
      email: "",
    };
    expect(createBusinessContactSchema.safeParse(emptyEmail).success).toBe(true);

    const invalidEmail = {
      name: "Test Partner",
      category: "Legal & PRO",
      email: "not-an-email",
    };
    expect(createBusinessContactSchema.safeParse(invalidEmail).success).toBe(false);
  });

  it("validates updateBusinessContactSchema requires uuid id", () => {
    const validUpdate = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Updated Contact",
      category: "Transport & Towing",
      isImportant: false,
    };
    expect(updateBusinessContactSchema.safeParse(validUpdate).success).toBe(true);

    const invalidUpdate = {
      id: "invalid-id",
      name: "Updated Contact",
      category: "Transport & Towing",
      isImportant: false,
    };
    expect(updateBusinessContactSchema.safeParse(invalidUpdate).success).toBe(false);
  });
});
