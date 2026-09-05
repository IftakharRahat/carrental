import { z } from "zod";

export type RecoveryMode = "WHOLE_CAR" | "ITEM";

export type RecoveryItemType =
  | "ENGINE"
  | "BODY"
  | "GEARBOX"
  | "COPPER"
  | "PARTS"
  | "OTHER";

export type RecoveryItemStatus = "PENDING" | "SOLD" | "CLOSED";

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CHEQUE" | "OTHER";

export const recoveryItemTypeLabels: Record<RecoveryItemType, string> = {
  ENGINE: "Engine",
  BODY: "Body",
  GEARBOX: "Gearbox",
  COPPER: "Copper",
  PARTS: "Parts",
  OTHER: "Other",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

export type SellCarSummary = {
  id: string;
  carNumber: string;
  rawCarNumber: number;
  brand: string;
  model: string;
  year: number | null;
  condition: string;
  status: "IN_STOCK" | "PARTIALLY_RECOVERED" | "COMPLETED" | "VOIDED";
  purchasePrice: number;
  totalExpenses: number;
  totalInvestment: number;
  totalRecovery: number;
  pendingItemsCount: number;
  pendingItems: Array<{
    id: string;
    type: RecoveryItemType;
    label: string | null;
    status: RecoveryItemStatus;
  }>;
  mainPhotoUrl: string | null;
};

export type BuyerOption = {
  id: string;
  name: string;
  phone: string | null;
  companyName: string | null;
  types: string[];
};

export const wholeCarSaleInputSchema = z.object({
  carId: z.string().uuid("Invalid car ID"),
  saleDate: z.string().min(1, "Sale date is required"),
  buyerId: z.string().uuid("Please select or create a buyer"),
  sellingPrice: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid AED amount")
    .refine((val) => Number(val) > 0, "Selling price must be greater than zero"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
  notes: z.string().trim().max(2000).optional(),
});

export const itemSaleInputSchema = z.object({
  carId: z.string().uuid("Invalid car ID"),
  itemId: z.string().uuid().optional(),
  itemType: z.enum(["ENGINE", "BODY", "GEARBOX", "COPPER", "PARTS", "OTHER"]),
  itemLabel: z.string().trim().max(100).optional(),
  buyerId: z.string().uuid("Please select or create a buyer"),
  saleDate: z.string().min(1, "Sale date is required"),
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid AED amount")
    .refine((val) => Number(val) > 0, "Amount must be greater than zero"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
  notes: z.string().trim().max(2000).optional(),
});

export const quickBuyerInputSchema = z.object({
  name: z.string().trim().min(1, "Buyer name is required").max(120),
  phone: z.string().trim().max(30).optional(),
  whatsapp: z.string().trim().max(30).optional(),
  companyName: z.string().trim().max(120).optional(),
  location: z.string().trim().max(150).optional(),
  notes: z.string().trim().max(1000).optional(),
});
