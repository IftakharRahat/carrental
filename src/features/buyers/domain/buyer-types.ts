import { z } from "zod";
import type { PaymentMethod, RecoveryItemType, RecoveryMode } from "@/features/sales/domain/sales-types";

export const STANDARD_BUYER_TYPES = [
  "Whole Car / Body",
  "Engine",
  "Scrap",
  "Copper",
  "Parts",
  "Other",
] as const;

export type StandardBuyerType = (typeof STANDARD_BUYER_TYPES)[number];

export type BuyerTypeOption = {
  id: string;
  name: string;
};

export type BuyerTransactionRecord = {
  id: string;
  carId: string;
  carNumber: string;
  carName: string;
  mode: RecoveryMode;
  itemType: RecoveryItemType | null;
  itemLabel: string | null;
  saleDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  status: "ACTIVE" | "VOIDED";
};

export type BuyerKpis = {
  totalPurchasesCount: number;
  totalAmountPaid: number;
  lastPurchaseDate: string | null;
};

export type BuyerListItem = {
  id: string;
  name: string;
  companyName: string | null;
  phone: string | null;
  whatsapp: string | null;
  location: string | null;
  notes: string | null;
  isActive: boolean;
  types: BuyerTypeOption[];
  kpis: BuyerKpis;
  createdAt: string;
};

export type BuyerProfileDetail = BuyerListItem & {
  transactions: BuyerTransactionRecord[];
};

export type BuyersPageKpis = {
  totalBuyers: number;
  activeBuyers: number;
  totalRecoveredAmount: number;
  averagePurchasePerBuyer: number;
  topCategory: string;
  repeatBuyerRate: number;
  repeatBuyersCount: number;
};

// Zod validation schemas
export const createBuyerInputSchema = z.object({
  name: z.string().trim().min(2, "Buyer name must be at least 2 characters."),
  companyName: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  whatsapp: z.string().trim().optional().nullable(),
  location: z.string().trim().optional().nullable(),
  buyerTypeIds: z.array(z.string().uuid()).default([]),
  notes: z.string().trim().optional().nullable(),
});

export const updateBuyerInputSchema = createBuyerInputSchema.extend({
  id: z.string().uuid(),
  isActive: z.boolean().default(true),
});

export type CreateBuyerInput = z.infer<typeof createBuyerInputSchema>;
export type UpdateBuyerInput = z.infer<typeof updateBuyerInputSchema>;
