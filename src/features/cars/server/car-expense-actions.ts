"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireActor } from "@/lib/auth/actor";
import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";

const carExpenseInputSchema = z.object({
  carId: z.string().uuid("Invalid car ID"),
  carNumber: z.string(),
  expenseDate: z.string().min(1, "Date is required"),
  category: z.enum([
    "TRANSPORT",
    "LABOUR",
    "PARTS",
    "REPAIR",
    "RTA_DOCUMENTATION",
    "OTHER",
  ]),
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid AED amount")
    .refine((val) => Number(val) > 0, "Amount must be greater than zero"),
  description: z.string().trim().min(1, "Description is required").max(500),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
  notes: z.string().trim().max(2000).optional(),
});

export type CreateCarExpenseResult =
  | { ok: true; expenseId: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function createCarExpenseAction(
  formData: FormData,
): Promise<CreateCarExpenseResult> {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      message: "Database is not configured.",
    };
  }

  const raw = {
    carId: formData.get("carId") as string,
    carNumber: formData.get("carNumber") as string,
    expenseDate: formData.get("expenseDate") as string,
    category: formData.get("category") as string,
    amount: formData.get("amount") as string,
    description: formData.get("description") as string,
    paymentMethod: formData.get("paymentMethod") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = carExpenseInputSchema.safeParse(raw);
  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    return {
      ok: false,
      message: "Please correct the form errors.",
      fieldErrors: flattened.fieldErrors,
    };
  }

  try {
    const actor = await requireActor();

    const {
      carId,
      carNumber,
      expenseDate,
      category,
      amount,
      description,
      paymentMethod,
      notes,
    } = parsed.data;

    const result = await db.$transaction(async (tx) => {
      // 1. Verify car exists
      const car = await tx.car.findUnique({
        where: { id: carId },
        select: { id: true, carNumber: true, status: true },
      });

      if (!car) {
        throw new Error("Car not found.");
      }

      const idempotencyKey = crypto.randomUUID();
      const decimalAmount = amount;

      // 2. Create CarExpense record
      const expense = await tx.carExpense.create({
        data: {
          idempotencyKey,
          carId: car.id,
          expenseDate: new Date(`${expenseDate}T00:00:00.000Z`),
          category,
          amount: decimalAmount,
          paymentMethod,
          description,
          notes: notes || null,
          status: "ACTIVE",
          createdById: actor.profileId,
        },
      });

      // 3. Create linked CashTransaction (Money Out) in Finance
      await tx.cashTransaction.create({
        data: {
          transactionDate: new Date(`${expenseDate}T00:00:00.000Z`),
          direction: "OUT",
          category: "CAR_EXPENSE",
          amount: decimalAmount,
          paymentMethod,
          referenceType: "CAR_EXPENSE",
          referenceId: expense.id,
          carId: car.id,
          description: `Car Expense: ${description}`,
          status: "ACTIVE",
          createdById: actor.profileId,
        },
      });

      // 4. Create AuditLog entry
      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "CREATE",
          entityType: "CAR_EXPENSE",
          entityId: expense.id,
          after: {
            carId: car.id,
            category,
            amount: decimalAmount,
            description,
          },
        },
      });

      return expense;
    });

    // Revalidate affected routes
    revalidatePath(`/cars/${carNumber}`);
    revalidatePath("/stock");
    revalidatePath("/");

    return { ok: true, expenseId: result.id };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to record car expense.",
    };
  }
}
