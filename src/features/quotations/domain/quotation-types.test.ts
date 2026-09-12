import { describe, expect, it } from "vitest";
import {
  formatQuotationDate,
  formatQuotationNumber,
  generateQuotationWhatsAppMessage,
  generateWhatsAppUrl,
  quotationInputSchema,
} from "./quotation-types";

describe("Quotation Domain Logic & Formatting", () => {
  it("validates a complete quotation input schema", () => {
    const valid = {
      businessName: "USED GARAGE UAE",
      businessPhone: "+971 56 270 9960",
      businessAddress: "Sharjah 10 Industrial Area",
      quotationDate: "2026-09-11",
      customerName: "Ahmed Mohammed",
      customerWhatsapp: "+971 50 123 4567",
      customerLocation: "Sharjah, UAE",
      vehicleModel: "Nissan Patrol",
      modelYear: 2018,
      condition: "Accident / Damaged",
      customerNotes:
        "Front-end damaged, engine is running, airbags are deployed, and the vehicle has been standing for approximately 2 months.",
      askingPrice: 18000,
      offerPrice: 12500,
      terms: "This offer is based on the vehicle information.",
      status: "OFFERED" as const,
    };

    const parsed = quotationInputSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.customerName).toBe("Ahmed Mohammed");
      expect(parsed.data.offerPrice).toBe(12500);
      expect(parsed.data.askingPrice).toBe(18000);
    }
  });

  it("fails validation if offerPrice is missing or not positive", () => {
    const invalid = {
      quotationDate: "2026-09-11",
      customerName: "Ahmed Mohammed",
      vehicleModel: "Nissan Patrol",
      condition: "Accident / Damaged",
      offerPrice: 0,
    };

    const parsed = quotationInputSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("formats quotation reference number correctly", () => {
    expect(formatQuotationNumber(1)).toBe("QUO-0001");
    expect(formatQuotationNumber(42)).toBe("QUO-0042");
    expect(formatQuotationNumber(1024)).toBe("QUO-1024");
  });

  it("formats quotation dates nicely", () => {
    const formatted = formatQuotationDate("2026-09-11");
    expect(formatted).toContain("September");
    expect(formatted).toContain("2026");
  });

  it("generates a complete, structured WhatsApp message", () => {
    const msg = generateQuotationWhatsAppMessage({
      quotationDate: "11 September 2026",
      customerName: "Ahmed Mohammed",
      customerWhatsapp: "+971 50 123 4567",
      customerLocation: "Sharjah, UAE",
      vehicleModel: "Nissan Patrol",
      modelYear: 2018,
      condition: "Accident / Damaged",
      customerNotes: "Front-end damaged, engine is running",
      askingPrice: 18000,
      offerPrice: 12500,
    });

    expect(msg).toContain("VEHICLE PURCHASE OFFER");
    expect(msg).toContain("Ahmed Mohammed");
    expect(msg).toContain("Nissan Patrol (2018)");
    expect(msg).toContain("AED 18,000");
    expect(msg).toContain("AED 12,500");
    expect(msg).toContain("OUR BEST MARKET-BASED OFFER");
    expect(msg).toContain("+971 56 270 9960");
  });

  it("generates WhatsApp share URL with clean numbers", () => {
    const url = generateWhatsAppUrl("+971 50 123 4567", "Hello Ahmed");
    expect(url).toContain("https://api.whatsapp.com/send?phone=971501234567");
    expect(url).toContain("text=Hello%20Ahmed");
  });
});
