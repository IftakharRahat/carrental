"use server";

import { revalidatePath } from "next/cache";

import { requireActor } from "@/lib/auth/actor";
import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";
import {
  configureOpeningCashSchema,
  createCustomCategorySchema,
  createManualTransactionSchema,
  updateCashTransactionSchema,
  voidCashTransactionSchema,
} from "../domain/finance-types";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

/**
 * Records a manual financial transaction (Section 12.5 Controls & Integrity).
 * Permitted for adjustments, capital movements, other income, and custom operational categories.
 */
export async function recordManualTransactionAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const raw = {
    direction: formData.get("direction") as string,
    category: formData.get("category") as string,
    customCategory: (formData.get("customCategory") as string) || undefined,
    amount: formData.get("amount") as string,
    transactionDate: formData.get("transactionDate") as string,
    paymentMethod: formData.get("paymentMethod") as string,
    carId: (formData.get("carId") as string) || undefined,
    description: formData.get("description") as string,
  };

  const parsed = createManualTransactionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please review the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor();
    const {
      direction,
      category,
      customCategory,
      amount,
      transactionDate,
      paymentMethod,
      carId,
      description,
    } = parsed.data;

    // Resolve Prisma CashCategory and customCategory string
    let prismaCategory:
      | "CAR_PURCHASE"
      | "CAR_EXPENSE"
      | "BUSINESS_EXPENSE"
      | "COMMISSION"
      | "WHOLE_CAR_SALE"
      | "ITEM_SALE"
      | "CAPITAL_INJECTION"
      | "OTHER_INCOME"
      | "ADJUSTMENT" = "ADJUSTMENT";

    let storedCustomCategory: string | null = customCategory || null;

    if (direction === "IN") {
      if (category === "Capital Injection") {
        prismaCategory = "CAPITAL_INJECTION";
        storedCustomCategory = null;
      } else if (category === "Other Income") {
        prismaCategory = "OTHER_INCOME";
        storedCustomCategory = null;
      } else {
        prismaCategory = "OTHER_INCOME";
        storedCustomCategory = category;
      }
    } else {
      if (category === "Capital Withdrawal") {
        prismaCategory = "ADJUSTMENT";
        storedCustomCategory = "Capital Withdrawal";
      } else if (category === "Other") {
        prismaCategory = "ADJUSTMENT";
        storedCustomCategory = "Other";
      } else if (category === "Business Expenses") {
        prismaCategory = "BUSINESS_EXPENSE";
        storedCustomCategory = null;
      } else if (category === "Car Expenses") {
        prismaCategory = "CAR_EXPENSE";
        storedCustomCategory = null;
      } else if (category === "Commission") {
        prismaCategory = "COMMISSION";
        storedCustomCategory = null;
      } else {
        prismaCategory = "ADJUSTMENT";
        storedCustomCategory = category;
      }
    }

    const txDate = new Date(`${transactionDate}T12:00:00.000Z`);

    const result = await db.$transaction(async (tx) => {
      const created = await tx.cashTransaction.create({
        data: {
          transactionDate: txDate,
          direction,
          category: prismaCategory,
          customCategory: storedCustomCategory,
          amount,
          paymentMethod,
          referenceType: "MANUAL_ENTRY",
          referenceId: crypto.randomUUID(),
          carId: carId || null,
          description,
          status: "ACTIVE",
          createdById: actor.profileId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "CREATE",
          entityType: "CASH_TRANSACTION",
          entityId: created.id,
          after: {
            direction,
            category: storedCustomCategory || prismaCategory,
            amount,
            transactionDate,
            paymentMethod,
            carId: carId || null,
            description,
          },
        },
      });

      return created;
    });

    revalidatePath("/finance");
    return { ok: true, data: { id: result.id } };
  } catch (error) {
    console.error("Failed to record manual transaction:", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to record manual transaction.",
    };
  }
}

/**
 * Creates a custom category for Money In or Money Out.
 */
export async function createCustomCategoryAction(
  formData: FormData,
): Promise<ActionResult<{ id: string; name: string }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const raw = {
    name: formData.get("name") as string,
    direction: formData.get("direction") as string,
  };

  const parsed = createCustomCategorySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please review the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor();
    const { name, direction } = parsed.data;

    // Check if category already exists
    const existing = await db.customCashCategory.findUnique({
      where: { name },
    });

    if (existing) {
      return {
        ok: false,
        message: `Category "${name}" already exists.`,
      };
    }

    const created = await db.customCashCategory.create({
      data: {
        name,
        direction,
      },
    });

    await db.auditLog.create({
      data: {
        actorId: actor.profileId,
        action: "CREATE",
        entityType: "CUSTOM_CASH_CATEGORY",
        entityId: created.id,
        after: {
          name,
          direction,
        },
      },
    });

    revalidatePath("/finance");
    return { ok: true, data: { id: created.id, name: created.name } };
  } catch (error) {
    console.error("Failed to create custom category:", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create custom category.",
    };
  }
}

