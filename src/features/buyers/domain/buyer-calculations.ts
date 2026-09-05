import type {
  BuyerKpis,
  BuyerListItem,
  BuyersPageKpis,
} from "./buyer-types";

/**
 * Calculates financial and activity KPIs for an individual buyer based on recovery transactions.
 * Enforces Section 11.2 & 11.3 metrics:
 * - Total Purchases (count of completed transactions)
 * - Total Amount (sum in AED)
 * - Last Purchase (latest transaction date)
 */
export function calculateBuyerKpis(
  transactions: Array<{
    amount: number;
    saleDate: string;
    status: "ACTIVE" | "VOIDED";
  }>,
): BuyerKpis {
  const activeTransactions = transactions.filter((t) => t.status === "ACTIVE");

  const totalPurchasesCount = activeTransactions.length;
  const totalAmountPaid = activeTransactions.reduce(
    (sum, t) => sum + (Number(t.amount) || 0),
    0,
  );

  let lastPurchaseDate: string | null = null;
  if (activeTransactions.length > 0) {
    // Sort descending by date
    const sorted = [...activeTransactions].sort(
      (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime(),
    );
    lastPurchaseDate = sorted[0].saleDate;
  }

  return {
    totalPurchasesCount,
    totalAmountPaid,
    lastPurchaseDate,
  };
}

/**
 * Section 11.3 Key Rule:
 * Buyer cannot be hard-deleted if linked to sales/recovery transactions; archive/deactivate instead.
 */
export function canDeleteBuyer(transactionCount: number): {
  canDelete: boolean;
  reason?: string;
} {
  if (transactionCount > 0) {
    return {
      canDelete: false,
      reason: `Buyer has ${transactionCount} recorded sale transaction(s) and cannot be deleted. Archive or deactivate the buyer instead to preserve financial records.`,
    };
  }

  return { canDelete: true };
}

/**
 * Calculates aggregated metrics across all buyers for the Section 11 dashboard header.
 */
export function calculateOverallBuyersKpis(
  buyers: BuyerListItem[],
): BuyersPageKpis {
  const totalBuyers = buyers.length;
  const activeBuyers = buyers.filter((b) => b.isActive).length;

  const totalRecoveredAmount = buyers.reduce(
    (sum, b) => sum + b.kpis.totalAmountPaid,
    0,
  );

  const buyersWithPurchases = buyers.filter((b) => b.kpis.totalPurchasesCount > 0);
  const averagePurchasePerBuyer =
    buyersWithPurchases.length > 0
      ? totalRecoveredAmount / buyersWithPurchases.length
      : 0;

  return {
    totalBuyers,
    activeBuyers,
    totalRecoveredAmount,
    averagePurchasePerBuyer,
  };
}
