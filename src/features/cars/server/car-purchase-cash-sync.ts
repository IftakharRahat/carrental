import "server-only";

import type { Prisma } from "@/generated/prisma/client";

type CarStatus = "IN_STOCK" | "PARTIALLY_RECOVERED" | "COMPLETED" | "VOIDED";

/**
 * Keeps the car's CAR_PURCHASE cash transaction in sync with the car status.
 *
 * - Car becomes VOIDED (purchase cancelled)  -> purchase cash-out is voided,
 *   so the purchase amount returns to Available Cash.
 * - Car leaves VOIDED (cancellation undone)  -> purchase cash-out is re-activated.
 */
export async function syncCarPurchaseCashTransaction(
  tx: Prisma.TransactionClient,
  {
    carId,
    fromStatus,
    toStatus,
    reason,
  }: {
    carId: string;
    fromStatus: string;
    toStatus: CarStatus | string;
    reason?: string;
  },
) {
  const isBecomingVoided = toStatus === "VOIDED" && fromStatus !== "VOIDED";
  const isLeavingVoided = fromStatus === "VOIDED" && toStatus !== "VOIDED";

  if (isBecomingVoided) {
    await tx.cashTransaction.updateMany({
      where: {
        referenceType: "CAR_PURCHASE",
        referenceId: carId,
        status: "ACTIVE",
      },
      data: {
        status: "VOIDED",
        voidReason: reason?.trim() || "Car purchase cancelled (car voided)",
      },
    });
  } else if (isLeavingVoided) {
    await tx.cashTransaction.updateMany({
      where: {
        referenceType: "CAR_PURCHASE",
        referenceId: carId,
        status: "VOIDED",
      },
      data: {
        status: "ACTIVE",
        voidReason: null,
      },
    });
  }
}
