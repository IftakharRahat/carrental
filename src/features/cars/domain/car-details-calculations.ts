import type {
  CarExpenseCategory,
  CarExpenseRecord,
  CarKpis,
  CarRecoveryRecord,
  CarStatus,
  RecoveryItemType,
} from "./car-details-types";

export const expenseCategoryLabels: Record<CarExpenseCategory, string> = {
  TRANSPORT: "Transport",
  LABOUR: "Labour",
  PARTS: "Parts",
  REPAIR: "Repair",
  RTA_DOCUMENTATION: "RTA / Documentation",
  OTHER: "Other Car Expense",
};

export const recoveryTypeLabels: Record<RecoveryItemType, string> = {
  ENGINE: "Engine",
  BODY: "Body",
  GEARBOX: "Gearbox",
  COPPER: "Copper",
  PARTS: "Parts",
  OTHER: "Other",
};

export const carStatusConfig: Record<
  CarStatus,
  { label: string; className: string }
> = {
  IN_STOCK: {
    label: "In Stock",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400 font-medium",
  },
  PARTIALLY_RECOVERED: {
    label: "Partially Recovered",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium",
  },
  COMPLETED: {
    label: "Completed",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium",
  },
  VOIDED: {
    label: "Voided",
    className: "border-destructive/30 bg-destructive/10 text-destructive font-medium",
  },
};

export function calculateCarKpis({
  status,
  purchasePrice,
  expenses,
  recoveries,
}: {
  status: CarStatus;
  purchasePrice: number;
  expenses: readonly Pick<CarExpenseRecord, "amount" | "status">[];
  recoveries: readonly Pick<CarRecoveryRecord, "amount" | "status">[];
}): CarKpis {
  const purchase = Math.max(0, purchasePrice);

  const activeExpenses = expenses.filter((e) => e.status === "ACTIVE");
  const totalExpenses = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  const totalInvestment = purchase + totalExpenses;

  const activeRecoveries = recoveries.filter((r) => r.status === "ACTIVE");
  const totalRecovery = activeRecoveries.reduce((sum, r) => sum + r.amount, 0);

  // Critical Specification Rule (Section 7.2):
  // "If status = Completed: Recovery - Investment."
  // "If In Stock or Partially Recovered: show Pending / Not Realized; do not label the current difference as profit/loss."
  const isCompleted = status === "COMPLETED";

  return {
    purchase,
    expenses: totalExpenses,
    investment: totalInvestment,
    recovery: totalRecovery,
    realizedProfit: isCompleted ? totalRecovery - totalInvestment : null,
    isProfitPending: !isCompleted,
  };
}
