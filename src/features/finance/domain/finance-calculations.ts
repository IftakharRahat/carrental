import type {
  FinanceSummaryKpis,
  LedgerRowItem,
} from "./finance-types";

export type RawTransactionInput = {
  id: string;
  transactionDate: string | Date;
  createdAt: string | Date;
  direction: "IN" | "OUT";
  category: string;
  customCategory?: string | null;
  referenceType: string;
  referenceId: string;
  amount: number | string | { toString(): string };
  paymentMethod: string;
  description: string;
  carId?: string | null;
  carNumber?: number | null;
  carName?: string | null;
  status: string;
};

export function resolveLedgerCategory(
  tx: {
    category: string;
    customCategory?: string | null;
    referenceType: string;
    referenceId: string;
    direction: "IN" | "OUT";
  },
  itemTypeMap: Map<string, string> = new Map(),
): string {
  if (tx.customCategory && tx.customCategory.trim()) {
    return tx.customCategory.trim();
  }

  switch (tx.category) {
    case "CAR_PURCHASE":
      return "Car Purchase";
    case "CAR_EXPENSE":
      return "Car Expenses";
    case "BUSINESS_EXPENSE":
      return "Business Expenses";
    case "COMMISSION":
      return "Commission";
    case "WHOLE_CAR_SALE":
      return "Whole Car Sale";
    case "ITEM_SALE": {
      const itemType = itemTypeMap.get(tx.referenceId)?.toUpperCase();
      if (itemType === "ENGINE") return "Engine Sale";
      if (itemType === "BODY") return "Body Sale";
      if (itemType === "GEARBOX") return "Gearbox Sale";
      if (itemType === "COPPER") return "Copper Sale";
      if (itemType === "PARTS") return "Parts Sale";
      return "Other Item Sale";
    }
    case "OTHER_INCOME":
      return "Other Income";
    case "CAPITAL_INJECTION":
      if (tx.referenceType === "OPENING_BALANCE") {
        return "Opening Cash";
      }
      return "Capital Injection";
    case "ADJUSTMENT":
      return tx.direction === "OUT" ? "Capital Withdrawal" : "Other Income";
    default:
      return tx.category.replace(/_/g, " ");
  }
}

export function calculateRunningBalances(
  allTransactions: RawTransactionInput[],
  openingCash: number,
  itemTypeMap: Map<string, string> = new Map(),
): LedgerRowItem[] {
  // 1. Sort all active transactions strictly chronologically (ascending date)
  const sorted = [...allTransactions]
    .filter((tx) => tx.status === "ACTIVE")
    .sort((a, b) => {
      const dateA =
        typeof a.transactionDate === "string"
          ? a.transactionDate.slice(0, 10)
          : a.transactionDate.toISOString().slice(0, 10);
      const dateB =
        typeof b.transactionDate === "string"
          ? b.transactionDate.slice(0, 10)
          : b.transactionDate.toISOString().slice(0, 10);

      const dateComp = dateA.localeCompare(dateB);
      if (dateComp !== 0) return dateComp;

      // Opening balance always first on same date
      const isOpeningA = a.referenceType === "OPENING_BALANCE";
      const isOpeningB = b.referenceType === "OPENING_BALANCE";
      if (isOpeningA && !isOpeningB) return -1;
      if (!isOpeningA && isOpeningB) return 1;

      // Then secondary sort by createdAt
      const createdA = new Date(a.createdAt).getTime();
      const createdB = new Date(b.createdAt).getTime();
      return createdA - createdB;
    });

  let currentBalance = openingCash;
  const processedRows: LedgerRowItem[] = [];

  for (const tx of sorted) {
    const isOpening = tx.referenceType === "OPENING_BALANCE";
    const amountNum = Math.abs(Number(tx.amount.toString()));
    const validAmount = Number.isFinite(amountNum) ? amountNum : 0;

    let moneyIn: number | null = null;
    let moneyOut: number | null = null;

    if (isOpening) {
      // If opening balance transaction exists in ledger, it sets or reflects opening cash
      moneyIn = validAmount;
      currentBalance = validAmount;
    } else if (tx.direction === "IN") {
      moneyIn = validAmount;
      currentBalance += validAmount;
    } else {
      moneyOut = validAmount;
      currentBalance -= validAmount;
    }

    const txDate =
      typeof tx.transactionDate === "string"
        ? tx.transactionDate.slice(0, 10)
        : tx.transactionDate.toISOString().slice(0, 10);

    const category = resolveLedgerCategory(tx, itemTypeMap);

    processedRows.push({
      id: tx.id,
      transactionDate: txDate,
      direction: tx.direction,
      category,
      customCategory: tx.customCategory || null,
      referenceType: tx.referenceType,
      referenceId: tx.referenceId,
      carId: tx.carId || null,
      carNumber: tx.carNumber ?? null,
      carName: tx.carName || null,
      description: tx.description,
      paymentMethod: tx.paymentMethod as LedgerRowItem["paymentMethod"],
      moneyIn,
      moneyOut,
      runningBalance: Math.round(currentBalance * 100) / 100,
      isOpeningBalance: isOpening,
    });
  }

  return processedRows;
}

export function calculateFinanceSummary(
  allProcessedRows: LedgerRowItem[],
  filteredRows: LedgerRowItem[],
  openingCash: number,
): FinanceSummaryKpis {
  // Sum Money In and Money Out within current filtered view (excluding synthetic opening row if present)
  let filteredMoneyIn = 0;
  let filteredMoneyOut = 0;

  for (const row of filteredRows) {
    if (row.isOpeningBalance) continue;
    if (row.moneyIn !== null) {
      filteredMoneyIn += row.moneyIn;
    }
    if (row.moneyOut !== null) {
      filteredMoneyOut += row.moneyOut;
    }
  }

  // Core formula: Available Cash = actual Cash/Bank balance = Opening Cash + Money In - Money Out
  // Calculated across all lifetime transactions up to the latest point
  let lifetimeMoneyIn = 0;
  let lifetimeMoneyOut = 0;

  for (const row of allProcessedRows) {
    if (row.isOpeningBalance) continue;
    if (row.moneyIn !== null) {
      lifetimeMoneyIn += row.moneyIn;
    }
    if (row.moneyOut !== null) {
      lifetimeMoneyOut += row.moneyOut;
    }
  }

  const availableCash = openingCash + lifetimeMoneyIn - lifetimeMoneyOut;

  return {
    openingCash: Math.round(openingCash * 100) / 100,
    moneyIn: Math.round(filteredMoneyIn * 100) / 100,
    moneyOut: Math.round(filteredMoneyOut * 100) / 100,
    availableCash: Math.round(availableCash * 100) / 100,
  };
}
