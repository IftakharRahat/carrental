"use server";

import { revalidatePath } from "next/cache";

import { requireActor } from "@/lib/auth/actor";
import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";
import {
  configureOpeningCashSchema,
  createCustomCategorySchema,
  createManualTransactionSchema,
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
