"use server";

import { revalidatePath } from "next/cache";

import { formatCarNumber } from "@/features/cars/domain/car-number";
import {
  AuthenticationError,
  AuthorizationError,
  requireActor,
} from "@/lib/auth/actor";
import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";
import {
  itemSaleInputSchema,
  quickBuyerInputSchema,
  wholeCarSaleInputSchema,
} from "../domain/sales-types";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function recordWholeCarSaleAction(
  formData: FormData,
): Promise<ActionResult<{ recoveryId: string; carNumber: number }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const raw = {
    carId: formData.get("carId") as string,
    saleDate: formData.get("saleDate") as string,
    buyerId: formData.get("buyerId") as string,
    sellingPrice: formData.get("sellingPrice") as string,
    paymentMethod: formData.get("paymentMethod") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = wholeCarSaleInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor();
    const { carId, saleDate, buyerId, sellingPrice, paymentMethod, notes } =
      parsed.data;

    const result = await db.$transaction(async (tx) => {
      const car = await tx.car.findUnique({
        where: { id: carId },
        select: { id: true, carNumber: true, brand: true, model: true },
      });

      if (!car) {
        throw new Error("Vehicle not found.");
      }

      const buyer = await tx.buyer.findUnique({
        where: { id: buyerId },
        select: { id: true, name: true },
      });

      if (!buyer) {
        throw new Error("Buyer not found.");
      }

      const saleDateObj = new Date(`${saleDate}T00:00:00.000Z`);
      const decimalAmount = sellingPrice;
      const idempotencyKey = crypto.randomUUID();

      // 1. Create RecoveryTransaction
      const recovery = await tx.recoveryTransaction.create({
        data: {
          idempotencyKey,
          carId: car.id,
          buyerId: buyer.id,
          mode: "WHOLE_CAR",
          saleDate: saleDateObj,
          amount: decimalAmount,
          paymentMethod,
          notes: notes || null,
          status: "ACTIVE",
          createdById: actor.profileId,
        },
      });

      // 2. Create Money In CashTransaction
      await tx.cashTransaction.create({
        data: {
          transactionDate: saleDateObj,
          direction: "IN",
          category: "WHOLE_CAR_SALE",
          amount: decimalAmount,
          paymentMethod,
          referenceType: "RECOVERY_TRANSACTION",
          referenceId: recovery.id,
          carId: car.id,
          description: `Whole car sale to ${buyer.name} for ${car.brand} ${car.model}`,
          status: "ACTIVE",
          createdById: actor.profileId,
        },
      });

      // 3. Update Car status to COMPLETED and set completionDate
      await tx.car.update({
        where: { id: car.id },
        data: {
          status: "COMPLETED",
          completionDate: saleDateObj,
          updatedById: actor.profileId,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "CREATE",
          entityType: "RECOVERY_TRANSACTION",
          entityId: recovery.id,
          after: {
            carId: car.id,
            buyerId: buyer.id,
            mode: "WHOLE_CAR",
            amount: decimalAmount,
            carStatus: "COMPLETED",
          },
        },
      });

      return { recoveryId: recovery.id, carNumber: car.carNumber };
    });

    revalidatePath(`/cars/${result.carNumber}`);
    revalidatePath("/sell");
    revalidatePath("/stock");
    revalidatePath("/cars");
    revalidatePath("/");

    return { ok: true, data: result };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to record whole car sale.",
    };
  }
}