/**
 * Configures the starting cash balance (Section 12.3 Opening Cash).
 * Available Cash = Opening Cash + Money In - Money Out.
 */
export async function configureOpeningCashAction(
  formData: FormData,
): Promise<ActionResult<{ amount: string }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const raw = {
    amount: formData.get("amount") as string,
  };

  const parsed = configureOpeningCashSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please provide a valid non-negative amount.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor();
    const { amount } = parsed.data;

    await db.$transaction(async (tx) => {
      const existing = await tx.cashTransaction.findUnique({
        where: {
          referenceType_referenceId: {
            referenceType: "OPENING_BALANCE",
            referenceId: "OPENING_CASH_BALANCE",
          },
        },
      });

      if (existing) {
        await tx.cashTransaction.update({
          where: { id: existing.id },
          data: {
            amount,
            status: "ACTIVE",
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: actor.profileId,
            action: "UPDATE",
            entityType: "CASH_TRANSACTION",
            entityId: existing.id,
            before: { amount: existing.amount.toString() },
            after: { amount },
          },
        });
      } else {
        const created = await tx.cashTransaction.create({
          data: {
            transactionDate: new Date("2000-01-01T00:00:00.000Z"),
            direction: "IN",
            category: "CAPITAL_INJECTION",
            customCategory: "Opening Balance",
            amount,
            paymentMethod: "CASH",
            referenceType: "OPENING_BALANCE",
            referenceId: "OPENING_CASH_BALANCE",
            description: "Opening cash balance configuration",
            status: "ACTIVE",
            createdById: actor.profileId,
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: actor.profileId,
            action: "CREATE",
            entityType: "CASH_TRANSACTION",
            entityId: created.id,
            after: { amount },
          },
        });
      }
    });

    revalidatePath("/finance");
    return { ok: true, data: { amount } };
  } catch (error) {
    console.error("Failed to configure opening cash:", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to configure opening cash.",
    };
  }
}

/**
 * Updates a CashTransaction from the Cash Ledger and synchronizes any linked source records.
 */
export async function updateCashTransactionAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const raw = {
    id: formData.get("id") as string,
    transactionDate: formData.get("transactionDate") as string,
    amount: formData.get("amount") as string,
    paymentMethod: formData.get("paymentMethod") as string,
    description: formData.get("description") as string,
    category: (formData.get("category") as string) || undefined,
    carId: (formData.get("carId") as string) || undefined,
  };

  const parsed = updateCashTransactionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please review the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor();
    const { id, transactionDate, amount, paymentMethod, description, category, carId } = parsed.data;

    await db.$transaction(async (tx) => {
      const existing = await tx.cashTransaction.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("Transaction not found.");
      }

      if (existing.status === "VOIDED") {
        throw new Error("Voided transactions cannot be edited.");
      }

      const txDate = new Date(`${transactionDate}T12:00:00.000Z`);

      // 1. Update CashTransaction
      await tx.cashTransaction.update({
        where: { id },
        data: {
          transactionDate: txDate,
          amount,
          paymentMethod,
          description,
          carId: carId || null,
          customCategory: category && category !== existing.category ? category : existing.customCategory,
        },
      });

      // 2. Synchronize underlying source entity if applicable
      if (existing.referenceType === "BUSINESS_EXPENSE") {
        await tx.businessExpense.updateMany({
          where: { id: existing.referenceId },
          data: {
            expenseDate: txDate,
            amount,
            paymentMethod,
            description,
          },
        });
      } else if (existing.referenceType === "CAR_EXPENSE") {
        await tx.carExpense.updateMany({
          where: { id: existing.referenceId },
          data: {
            expenseDate: txDate,
            amount,
            paymentMethod,
            description,
          },
        });
      } else if (existing.referenceType === "RECOVERY_TRANSACTION") {
        await tx.recoveryTransaction.updateMany({
          where: { id: existing.referenceId },
          data: {
            saleDate: txDate,
            amount,
            paymentMethod,
          },
        });
      } else if (existing.referenceType === "CAR_PURCHASE") {
        await tx.car.updateMany({
          where: { id: existing.referenceId },
          data: {
            purchaseDate: txDate,
            purchasePrice: amount,
            paymentMethod,
          },
        });
      }

      // 3. Create AuditLog
      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "UPDATE",
          entityType: "CASH_TRANSACTION",
          entityId: existing.id,
          before: {
            amount: existing.amount.toString(),
            description: existing.description,
            paymentMethod: existing.paymentMethod,
            transactionDate: existing.transactionDate.toISOString().slice(0, 10),
          },
          after: {
            amount,
            description,
            paymentMethod,
            transactionDate,
          },
        },
      });
    });

    revalidatePath("/finance");
    revalidatePath("/expenses/business");
    revalidatePath("/expenses/details");
    revalidatePath("/stock");
    revalidatePath("/cars");
    revalidatePath("/reports");
    revalidatePath("/analytics");
    revalidatePath("/");

    return { ok: true, data: { id: parsed.data.id } };
  } catch (error) {
    console.error("Failed to update cash transaction:", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update cash transaction.",
    };
  }
}

