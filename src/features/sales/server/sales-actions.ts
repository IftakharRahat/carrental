"use server";

import { revalidatePath } from "next/cache";

import { requireActor } from "@/lib/auth/actor";
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
