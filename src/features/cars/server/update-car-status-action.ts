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
import { syncCarPurchaseCashTransaction } from "./car-purchase-cash-sync";

const updateCarStatusSchema = z.object({
  carId: z.string().uuid(),
  status: z.enum(["IN_STOCK", "PARTIALLY_RECOVERED", "COMPLETED", "VOIDED"]),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional(),
});

export type UpdateCarStatusResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

export async function updateCarStatusAction(input: {
  carId: string;
  status: "IN_STOCK" | "PARTIALLY_RECOVERED" | "COMPLETED" | "VOIDED";
  notes?: string;
}): Promise<UpdateCarStatusResult> {
  const parsed = updateCarStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid status or car ID." };
  }

  try {
    const actor = await requireActor("cars:write");

    if (actor.role !== "ADMIN") {
      return { ok: false, message: "Only Admin users can change vehicle status." };
    }

    const { carId, status: newStatus, notes } = parsed.data;

    const car = await db.car.findUnique({
      where: { id: carId },
      select: {
        id: true,
        carNumber: true,
        brand: true,
        model: true,
        status: true,
        completionDate: true,
      },
    });

    if (!car) {
      return { ok: false, message: "Car not found." };
    }

    if (car.status === newStatus) {
      return { ok: true, message: `Status is already ${newStatus}.` };
    }

    const now = new Date();
    const isBecomingCompleted = newStatus === "COMPLETED";
    const wasCompleted = car.status === "COMPLETED";

    // Set or clear completion date accordingly
    let completionDate: Date | null = car.completionDate;
    if (isBecomingCompleted && !completionDate) {
      completionDate = now;
    } else if (!isBecomingCompleted && wasCompleted) {
      completionDate = null;
    }

    await db.$transaction(async (tx) => {
      await tx.car.update({
        where: { id: carId },
        data: {
          status: newStatus,
          completionDate,
          updatedById: actor.profileId,
          version: { increment: 1 },
        },
      });

      // Cancelling (voiding) a car refunds its purchase amount to Available Cash;
      // un-voiding re-applies it.
      await syncCarPurchaseCashTransaction(tx, {
        carId,
        fromStatus: car.status,
        toStatus: newStatus,
        reason: notes,
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "UPDATE",
          entityType: "CAR",
          entityId: carId,
          before: {
            status: car.status,
            completionDate: car.completionDate?.toISOString() ?? null,
          },
          after: {
            status: newStatus,
            completionDate: completionDate?.toISOString() ?? null,
            notes: notes || undefined,
          },
        },
      });
    });

    revalidatePath("/");
    revalidatePath("/stock");
    revalidatePath("/cars");
    revalidatePath(`/cars/${formatCarNumber(car.carNumber)}`);
    revalidatePath("/reports");
    revalidatePath("/analytics");
    revalidatePath("/finance");

    return { ok: true, message: `Status updated to ${newStatus.replace("_", " ")}.` };
  } catch (error) {
    if (
      error instanceof AuthenticationError ||
      error instanceof AuthorizationError
    ) {
      return { ok: false, message: error.message };
    }
    console.error("Failed to update car status", error);
    return { ok: false, message: "Unable to update status. Please try again." };
  }
}
