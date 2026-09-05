import { z } from "zod";

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => value || undefined)
    .optional();

export function normalizePhoneNumber(phone?: string | null): string {
  if (!phone) return "";
  // Strip all non-digit characters
  return phone.replace(/\D/g, "");
}

export const createSellerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  phone: optionalText(40),
  whatsapp: optionalText(40),
  emiratesId: optionalText(80),
  location: optionalText(160),
  notes: optionalText(1000),
  allowDuplicatePhone: z.boolean().optional(),
});

export type CreateSellerInput = z.infer<typeof createSellerSchema>;

export const updateSellerSchema = createSellerSchema.extend({
  id: z.string().uuid("Invalid seller ID"),
  isActive: z.boolean().optional(),
});

export type UpdateSellerInput = z.infer<typeof updateSellerSchema>;

export type SellerKpis = {
  carsSoldToYou: number;
  totalAmount: number;
  lastDeal: string | null;
};

export type OverallSellersKpis = {
  totalSellers: number;
  activeSellers: number;
  totalCarsPurchased: number;
  totalSpend: number;
  avgCarsPerSeller: number;
};

export type SellerCarItem = {
  id: string;
  carNumber: number;
  brand: string;
  model: string;
  year: number | null;
  purchaseDate: string;
  purchasePrice: number;
  status: string;
};

export type SellerRowData = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  emiratesId: string | null;
  location: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  kpis: SellerKpis;
};

export type SellerProfileData = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  emiratesId: string | null;
  location: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  kpis: SellerKpis;
  linkedCars: SellerCarItem[];
};