/**
 * Voids a CashTransaction from the Cash Ledger and synchronizes underlying entities.
 */
export async function voidCashTransactionAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const raw = {
    id: formData.get("id") as string,
    voidReason: formData.get("voidReason") as string,
  };

  const parsed = voidCashTransactionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please provide a valid void reason.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor();
    const { id, voidReason } = parsed.data;

    await db.$transaction(async (tx) => {
      const existing = await tx.cashTransaction.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("Transaction not found.");
      }

      if (existing.status === "VOIDED") {
        throw new Error("This transaction is already voided.");
      }

      if (existing.referenceType === "OPENING_BALANCE") {
        throw new Error("Opening cash balance cannot be voided. Adjust it via Configure Opening Cash instead.");
      }

      const now = new Date();

      // 1. Mark CashTransaction as VOIDED
      await tx.cashTransaction.update({
        where: { id },
        data: {
          status: "VOIDED",
          voidReason,
        },
      });

      // 2. Synchronize underlying source entity
      if (existing.referenceType === "BUSINESS_EXPENSE") {
        await tx.businessExpense.updateMany({
          where: { id: existing.referenceId },
          data: {
            status: "VOIDED",
            voidReason,
            voidedAt: now,
            voidedById: actor.profileId,
          },
        });
      } else if (existing.referenceType === "CAR_EXPENSE") {
        await tx.carExpense.updateMany({
          where: { id: existing.referenceId },
          data: {
            status: "VOIDED",
            voidReason,
            voidedAt: now,
            voidedById: actor.profileId,
          },
        });
      } else if (existing.referenceType === "RECOVERY_TRANSACTION") {
        await tx.recoveryTransaction.updateMany({
          where: { id: existing.referenceId },
          data: {
            status: "VOIDED",
            voidReason,
            voidedAt: now,
            voidedById: actor.profileId,
          },
        });

        const recovery = await tx.recoveryTransaction.findUnique({
          where: { id: existing.referenceId },
          include: { car: true },
        });

        if (recovery && recovery.mode === "ITEM" && recovery.itemType) {
          const remainingActive = await tx.recoveryTransaction.findMany({
            where: { carId: recovery.carId, status: "ACTIVE" },
            select: { mode: true, itemType: true, itemLabel: true },
          });

          const sameItemStillSold = remainingActive.filter(
            (r) =>
              r.mode === "ITEM" &&
              r.itemType === recovery.itemType &&
              (r.itemLabel ?? null) === (recovery.itemLabel ?? null),
          ).length;

          const soldItems = await tx.recoveryItem.findMany({
            where: {
              carId: recovery.carId,
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

        if (recovery?.car && recovery.car.status !== "VOIDED") {
          const remainingActive = await tx.recoveryTransaction.findMany({
            where: { carId: recovery.carId, status: "ACTIVE" },
          });
          let nextStatus = recovery.car.status;
          if (recovery.mode === "WHOLE_CAR" && recovery.car.status === "COMPLETED") {
            nextStatus = remainingActive.length > 0 ? "PARTIALLY_RECOVERED" : "IN_STOCK";
          } else if (recovery.car.status === "PARTIALLY_RECOVERED" && remainingActive.length === 0) {
            nextStatus = "IN_STOCK";
          }
          if (nextStatus !== recovery.car.status) {
            await tx.car.update({
              where: { id: recovery.car.id },
              data: {
                status: nextStatus,
                completionDate: nextStatus === "COMPLETED" ? recovery.car.completionDate : null,
                updatedById: actor.profileId,
                version: { increment: 1 },
              },
            });
          }
        }
      } else if (existing.referenceType === "CAR_PURCHASE") {
        await tx.car.updateMany({
          where: { id: existing.referenceId },
          data: {
            status: "VOIDED",
            updatedById: actor.profileId,
            version: { increment: 1 },
          },
        });
      }

      // 3. Create AuditLog
      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "VOID",
          entityType: "CASH_TRANSACTION",
          entityId: existing.id,
          before: {
            status: existing.status,
            amount: existing.amount.toString(),
            category: existing.category,
            description: existing.description,
          },
          after: {
            status: "VOIDED",
            voidReason,
          },
        },
      });
    });

    revalidatePath("/finance");
    revalidatePath("/expenses/business");
    revalidatePath("/expenses/details");
    revalidatePath("/stock");
    revalidatePath("/cars");
    revalidatePath("/reports");
    revalidatePath("/analytics");
    revalidatePath("/");

    return { ok: true, data: { id: parsed.data.id } };
  } catch (error) {
    console.error("Failed to void cash transaction:", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to void cash transaction.",
    };
  }
}
