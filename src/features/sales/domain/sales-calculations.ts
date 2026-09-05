import type { RecoveryMode, RecoveryItemStatus } from "./sales-types";

export type CarLifecycleStatus =
  | "IN_STOCK"
  | "PARTIALLY_RECOVERED"
  | "COMPLETED"
  | "VOIDED";

/**
 * Section 8.1 & 8.4: Determines the new lifecycle status of a car after a sale.
 * - Whole Car Sale: Normally transitions directly to COMPLETED.
 * - Dismantle / Item Sale:
 *   - First item sale changes vehicle from IN_STOCK to PARTIALLY_RECOVERED.
 *   - Stays PARTIALLY_RECOVERED until all required items/recovery work are resolved
 *     and user confirms completion.
 */
export function determinePostSaleCarStatus({
  currentStatus,
  mode,
  markCompleted = false,
}: {
  currentStatus: CarLifecycleStatus;
  mode: RecoveryMode;
  markCompleted?: boolean;
}): CarLifecycleStatus {
  if (markCompleted || mode === "WHOLE_CAR") {
    return "COMPLETED";
  }

  if (currentStatus === "IN_STOCK") {
    return "PARTIALLY_RECOVERED";
  }

  return currentStatus;
}

/**
 * Section 8.4: Checks whether a vehicle is eligible for clean completion without warnings.
 * V1 rule: User explicitly clicks "Mark Completed" only after there are no required pending items.
 */
export function checkCompletionEligibility(
  items: ReadonlyArray<{ status: RecoveryItemStatus }>,
): {
  canCompleteCleanly: boolean;
  pendingCount: number;
} {
  const pendingCount = items.filter((item) => item.status === "PENDING").length;
  return {
    canCompleteCleanly: pendingCount === 0,
    pendingCount,
  };
}

/**
 * Section 8.5: Calculates projected recovery and profit based on current totals and incoming sale amount.
 */
export function calculateProjectedRecovery({
  currentRecovery,
  newAmount,
  totalInvestment,
  willBeCompleted,
}: {
  currentRecovery: number;
  newAmount: number;
  totalInvestment: number;
  willBeCompleted: boolean;
}): {
  projectedRecovery: number;
  projectedProfit: number | null;
  isProfitPending: boolean;
} {
  const projectedRecovery = currentRecovery + Math.max(0, newAmount);
  const projectedProfit = willBeCompleted
    ? projectedRecovery - totalInvestment
    : null;

  return {
    projectedRecovery,
    projectedProfit,
    isProfitPending: !willBeCompleted,
  };
}
