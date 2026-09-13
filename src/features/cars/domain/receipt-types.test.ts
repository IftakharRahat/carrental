import { describe, expect, it } from "vitest";
import { generateReceiptWhatsAppMessage } from "./receipt-types";

describe("generateReceiptWhatsAppMessage", () => {
  it("generates a formatted WhatsApp message with full details", () => {
    const message = generateReceiptWhatsAppMessage({
      businessName: "Car Scrap Business",
      businessPhone: "+971 56 270 9960",
      businessAddress: "Sharjah 10 Industrial Area, UAE",
      voucherNumber: "PV-CAR-0011",
      receiptDate: "2026-09-12",
      sellerName: "Ahmed Al Mansoori",
      sellerPhone: "+971 50 123 4567",
      sellerEmiratesId: "784-1990-1234567-1",
      carNumber: "CAR-0011",
      carTitle: "CAR-0011 · Toyota Camry",
      vinChassis: "4T1BF1FK5EU123456",
      condition: "Accident / Damaged",
      purchasePrice: 12500,
      paymentMethod: "Cash",
    });

    expect(message).toContain("VEHICLE PURCHASE PAYMENT VOUCHER");
    expect(message).toContain("PV-CAR-0011");
    expect(message).toContain("Ahmed Al Mansoori");
    expect(message).toContain("+971 50 123 4567");
    expect(message).toContain("784-1990-1234567-1");
    expect(message).toContain("Toyota Camry");
    expect(message).toContain("AED 12,500");
    expect(message).toContain("Cash");
    expect(message).toContain("Thank you for doing business with Car Scrap Business.");
  });

  it("uses custom thank-you note when provided", () => {
    const message = generateReceiptWhatsAppMessage({
      voucherNumber: "PV-CAR-0011",
      receiptDate: "2026-09-12",
      sellerName: "Ahmed Al Mansoori",
      carNumber: "CAR-0011",
      carTitle: "CAR-0011 · Toyota Camry",
      purchasePrice: 12500,
      paymentMethod: "Cash",
      thankYouNote: "We appreciate your partnership with our Sharjah team.",
    });

    expect(message).toContain("We appreciate your partnership with our Sharjah team.");
  });
});
