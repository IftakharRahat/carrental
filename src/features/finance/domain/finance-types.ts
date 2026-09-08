import { z } from "zod";
import type { PaymentMethod } from "@/features/sales/domain/sales-types";

export const MONEY_IN_CATEGORIES = [
  "Whole Car Sale",
  "Engine Sale",
  "Body Sale",
  "Gearbox Sale",
  "Copper Sale",
  "Parts Sale",
  "Other Item Sale",
  "Other Income",
  "Capital Injection",
] as const;

export const MONEY_OUT_CATEGORIES = [
  "Car Purchase",
  "Car Expenses",
  "Business Expenses",
  "Commission",
  "Other",
  "Capital Withdrawal",
] as const;

export type StandardMoneyInCategory = (typeof MONEY_IN_CATEGORIES)[number];
export type StandardMoneyOutCategory = (typeof MONEY_OUT_CATEGORIES)[number];

const positiveAedAmount = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid AED amount")
  .refine((value) => Number(value) > 0, "Amount must be greater than zero");

const nonNegativeAedAmount = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid AED amount")
  .refine((value) => Number(value) >= 0, "Amount cannot be negative");

export const createManualTransactionSchema = z.object({
  direction: z.enum(["IN", "OUT"] as const, {
    error: "Select Money In or Money Out",
  }),
  category: z.string().trim().min(1, "Select a category"),
  customCategory: z.string().trim().max(80).optional(),
  amount: positiveAedAmount,
  transactionDate: z.string().min(1, "Transaction date is required"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "OTHER"] as const, {
    error: "Select a payment method",
  }),
  carId: z.string().uuid("Invalid car ID").optional().or(z.literal("")),
  description: z
    .string()
    .trim()
    .min(3, "Description / reason is required for audit integrity (min 3 characters)")
    .max(500),
});

export type CreateManualTransactionInput = z.infer<
  typeof createManualTransactionSchema
>;

export const createCustomCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name cannot exceed 50 characters"),
  direction: z.enum(["IN", "OUT"] as const, {
    error: "Select Money In or Money Out",
  }),
});

export type CreateCustomCategoryInput = z.infer<
  typeof createCustomCategorySchema
>;

export const configureOpeningCashSchema = z.object({
  amount: nonNegativeAedAmount,
});

export type ConfigureOpeningCashInput = z.infer<
  typeof configureOpeningCashSchema
>;

export type LedgerRowItem = {
  id: string;
  transactionDate: string;
  direction: "IN" | "OUT";
  category: string;
  customCategory: string | null;
  referenceType: string;
  referenceId: string;
  carId: string | null;
  carNumber: number | null;
  carName: string | null;
  description: string;
  paymentMethod: PaymentMethod;
  moneyIn: number | null;
  moneyOut: number | null;
  runningBalance: number;
  isOpeningBalance: boolean;
};

export type FinanceSummaryKpis = {
  openingCash: number;
  moneyIn: number;
  moneyOut: number;
  availableCash: number;
};

export type CustomCategoryItem = {
  id: string;
  name: string;
  direction: "IN" | "OUT";
  createdAt: string;
};

export type FinanceFilterParams = {
  datePreset?: "ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";
  startDate?: string;
  endDate?: string;
  direction?: "ALL" | "IN" | "OUT";
  category?: string;
  paymentMethod?: string;
  carId?: string;
  search?: string;
};
