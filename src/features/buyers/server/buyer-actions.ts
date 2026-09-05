"use server";

import { revalidatePath } from "next/cache";

import { requireActor } from "@/lib/auth/actor";
import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";
import {
  canDeleteBuyer,
} from "../domain/buyer-calculations";
import {
  createBuyerInputSchema,
  updateBuyerInputSchema,
} from "../domain/buyer-types";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

/**
 * Creates a new buyer with multi-select category assignments (Section 11.1 & 11.2).
 */
export async function createBuyerAction(
  formData: FormData,
): Promise<ActionResult<{ id: string; name: string }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const rawBuyerTypeIds = formData.getAll("buyerTypeIds") as string[];

  const raw = {
    name: formData.get("name") as string,
    companyName: (formData.get("companyName") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    whatsapp: (formData.get("whatsapp") as string) || undefined,
    location: (formData.get("location") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
    buyerTypeIds: rawBuyerTypeIds,
  };

  const parsed = createBuyerInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor();
    const { name, companyName, phone, whatsapp, location, notes, buyerTypeIds } =
      parsed.data;

    const buyer = await db.$transaction(async (tx) => {
      const created = await tx.buyer.create({
        data: {
          name,
          companyName: companyName || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          location: location || null,
          notes: notes || null,
          isActive: true,
        },
      });

      if (buyerTypeIds.length > 0) {
        await tx.buyerTypeAssignment.createMany({
          data: buyerTypeIds.map((buyerTypeId) => ({
            buyerId: created.id,
            buyerTypeId,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "CREATE",
          entityType: "BUYER",
          entityId: created.id,
          after: {
            name: created.name,
            companyName: created.companyName,
            phone: created.phone,
            types: buyerTypeIds,
          },
        },
      });

      return created;
    });

    revalidatePath("/buyers");
    revalidatePath("/sell");

    return { ok: true, data: { id: buyer.id, name: buyer.name } };
  } catch (error) {
    console.error("Failed to create buyer:", error);
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to create buyer record.",
    };
  }
}

/**
 * Updates existing buyer details and synchronizes buyer categories (Section 11.2).
 */
export async function updateBuyerAction(
  formData: FormData,
): Promise<ActionResult<{ id: string; name: string }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const rawBuyerTypeIds = formData.getAll("buyerTypeIds") as string[];

  const raw = {
    id: formData.get("id") as string,
    name: formData.get("name") as string,
    companyName: (formData.get("companyName") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    whatsapp: (formData.get("whatsapp") as string) || undefined,
    location: (formData.get("location") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
    isActive: formData.get("isActive") === "true",
    buyerTypeIds: rawBuyerTypeIds,
  };

  const parsed = updateBuyerInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor();
    const { id, name, companyName, phone, whatsapp, location, notes, isActive, buyerTypeIds } =
      parsed.data;

    const buyer = await db.$transaction(async (tx) => {
      const existing = await tx.buyer.findUnique({
        where: { id },
        include: { buyerTypes: true },
      });

      if (!existing) {
        throw new Error("Buyer not found.");
      }

      const updated = await tx.buyer.update({
        where: { id },
        data: {
          name,
          companyName: companyName || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          location: location || null,
          notes: notes || null,
          isActive,
        },
      });

      // Synchronize category assignments
      await tx.buyerTypeAssignment.deleteMany({
        where: { buyerId: id },
      });

      if (buyerTypeIds.length > 0) {
        await tx.buyerTypeAssignment.createMany({
          data: buyerTypeIds.map((buyerTypeId) => ({
            buyerId: id,
            buyerTypeId,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "UPDATE",
          entityType: "BUYER",
          entityId: id,
          before: {
            name: existing.name,
            isActive: existing.isActive,
            types: existing.buyerTypes.map((t) => t.buyerTypeId),
          },
          after: {
            name: updated.name,
            isActive: updated.isActive,
            types: buyerTypeIds,
          },
        },
      });

      return updated;
    });

    revalidatePath("/buyers");
    revalidatePath(`/buyers/${buyer.id}`);
    revalidatePath("/sell");

    return { ok: true, data: { id: buyer.id, name: buyer.name } };
  } catch (error) {
    console.error("Failed to update buyer:", error);
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to update buyer record.",
    };
  }
}

/**
 * Toggles buyer active/archive state (Section 11.3).
 */
export async function toggleBuyerActiveAction(
  buyerId: string,
  isActive: boolean,
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  try {
    const actor = await requireActor();

    const updated = await db.buyer.update({
      where: { id: buyerId },
      data: { isActive },
    });

    await db.auditLog.create({
      data: {
        actorId: actor.profileId,
        action: "UPDATE",
        entityType: "BUYER",
        entityId: buyerId,
        after: { isActive },
        reason: isActive ? "Restored buyer" : "Archived buyer",
      },
    });

    revalidatePath("/buyers");
    revalidatePath(`/buyers/${buyerId}`);
    revalidatePath("/sell");

    return { ok: true, data: { id: updated.id, isActive: updated.isActive } };
  } catch (error) {
    console.error("Failed to toggle buyer status:", error);
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to update buyer status.",
    };
  }
}

/**
 * Enforces Section 11.3 Deletion Safety Constraint:
 * "Buyer cannot be hard-deleted if linked to sales; archive/deactivate instead."
 */
export async function deleteBuyerAction(
  buyerId: string,
): Promise<ActionResult<{ id: string }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  try {
    const actor = await requireActor();

    const transactionCount = await db.recoveryTransaction.count({
      where: { buyerId },
    });

    const guard = canDeleteBuyer(transactionCount);
    if (!guard.canDelete) {
      return {
        ok: false,
        message: guard.reason || "Buyer has recorded sales and cannot be deleted. Archive instead.",
      };
    }

    await db.$transaction(async (tx) => {
      await tx.buyerTypeAssignment.deleteMany({
        where: { buyerId },
      });

      await tx.buyer.delete({
        where: { id: buyerId },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "VOID",
          entityType: "BUYER",
          entityId: buyerId,
          reason: "Deleted unused buyer record",
        },
      });
    });

    revalidatePath("/buyers");
    revalidatePath("/sell");

    return { ok: true, data: { id: buyerId } };
  } catch (error) {
    console.error("Failed to delete buyer:", error);
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to delete buyer record.",
    };
  }
}
