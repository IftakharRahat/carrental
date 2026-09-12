import { z } from "zod";

export const DEFAULT_BUSINESS_NAME = "USED GARAGE UAE";
export const DEFAULT_BUSINESS_PHONE = "+971 56 270 9960";
export const DEFAULT_BUSINESS_ADDRESS = "Sharjah 10 Industrial Area";
export const DEFAULT_TERMS =
  "This offer is based on the vehicle information. If the actual condition, damage, mechanical issues or missing parts differ from the information provided, the offer price may be revised.";
export const DEFAULT_THANK_YOU = "Thank you for contacting USED GARAGE UAE.";

export const quotationInputSchema = z.object({
  id: z.string().uuid().optional(),
  businessName: z.string().trim().min(1, "Business name is required").default(DEFAULT_BUSINESS_NAME),
  businessPhone: z.string().trim().min(1, "Business phone is required").default(DEFAULT_BUSINESS_PHONE),
  businessAddress: z.string().trim().min(1, "Business address is required").default(DEFAULT_BUSINESS_ADDRESS),
  quotationDate: z.string().trim().min(1, "Date is required"),
  customerName: z.string().trim().min(1, "Customer name is required"),
  customerWhatsapp: z.string().trim().optional().nullable(),
  customerLocation: z.string().trim().optional().nullable(),
  vehicleModel: z.string().trim().min(1, "Vehicle make & model is required"),
  modelYear: z
    .number()
    .int()
    .min(1950)
    .max(new Date().getFullYear() + 2)
    .optional()
    .nullable(),
  condition: z.string().trim().min(1, "Condition is required").default("Accident / Damaged"),
  customerNotes: z.string().trim().optional().nullable(),
  askingPrice: z.number().nonnegative().optional().nullable(),
  offerPrice: z.number().positive("Offer price must be greater than 0"),
  terms: z.string().trim().default(DEFAULT_TERMS),
  status: z.enum(["OFFERED", "ACCEPTED", "REJECTED", "EXPIRED"]).default("OFFERED"),
});

export type QuotationInput = z.infer<typeof quotationInputSchema>;

export type QuotationData = {
  id: string;
  quotationNumber: number;
  quotationNumberFormatted: string;
  businessName: string;
  businessPhone: string;
  businessAddress: string;
  quotationDate: string;
  customerName: string;
  customerWhatsapp: string | null;
  customerLocation: string | null;
  vehicleModel: string;
  modelYear: number | null;
  condition: string;
  customerNotes: string | null;
  askingPrice: number | null;
  offerPrice: number;
  terms: string;
  status: "OFFERED" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  createdAt: string;
  updatedAt: string;
};

export function formatQuotationNumber(num: number): string {
  return `QUO-${String(num).padStart(4, "0")}`;
}

export function formatQuotationDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return String(date);
  }
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function generateQuotationWhatsAppMessage(quotation: {
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
  quotationDate: string;
  customerName: string;
  customerWhatsapp?: string | null;
  customerLocation?: string | null;
  vehicleModel: string;
  modelYear?: number | null;
  condition: string;
  customerNotes?: string | null;
  askingPrice?: number | null;
  offerPrice: number;
  terms?: string;
  quotationNumberFormatted?: string;
}): string {
  const bName = quotation.businessName || DEFAULT_BUSINESS_NAME;
  const bPhone = quotation.businessPhone || DEFAULT_BUSINESS_PHONE;
  const bAddress = quotation.businessAddress || DEFAULT_BUSINESS_ADDRESS;
  const terms = quotation.terms || DEFAULT_TERMS;

  const lines: string[] = [
    `🚗 *VEHICLE PURCHASE OFFER*`,
    `*${bName}*`,
    `📞 Call / WhatsApp: ${bPhone}`,
    `📍 ${bAddress}`,
    ``,
    `*Quotation Date:* ${quotation.quotationDate}`,
    quotation.quotationNumberFormatted ? `*Ref:* ${quotation.quotationNumberFormatted}` : "",
    ``,
    `👤 *Customer Details*`,
    `• Name: ${quotation.customerName}`,
    quotation.customerWhatsapp ? `• WhatsApp: ${quotation.customerWhatsapp}` : "",
    quotation.customerLocation ? `• Location: ${quotation.customerLocation}` : "",
    ``,
    `🚙 *Vehicle Details*`,
    `• Vehicle: ${quotation.vehicleModel}${quotation.modelYear ? ` (${quotation.modelYear})` : ""}`,
    `• Condition: ${quotation.condition}`,
    ``,
  ];

  if (quotation.customerNotes) {
    lines.push(
      `📋 *Customer-Provided Information*`,
      `According to ${quotation.customerName}:`,
      `"${quotation.customerNotes}"`,
      ``,
    );
  }

  lines.push(`💰 *Price Details*`);
  if (quotation.askingPrice != null && quotation.askingPrice > 0) {
    lines.push(`• Customer Asking Price: AED ${quotation.askingPrice.toLocaleString("en-US")}`);
  }
  lines.push(
    `• *OUR BEST MARKET-BASED OFFER:*`,
    `  👉 *AED ${quotation.offerPrice.toLocaleString("en-US")}* 👈`,
    ``,
  );

  lines.push(`⚖️ *Terms & Conditions*`, `_${terms}_`, ``, `Thank you for contacting ${bName}.`, `📞 ${bPhone}`);

  return lines.filter(Boolean).join("\n");
}

export function generateWhatsAppUrl(phone: string | null | undefined, message: string): string {
  const cleanPhone = (phone ?? "").replace(/[^0-9]/g, "");
  const encodedText = encodeURIComponent(message);
  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}