export async function recordItemSaleAction(
  formData: FormData,
): Promise<ActionResult<{ recoveryId: string; carNumber: number }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const raw = {
    carId: formData.get("carId") as string,
    itemId: (formData.get("itemId") as string) || undefined,
    itemType: formData.get("itemType") as string,
    itemLabel: (formData.get("itemLabel") as string) || undefined,
    buyerId: formData.get("buyerId") as string,
    saleDate: formData.get("saleDate") as string,
    amount: formData.get("amount") as string,
    paymentMethod: formData.get("paymentMethod") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = itemSaleInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor();
    const {
      carId,
      itemId,
      itemType,
      itemLabel,
      buyerId,
      saleDate,
      amount,
      paymentMethod,
      notes,
    } = parsed.data;

    const result = await db.$transaction(async (tx) => {
      const car = await tx.car.findUnique({
        where: { id: carId },
        select: { id: true, carNumber: true, brand: true, model: true, status: true },
      });

      if (!car) {
        throw new Error("Vehicle not found.");
      }

      const buyer = await tx.buyer.findUnique({
        where: { id: buyerId },
        select: { id: true, name: true },
      });

      if (!buyer) {
        throw new Error("Buyer not found.");
      }

      const saleDateObj = new Date(`${saleDate}T00:00:00.000Z`);
      const decimalAmount = amount;
      const idempotencyKey = crypto.randomUUID();

      // 1. Update or create matching RecoveryItem
      if (itemId) {
        await tx.recoveryItem.update({
          where: { id: itemId },
          data: { status: "SOLD" },
        });
      } else {
        await tx.recoveryItem.create({
          data: {
            carId: car.id,
            type: itemType,
            label: itemLabel || null,
            status: "SOLD",
          },
        });
      }

      // 2. Create RecoveryTransaction
      const recovery = await tx.recoveryTransaction.create({
        data: {
          idempotencyKey,
          carId: car.id,
          buyerId: buyer.id,
          mode: "ITEM",
          itemType,
          itemLabel: itemLabel || null,
          saleDate: saleDateObj,
          amount: decimalAmount,
          paymentMethod,
          notes: notes || null,
          status: "ACTIVE",
          createdById: actor.profileId,
        },
      });

      // 3. Create Money In CashTransaction
      await tx.cashTransaction.create({
        data: {
          transactionDate: saleDateObj,
          direction: "IN",
          category: "ITEM_SALE",
          amount: decimalAmount,
          paymentMethod,
          referenceType: "RECOVERY_TRANSACTION",
          referenceId: recovery.id,
          carId: car.id,
          description: `Item sale (${itemType}) to ${buyer.name} from ${car.brand} ${car.model}`,
          status: "ACTIVE",
          createdById: actor.profileId,
        },
      });

      // 4. Update Car status: if IN_STOCK, transition to PARTIALLY_RECOVERED
      if (car.status === "IN_STOCK") {
        await tx.car.update({
          where: { id: car.id },
          data: {
            status: "PARTIALLY_RECOVERED",
            updatedById: actor.profileId,
          },
        });
      }

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "CREATE",
          entityType: "RECOVERY_TRANSACTION",
          entityId: recovery.id,
          after: {
            carId: car.id,
            buyerId: buyer.id,
            mode: "ITEM",
            itemType,
            amount: decimalAmount,
          },
        },
      });

      return { recoveryId: recovery.id, carNumber: car.carNumber };
    });

    revalidatePath(`/cars/${result.carNumber}`);
    revalidatePath("/sell");
    revalidatePath("/stock");
    revalidatePath("/cars");
    revalidatePath("/");

    return { ok: true, data: result };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to record item sale.",
    };
  }
}

export async function markCarCompletedAction(
  carId: string,
): Promise<ActionResult<{ carNumber: number }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  try {
    const actor = await requireActor();
    const result = await db.$transaction(async (tx) => {
      const car = await tx.car.findUnique({
        where: { id: carId },
        select: { id: true, carNumber: true, status: true },
      });

      if (!car) {
        throw new Error("Vehicle not found.");
      }

      const now = new Date();
      await tx.car.update({
        where: { id: car.id },
        data: {
          status: "COMPLETED",
          completionDate: now,
          updatedById: actor.profileId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "COMPLETE",
          entityType: "CAR",
          entityId: car.id,
          after: { status: "COMPLETED", completionDate: now.toISOString() },
        },
      });

      return { carNumber: car.carNumber };
    });

    revalidatePath(`/cars/${result.carNumber}`);
    revalidatePath("/sell");
    revalidatePath("/stock");
    revalidatePath("/cars");
    revalidatePath("/");

    return { ok: true, data: result };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark car as completed.",
    };
  }
}

/**
 * Cancels (voids) a recorded whole-car or item sale.
 *
 * - Marks the RecoveryTransaction as VOIDED (kept for audit, excluded from totals).
 * - Voids the linked Money In CashTransaction so Available Cash drops back.
 * - Returns a sold part back to PENDING so it can be sold again.
 * - Rolls the car status back (COMPLETED/PARTIALLY_RECOVERED -> IN_STOCK etc.)
 *   when the cancelled sale was what moved it forward.
 */
