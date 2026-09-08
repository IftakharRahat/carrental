"use server";

import { revalidatePath } from "next/cache";

import { requireActor } from "@/lib/auth/actor";
import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";
import {
  createBusinessExpenseSchema,
  mapToPrismaBusinessCategory,
  updateBusinessExpenseSchema,
  voidBusinessExpenseSchema,
} from "../domain/expense-types";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

/**
 * Creates a new Business Expense and linked Money Out CashTransaction (Section 13).
 */
export async function createBusinessExpenseAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const raw = {
    expenseDate: formData.get("expenseDate") as string,
    category: formData.get("category") as string,
    amount: formData.get("amount") as string,
    paymentMethod: formData.get("paymentMethod") as string,
    description: formData.get("description") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = createBusinessExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please review the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor();
    const { expenseDate, category, amount, paymentMethod, description, notes } =
      parsed.data;

    const prismaCategory = mapToPrismaBusinessCategory(category);
    const txDate = new Date(`${expenseDate}T12:00:00.000Z`);

    const result = await db.$transaction(async (tx) => {
      // 1. Create BusinessExpense
      const expense = await tx.businessExpense.create({
        data: {
          idempotencyKey: crypto.randomUUID(),
          expenseDate: txDate,
          category: prismaCategory,
          subcategory: category,
          amount,
          paymentMethod,
          description,
          notes: notes || null,
          status: "ACTIVE",
          createdById: actor.profileId,
        },
      });

      // 2. Create linked CashTransaction (Money Out) in Finance
      await tx.cashTransaction.create({
        data: {
          transactionDate: txDate,
          direction: "OUT",
          category: "BUSINESS_EXPENSE",
          customCategory: category,
          amount,
          paymentMethod,
          referenceType: "BUSINESS_EXPENSE",
          referenceId: expense.id,
          description,
          status: "ACTIVE",
          createdById: actor.profileId,
        },
      });

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "CREATE",
          entityType: "BUSINESS_EXPENSE",
          entityId: expense.id,
          after: {
            expenseDate,
            category,
            amount,
            paymentMethod,
            description,
          },
        },
      });

      return expense;
    });

    revalidatePath("/expenses/business");
    revalidatePath("/expenses/details");
    revalidatePath("/finance");

    return { ok: true, data: { id: result.id } };
  } catch (error) {
    console.error("Failed to create business expense:", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to record business expense.",
    };
  }
}

/**
 * Updates an existing Business Expense and keeps linked CashTransaction synchronized (Section 13.3).
 */
export async function updateBusinessExpenseAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const raw = {
    id: formData.get("id") as string,
    expenseDate: formData.get("expenseDate") as string,
    category: formData.get("category") as string,
    amount: formData.get("amount") as string,
    paymentMethod: formData.get("paymentMethod") as string,
    description: formData.get("description") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = updateBusinessExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please review the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor();
    const { id, expenseDate, category, amount, paymentMethod, description, notes } =
      parsed.data;

    const prismaCategory = mapToPrismaBusinessCategory(category);
    const txDate = new Date(`${expenseDate}T12:00:00.000Z`);

    await db.$transaction(async (tx) => {
      const existing = await tx.businessExpense.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("Business expense record not found.");
      }

      if (existing.status === "VOIDED") {
        throw new Error("Voided expenses cannot be edited.");
      }

      // 1. Update BusinessExpense
      await tx.businessExpense.update({
        where: { id },
        data: {
          expenseDate: txDate,
          category: prismaCategory,
          subcategory: category,
          amount,
          paymentMethod,
          description,
          notes: notes || null,
        },
      });

      // 2. Synchronize linked CashTransaction in Finance
      await tx.cashTransaction.updateMany({
        where: {
          referenceType: "BUSINESS_EXPENSE",
          referenceId: id,
        },
        data: {
          transactionDate: txDate,
          customCategory: category,
          amount,
          paymentMethod,
          description,
        },
      });

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "UPDATE",
          entityType: "BUSINESS_EXPENSE",
          entityId: id,
          before: {
            amount: existing.amount.toString(),
            category: existing.subcategory || existing.category,
            description: existing.description,
          },
          after: {
            amount,
            category,
            description,
          },
        },
      });
    });

    revalidatePath("/expenses/business");
    revalidatePath("/expenses/details");
    revalidatePath("/finance");

    return { ok: true, data: { id } };
  } catch (error) {
    console.error("Failed to update business expense:", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update business expense.",
    };
  }
}

/**
 * Voids a Business Expense and automatically cancels the linked CashTransaction (Section 13.3).
 */
export async function voidBusinessExpenseAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const raw = {
    id: formData.get("id") as string,
    voidReason: formData.get("voidReason") as string,
  };

  const parsed = voidBusinessExpenseSchema.safeParse(raw);
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
      const existing = await tx.businessExpense.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("Business expense record not found.");
      }

      if (existing.status === "VOIDED") {
        throw new Error("This expense is already voided.");
      }

      const now = new Date();

      // 1. Mark BusinessExpense as VOIDED
      await tx.businessExpense.update({
        where: { id },
        data: {
          status: "VOIDED",
          voidReason,
          voidedAt: now,
          voidedById: actor.profileId,
        },
      });

      // 2. Void linked CashTransaction so Finance totals update immediately
      await tx.cashTransaction.updateMany({
        where: {
          referenceType: "BUSINESS_EXPENSE",
          referenceId: id,
        },
        data: {
          status: "VOIDED",
          voidReason,
        },
      });

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "VOID",
          entityType: "BUSINESS_EXPENSE",
          entityId: id,
          after: {
            voidReason,
            voidedAt: now.toISOString(),
          },
        },
      });
    });

    revalidatePath("/expenses/business");
    revalidatePath("/expenses/details");
    revalidatePath("/finance");

    return { ok: true, data: { id } };
  } catch (error) {
    console.error("Failed to void business expense:", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to void business expense.",
    };
  }
}
