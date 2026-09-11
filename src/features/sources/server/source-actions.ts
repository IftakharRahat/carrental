"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { requireActor } from "@/lib/auth/actor";
import { db } from "@/lib/db";
import {
  createSourceSchema,
  payCommissionSchema,
  updateSourceSchema,
} from "../domain/source-types";

function handleError(error: unknown) {
  return {
    ok: false as const,
    message: error instanceof Error ? error.message : "An unexpected error occurred",
  };
}

export async function createSourceAction(
  input: unknown,
): Promise<ActionResult<{ id: string; name: string; type: string; detail: string | null }>> {
  const parsed = createSourceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the source details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor("cars:write");
    const source = await db.$transaction(async (tx) => {
      const created = await tx.source.create({
        data: {
          name: parsed.data.name,
          type: parsed.data.type,
          phone: parsed.data.phone || null,
          whatsapp: parsed.data.whatsapp || null,
          location: parsed.data.location || null,
          notes: parsed.data.notes || null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "CREATE",
          entityType: "SOURCE",
          entityId: created.id,
          after: JSON.parse(JSON.stringify(parsed.data)),
        },
      });

      return created;
    });

    revalidatePath("/sources");
    revalidatePath("/cars/new");

    return {
      ok: true,
      data: {
        id: source.id,
        name: source.name,
        type: source.type,
        detail: source.phone,
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateSourceAction(
  input: unknown,
): Promise<ActionResult<{ id: string; name: string }>> {
  const parsed = updateSourceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the source details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor("cars:write");
    const { id, ...data } = parsed.data;

    const existing = await db.source.findUnique({ where: { id } });
    if (!existing) {
      return { ok: false, message: "Source not found." };
    }

    const updated = await db.$transaction(async (tx) => {
      const source = await tx.source.update({
        where: { id },
        data: {
          name: data.name,
          type: data.type,
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          location: data.location || null,
          notes: data.notes || null,
          isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "UPDATE",
          entityType: "SOURCE",
          entityId: id,
          before: JSON.parse(JSON.stringify(existing)),
          after: JSON.parse(JSON.stringify(source)),
        },
      });

      return source;
    });

    revalidatePath("/sources");
    revalidatePath(`/sources/${id}`);
    revalidatePath("/cars/new");

    return {
      ok: true,
      data: { id: updated.id, name: updated.name },
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function toggleSourceActiveAction(
  sourceId: string,
  isActive: boolean,
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
  try {
    const actor = await requireActor("cars:write");
    const existing = await db.source.findUnique({ where: { id: sourceId } });
    if (!existing) {
      return { ok: false, message: "Source not found." };
    }

    await db.$transaction(async (tx) => {
      await tx.source.update({
        where: { id: sourceId },
        data: { isActive },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "UPDATE",
          entityType: "SOURCE",
          entityId: sourceId,
          reason: isActive ? "Reactivated source" : "Archived/deactivated source",
          before: { isActive: existing.isActive },
          after: { isActive },
        },
      });
    });

    revalidatePath("/sources");
    revalidatePath(`/sources/${sourceId}`);

    return { ok: true, data: { id: sourceId, isActive } };
  } catch (error) {
    return handleError(error);
  }
}

export async function recordSourceCommissionAction(
  input: unknown,
): Promise<ActionResult<{ id: string; amount: number }>> {
  const parsed = payCommissionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the commission details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor("finance:write");
    const { sourceId, carId, amount, paymentDate, paymentMethod, notes } = parsed.data;

    const source = await db.source.findUnique({ where: { id: sourceId } });
    if (!source) {
      return { ok: false, message: "Source not found." };
    }

    let carNumberStr = "";
    if (carId) {
      const car = await db.car.findUnique({ where: { id: carId } });
      if (car) {
        carNumberStr = ` for CAR-${String(car.carNumber).padStart(4, "0")}`;
      }
    }

    const commissionId = crypto.randomUUID();
    const referenceId = `${sourceId}:${commissionId}`;
    const description = notes
      ? `Commission to ${source.name}${carNumberStr}: ${notes}`
      : `Commission paid to ${source.name}${carNumberStr}`;

    const dateObj = new Date(paymentDate);

    const transaction = await db.$transaction(async (tx) => {
      const cashTx = await tx.cashTransaction.create({
        data: {
          transactionDate: dateObj,
          direction: "OUT",
          category: "COMMISSION",
          amount: amount,
          paymentMethod,
          referenceType: "SOURCE_COMMISSION",
          referenceId,
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
          entityId: cashTx.id,
          after: {
            direction: "OUT",
            category: "COMMISSION",
            amount,
            sourceId,
            carId: carId || null,
          },
        },
      });

      return cashTx;
    });

    revalidatePath("/sources");
    revalidatePath(`/sources/${sourceId}`);
    revalidatePath("/finance/cash-flow");

    return {
      ok: true,
      data: { id: transaction.id, amount: Number(amount) },
    };
  } catch (error) {
    return handleError(error);
  }
}