export async function voidRecoveryTransactionAction(input: {
  recoveryId: string;
  voidReason: string;
}): Promise<ActionResult<{ recoveryId: string; carNumber: number }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const recoveryId = String(input.recoveryId ?? "").trim();
  const voidReason = String(input.voidReason ?? "").trim();

  if (!/^[0-9a-f-]{36}$/i.test(recoveryId)) {
    return { ok: false, message: "Invalid sale reference." };
  }
  if (voidReason.length < 3 || voidReason.length > 500) {
    return {
      ok: false,
      message: "Please enter a reason (3-500 characters).",
      fieldErrors: { voidReason: ["Please enter a reason (3-500 characters)."] },
    };
  }

  try {
    const actor = await requireActor("finance:void");

    const result = await db.$transaction(async (tx) => {
      const recovery = await tx.recoveryTransaction.findUnique({
        where: { id: recoveryId },
        include: {
          car: {
            select: {
              id: true,
              carNumber: true,
              status: true,
              completionDate: true,
            },
          },
        },
      });

      if (!recovery) {
        throw new Error("Sale record not found.");
      }
      if (recovery.status === "VOIDED") {
        throw new Error("This sale is already cancelled.");
      }

      const now = new Date();
      const { car } = recovery;

      // 1. Void the recovery / sale record
      await tx.recoveryTransaction.update({
        where: { id: recovery.id },
        data: {
          status: "VOIDED",
          voidReason,
          voidedAt: now,
          voidedById: actor.profileId,
        },
      });

      // 2. Void the matching Money In entry so Available Cash is corrected
      await tx.cashTransaction.updateMany({
        where: {
          referenceType: "RECOVERY_TRANSACTION",
          referenceId: recovery.id,
          status: "ACTIVE",
        },
        data: {
          status: "VOIDED",
          voidReason: `Sale cancelled: ${voidReason}`,
        },
      });

      const remainingActive = await tx.recoveryTransaction.findMany({
        where: { carId: car.id, status: "ACTIVE" },
        select: { mode: true, itemType: true, itemLabel: true },
      });

      // 3. Put the sold part back to PENDING (only if no other active sale covers it)
      if (recovery.mode === "ITEM" && recovery.itemType) {
        const sameItemStillSold = remainingActive.filter(
          (r) =>
            r.mode === "ITEM" &&
            r.itemType === recovery.itemType &&
            (r.itemLabel ?? null) === (recovery.itemLabel ?? null),
        ).length;

        const soldItems = await tx.recoveryItem.findMany({
          where: {
            carId: car.id,
            type: recovery.itemType,
            label: recovery.itemLabel ?? null,
            status: "SOLD",
          },
          orderBy: { updatedAt: "desc" },
          select: { id: true },
        });

        if (soldItems.length > sameItemStillSold) {
          await tx.recoveryItem.update({
            where: { id: soldItems[0].id },
            data: { status: "PENDING" },
          });
        }
      }

      // 4. Roll back car status where the cancelled sale drove it
      let nextStatus = car.status;
      if (car.status !== "VOIDED") {
        if (recovery.mode === "WHOLE_CAR" && car.status === "COMPLETED") {
          nextStatus = remainingActive.length > 0 ? "PARTIALLY_RECOVERED" : "IN_STOCK";
        } else if (
          car.status === "PARTIALLY_RECOVERED" &&
          remainingActive.length === 0
        ) {
          nextStatus = "IN_STOCK";
        }
      }

      if (nextStatus !== car.status) {
        await tx.car.update({
          where: { id: car.id },
          data: {
            status: nextStatus,
            completionDate: nextStatus === "COMPLETED" ? car.completionDate : null,
            updatedById: actor.profileId,
            version: { increment: 1 },
          },
        });
      }

      // 5. Audit log
      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "VOID",
          entityType: "RECOVERY_TRANSACTION",
          entityId: recovery.id,
          before: {
            status: "ACTIVE",
            amount: recovery.amount.toString(),
            mode: recovery.mode,
            carStatus: car.status,
          },
          after: {
            status: "VOIDED",
            voidReason,
            voidedAt: now.toISOString(),
            carStatus: nextStatus,
          },
        },
      });

      return { recoveryId: recovery.id, carNumber: car.carNumber };
    });

    revalidatePath(`/cars/${formatCarNumber(result.carNumber)}`);
    revalidatePath("/sell");
    revalidatePath("/stock");
    revalidatePath("/cars");
    revalidatePath("/finance");
    revalidatePath("/reports");
    revalidatePath("/analytics");
    revalidatePath("/");

    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, message: "Only Admin users can cancel a sale." };
    }
    if (error instanceof AuthenticationError) {
      return { ok: false, message: error.message };
    }
    console.error("Failed to void recovery transaction", error);
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to cancel the sale.",
    };
  }
}

export async function createQuickBuyerAction(
  formData: FormData,
): Promise<
  ActionResult<{
    id: string;
    name: string;
    phone: string | null;
    companyName: string | null;
    types: string[];
  }>
> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const raw = {
    name: formData.get("name") as string,
    phone: (formData.get("phone") as string) || undefined,
    whatsapp: (formData.get("whatsapp") as string) || undefined,
    companyName: (formData.get("companyName") as string) || undefined,
    location: (formData.get("location") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = quickBuyerInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please enter a valid buyer name.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { name, phone, whatsapp, companyName, location, notes } = parsed.data;

    const buyer = await db.buyer.create({
      data: {
        name,
        phone: phone || null,
        whatsapp: whatsapp || null,
        companyName: companyName || null,
        location: location || null,
        notes: notes || null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        companyName: true,
      },
    });

    return {
      ok: true,
      data: {
        ...buyer,
        types: [],
      },
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to create buyer.",
    };
  }
}
