import { z } from "zod";
import type { PaymentMethod } from "@/features/sales/domain/sales-types";

// Section 13.1 Expense Category Groups
export const FIXED_EXPENSE_CATEGORIES = [
  "Shop Rent",
  "Electricity",
  "Phone / Internet",
  "Staff Salary",
  "Warehouse/Yard Rent",
  "Insurance",
  "License/Renewal",
] as const;

export const OPERATING_EXPENSE_CATEGORIES = [
  "General Transport",
  "Fuel",
  "Advertising/Marketing",
  "Cleaning",
  "Tools/Equipment",
  "Office/Miscellaneous",
] as const;

export const FINANCIAL_EXPENSE_CATEGORIES = [
  "Bank Charges",
  "Transfer Charges",
] as const;

export const OTHER_EXPENSE_CATEGORIES = [
  "Partner Field Expense",
  "Other Business Expense",
] as const;

export const ALL_BUSINESS_EXPENSE_CATEGORIES = [
  ...FIXED_EXPENSE_CATEGORIES,
  ...OPERATING_EXPENSE_CATEGORIES,
  ...FINANCIAL_EXPENSE_CATEGORIES,
  ...OTHER_EXPENSE_CATEGORIES,
] as const;

export type BusinessExpenseCategoryName =
  (typeof ALL_BUSINESS_EXPENSE_CATEGORIES)[number];

export type ExpenseCategoryGroup =
  | "Fixed / Regular"
  | "Operating"
  | "Financial"
  | "Other";

export function getCategoryGroup(category: string): ExpenseCategoryGroup {
  if ((FIXED_EXPENSE_CATEGORIES as readonly string[]).includes(category))
    return "Fixed / Regular";
  if ((OPERATING_EXPENSE_CATEGORIES as readonly string[]).includes(category))
    return "Operating";
  if ((FINANCIAL_EXPENSE_CATEGORIES as readonly string[]).includes(category))
    return "Financial";
  return "Other";
}

/**
 * Maps a Section 13.1 human subcategory to the Prisma BusinessExpenseCategory enum.
 */
export function mapToPrismaBusinessCategory(subcategory: string):
  | "RENT"
  | "UTILITIES"
  | "FUEL"
  | "SALARY"
  | "OFFICE"
  | "MARKETING"
  | "MAINTENANCE"
  | "PROFESSIONAL_FEES"
  | "OTHER" {
  switch (subcategory) {
    case "Shop Rent":
    case "Warehouse/Yard Rent":
      return "RENT";
    case "Electricity":
    case "Phone / Internet":
      return "UTILITIES";
    case "Staff Salary":
      return "SALARY";
    case "Fuel":
      return "FUEL";
    case "Advertising/Marketing":
      return "MARKETING";
    case "Cleaning":
    case "Tools/Equipment":
      return "MAINTENANCE";
    case "Office/Miscellaneous":
      return "OFFICE";
    case "Insurance":
    case "License/Renewal":
      return "PROFESSIONAL_FEES";
    case "Partner Field Expense":
    case "Other Business Expense":
      return "OTHER";
    default:
      return "OTHER";
  }
}

const positiveAedAmount = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid AED amount")
  .refine((value) => Number(value) > 0, "Amount must be greater than zero");

export const createBusinessExpenseSchema = z.object({
  expenseDate: z.string().min(1, "Expense date is required"),
  category: z.string().trim().min(1, "Category is required"),
  amount: positiveAedAmount,
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "OTHER"] as const, {
    error: "Select a payment method",
  }),
  description: z
    .string()
    .trim()
    .min(3, "Description is required (min 3 characters)")
    .max(500),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CreateBusinessExpenseInput = z.infer<
  typeof createBusinessExpenseSchema
>;

export const updateBusinessExpenseSchema = createBusinessExpenseSchema.extend({
  id: z.string().uuid("Invalid expense ID"),
});

export type UpdateBusinessExpenseInput = z.infer<
  typeof updateBusinessExpenseSchema
>;

export const voidBusinessExpenseSchema = z.object({
  id: z.string().uuid("Invalid expense ID"),
  voidReason: z
    .string()
    .trim()
    .min(3, "Void reason is required (min 3 characters)")
    .max(500),
});

export type VoidBusinessExpenseInput = z.infer<
  typeof voidBusinessExpenseSchema
>;

export type BusinessExpenseItem = {
  id: string;
  expenseDate: string;
  category: string;
  group: ExpenseCategoryGroup;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  notes: string | null;
  status: "ACTIVE" | "VOIDED";
  voidReason: string | null;
  voidedAt: string | null;
  createdAt: string;
};

export type BusinessExpensesPageKpis = {
  currentMonthTotal: number;
  currentMonthCount?: number;
  topCategoryThisMonth: string | null;
  topCategoryAmount: number;
  expenseToRevenueRatio: number;
  avgDailyOverhead: number;
  daysElapsedInMonth: number;
  overheadCostPerCarPurchased: number;
  carsPurchasedThisMonthCount: number;
  momExpenseGrowth: number;
  lastMonthTotal: number;
  monthlyRevenue: number;
};

// Section 14: Combined Expense Details Types
export type UnifiedExpenseType = "CAR" | "BUSINESS";

export type UnifiedExpenseRow = {
  id: string;
  expenseDate: string;
  expenseType: UnifiedExpenseType;
  category: string;
  reference: string;
  carId: string | null;
  carNumber: number | null;
  carName: string | null;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  status: "ACTIVE" | "VOIDED";
};

export type ExpenseDetailsSummary = {
  carExpenses: number;
  businessExpenses: number;
  totalExpenses: number;
};

export type ExpenseDetailsFilterParams = {
  datePreset?: "THIS_WEEK" | "LAST_WEEK" | "THIS_MONTH" | "LAST_MONTH" | "CUSTOM";
  startDate?: string;
  endDate?: string;
  expenseType?: "ALL" | "CAR" | "BUSINESS";
  category?: string;
  paymentMethod?: string;
  search?: string;
};
