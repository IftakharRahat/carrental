import { z } from "zod";

export type MonthlyMetrics = {
  carsBought: number;
  carsCompleted: number;
  purchaseAmount: number;
  carExpenses: number;
  businessExpenses: number;
  totalRecovery: number;
  realizedCarProfit: number;
  netBusinessProfit: number;
  closingStockCars: number;
  closingStockValue: number;
  closingCash: number;
};

export type MonthEndSnapshot = {
  id?: string;
  year: number;
  month: number;
  closingStockCars: number;
  closingStockValue: number;
  closingCash: number;
  realizedCarProfit: number;
  netBusinessProfit: number;
  carsBought: number;
  carsCompleted: number;
  purchaseAmount: number;
  carExpenses: number;
  businessExpenses: number;
  totalRecovery: number;
  generatedById?: string;
  generatedAt?: string;
  isPreserved: boolean;
  hasDrift?: boolean;
};

export type CompletedCarRow = {
  id: string;
  carNumber: number;
  brand: string;
  model: string;
  purchaseDate: string;
  completionDate: string;
  daysInStock: number;
  totalInvestment: number;
  totalRecovery: number;
  realizedProfit: number;
};

export type PurchasedCarRow = {
  id: string;
  carNumber: number;
  brand: string;
  model: string;
  purchaseDate: string;
  sellerName: string;
  sourceName?: string | null;
  purchasePrice: number;
  paymentMethod: string;
};

export type MonthlyExpenseBreakdownItem = {
  category: string;
  type: "CAR" | "BUSINESS";
  amount: number;
  count: number;
};

export type MonthlyReportViewData = {
  year: number;
  month: number;
  monthLabel: string;
  metrics: MonthlyMetrics;
  snapshot: MonthEndSnapshot | null;
  completedCars: CompletedCarRow[];
  purchasedCars: PurchasedCarRow[];
  expenseBreakdown: MonthlyExpenseBreakdownItem[];
  availableMonths: { year: number; month: number; label: string }[];
};

export const monthYearParamSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2035),
  month: z.coerce.number().int().min(1).max(12),
});
