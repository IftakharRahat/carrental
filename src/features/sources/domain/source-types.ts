import { z } from "zod";
import type { PaymentMethod } from "@/features/sales/domain/sales-types";

export const SOURCE_CATEGORIES = ["PEOPLE", "ONLINE", "OFFLINE"] as const;
export type SourceCategory = (typeof SOURCE_CATEGORIES)[number];

export const SOURCE_TYPES = [
  // People
  "GARAGE_OWNER",
  "MIDDLEMAN",
  "REFERRAL",
  "AUCTION",
  // Online
  "FACEBOOK",
  "TIKTOK",
  "INSTAGRAM",
  // Offline
  "WALK_IN",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const SOURCE_TYPE_METADATA: Record<
  SourceType,
  { label: string; category: SourceCategory }
> = {
  GARAGE_OWNER: { label: "Garage Owner", category: "PEOPLE" },
  MIDDLEMAN: { label: "Middleman", category: "PEOPLE" },
  REFERRAL: { label: "Referral", category: "PEOPLE" },
  AUCTION: { label: "Auction", category: "PEOPLE" },
  FACEBOOK: { label: "Facebook", category: "ONLINE" },
  TIKTOK: { label: "TikTok", category: "ONLINE" },
  INSTAGRAM: { label: "Instagram", category: "ONLINE" },
  WALK_IN: { label: "Walk-in", category: "OFFLINE" },
};

export const SOURCE_CATEGORY_LABELS: Record<SourceCategory, string> = {
  PEOPLE: "People",
  ONLINE: "Online",
  OFFLINE: "Offline",
};

export function getSourceCategory(type: string): SourceCategory {
  const meta = SOURCE_TYPE_METADATA[type as SourceType];
  return meta ? meta.category : "PEOPLE";
}

export function getSourceTypeLabel(type: string): string {
  const meta = SOURCE_TYPE_METADATA[type as SourceType];
  return meta ? meta.label : type.replace(/_/g, " ");
}

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => value || undefined)
    .optional();

const positiveAedAmount = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid AED amount")
  .refine((value) => Number(value) > 0, "Amount must be greater than zero");

export const createSourceSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  type: z.enum(SOURCE_TYPES, {
    error: "Select a valid source type",
  }),
  phone: optionalText(40),
  whatsapp: optionalText(40),
  location: optionalText(160),
  notes: optionalText(1000),
});

export type CreateSourceInput = z.infer<typeof createSourceSchema>;

export const updateSourceSchema = createSourceSchema.extend({
  id: z.string().uuid("Invalid source ID"),
  isActive: z.boolean().optional(),
});

export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;

export const payCommissionSchema = z.object({
  sourceId: z.string().uuid("Invalid source ID"),
  carId: z.string().uuid("Invalid car ID").optional().or(z.literal("")),
  amount: positiveAedAmount,
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "OTHER"] as const, {
    error: "Select a payment method",
  }),
  notes: optionalText(500),
});

export type PayCommissionInput = z.infer<typeof payCommissionSchema>;

export type SourceKpis = {
  totalLeads: number;
  carsBought: number;
  totalPurchaseValue: number;
  commissionPaid: number;
  totalProfit: number;
  avgProfitPerCar: number;
  lastDeal: string | null;
};

export type OverallSourcesKpis = {
  totalSources: number;
  activeSources: number;
  totalCarsBought: number;
  totalPurchaseValue: number;
  totalCommissionPaid: number;
  topSource: string;
  topSourceType: string;
  avgProfitFromSource: number;
  repeatDealFrequency: number;
};

export type SourcedCarItem = {
  id: string;
  carNumber: number;
  brand: string;
  model: string;
  year: number | null;
  purchaseDate: string;
  purchasePrice: number;
  status: string;
};

export type SourceCommissionItem = {
  id: string;
  transactionDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  carId: string | null;
  carNumber?: number | null;
  carName?: string | null;
};

export type SourceRowData = {
  id: string;
  name: string;
  type: SourceType;
  typeLabel: string;
  category: SourceCategory;
  categoryLabel: string;
  phone: string | null;
  whatsapp: string | null;
  location: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  kpis: SourceKpis;
};

export type SourceProfileData = {
  id: string;
  name: string;
  type: SourceType;
  typeLabel: string;
  category: SourceCategory;
  categoryLabel: string;
  phone: string | null;
  whatsapp: string | null;
  location: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  kpis: SourceKpis;
  linkedCars: SourcedCarItem[];
  commissions: SourceCommissionItem[];
};
