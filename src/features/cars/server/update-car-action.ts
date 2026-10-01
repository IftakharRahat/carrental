"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { formatCarNumber } from "@/features/cars/domain/car-number";
import {
  AuthenticationError,
  AuthorizationError,
  requireActor,
} from "@/lib/auth/actor";
import { db } from "@/lib/db";

const updateCarInputSchema = z
  .object({
    carId: z.string().uuid(),
    brand: z.string().trim().min(1, "Brand is required").max(80),
    model: z.string().trim().min(1, "Model is required").max(80),
    year: z.preprocess(
      (v) => (v === "" || v === undefined ? undefined : v),
      z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
    ),
    condition: z.enum([
      "SCRAP",
      "ACCIDENT_DAMAGED",
      "ENGINE_ISSUE",
      "GEARBOX_ISSUE",
      "OTHER",
    ]),
    conditionOther: z
      .string()
      .trim()
      .max(200)
      .transform((v) => v || undefined)
      .optional(),
    purchasePrice: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid AED amount")
      .refine((v) => Number(v) > 0, "Amount must be greater than zero"),
    paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
    vinChassis: z
      .string()
      .trim()
      .max(100)
      .transform((v) => v || undefined)
      .optional(),
    notes: z
      .string()
      .trim()
      .max(2000)
      .transform((v) => v || undefined)
      .optional(),
  })
  .refine(
    (input) => input.condition !== "OTHER" || Boolean(input.conditionOther),
    {
      message: "Describe the condition when Other is selected",
      path: ["conditionOther"],
    },
  );

export type UpdateCarActionResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function updateCarAction(
  formData: FormData,
): Promise<UpdateCarActionResult> {
  const raw = {
    carId: formData.get("carId") as string,
    brand: formData.get("brand") as string,
    model: formData.get("model") as string,
    year: formData.get("year") as string,
    condition: formData.get("condition") as string,
    conditionOther: formData.get("conditionOther") as string,
    purchasePrice: formData.get("purchasePrice") as string,
    paymentMethod: formData.get("paymentMethod") as string,
    vinChassis: formData.get("vinChassis") as string,
    notes: formData.get("notes") as string,
  };

  const parsed = updateCarInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor("cars:write");

    if (actor.role !== "ADMIN") {
      return {
        ok: false,
        message: "Only Admin users can edit car details.",
      };
    }

    const { carId, ...updates } = parsed.data;

    const car = await db.car.findUnique({
      where: { id: carId },
      select: {
        id: true,
        carNumber: true,
        brand: true,
        model: true,
        year: true,
        condition: true,
        conditionOther: true,
        purchasePrice: true,
        paymentMethod: true,
        vinChassis: true,
        notes: true,
        version: true,
      },
    });

    if (!car) {
      return { ok: false, message: "Car not found." };
    }

    const priceChanged =
      Number(car.purchasePrice) !== Number(updates.purchasePrice);

    await db.$transaction(async (tx) => {
      // Update the car record
      await tx.car.update({
        where: { id: carId },
        data: {
          brand: updates.brand,
          model: updates.model,
          year: updates.year ?? null,
          condition: updates.condition,
          conditionOther: updates.conditionOther ?? null,
          purchasePrice: updates.purchasePrice,
          paymentMethod: updates.paymentMethod,
          vinChassis: updates.vinChassis ?? null,
          notes: updates.notes ?? null,
          updatedById: actor.profileId,
          version: { increment: 1 },
        },
      });

      // If purchase price changed, update the matching CAR_PURCHASE cash transaction
      if (priceChanged) {
        const purchaseTx = await tx.cashTransaction.findFirst({
          where: {
            referenceType: "CAR_PURCHASE",
            referenceId: carId,
            status: "ACTIVE",
          },
        });

        if (purchaseTx) {
          await tx.cashTransaction.update({
            where: { id: purchaseTx.id },
            data: {
              amount: updates.purchasePrice,
              paymentMethod: updates.paymentMethod,
              description: `Purchase of ${formatCarNumber(car.carNumber)} · ${updates.brand} ${updates.model}`,
            },
          });
        }
      }

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "UPDATE",
          entityType: "CAR",
          entityId: carId,
          before: {
            brand: car.brand,
            model: car.model,
            year: car.year,
            condition: car.condition,
            conditionOther: car.conditionOther,
            purchasePrice: car.purchasePrice.toString(),
            paymentMethod: car.paymentMethod,
            vinChassis: car.vinChassis,
            notes: car.notes,
          },
          after: {
            brand: updates.brand,
            model: updates.model,
            year: updates.year ?? null,
            condition: updates.condition,
            conditionOther: updates.conditionOther ?? null,
            purchasePrice: updates.purchasePrice,
            paymentMethod: updates.paymentMethod,
            vinChassis: updates.vinChassis ?? null,
            notes: updates.notes ?? null,
          },
        },
      });
    });

    revalidatePath("/");
    revalidatePath("/stock");
    revalidatePath("/cars");
    revalidatePath(`/cars/${formatCarNumber(car.carNumber)}`);

    return { ok: true };
  } catch (error) {
    if (
      error instanceof AuthenticationError ||
      error instanceof AuthorizationError
    ) {
      return { ok: false, message: error.message };
    }
    console.error("Failed to update car", error);
    return { ok: false, message: "Unable to update the car. Please try again." };
  }
}
