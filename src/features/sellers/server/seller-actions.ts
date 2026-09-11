"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { requireActor } from "@/lib/auth/actor";
import { db } from "@/lib/db";
import {
  createSellerSchema,
  updateSellerSchema,
  type ExpiredSellersCleanupResult,
} from "../domain/seller-types";
import { checkDuplicateSellerPhone } from "./seller-service";

export type SellerActionResult =
  | { ok: true; data: { id: string; name: string } }
  | {
      ok: false;
      message: string;
      duplicateWarning?: { name: string; phone: string };
      fieldErrors?: Record<string, string[]>;
    };

function handleError(error: unknown) {
  return {
    ok: false as const,
    message: error instanceof Error ? error.message : "An unexpected error occurred",
  };
}

export async function checkPhoneDuplicateAction(
  phone: string,
  excludeSellerId?: string,
): Promise<{ exists: boolean; existingSeller?: { id: string; name: string; phone: string } }> {
  return checkDuplicateSellerPhone(phone, excludeSellerId);
}

export async function createSellerAction(
  input: unknown,
): Promise<SellerActionResult> {
  const parsed = createSellerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the seller details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor("cars:write");
    const { phone, allowDuplicatePhone, ...rest } = parsed.data;

    // Check duplicate phone warning if phone is provided and not explicitly allowed
    if (phone && !allowDuplicatePhone) {
      const duplicateCheck = await checkDuplicateSellerPhone(phone);
      if (duplicateCheck.exists && duplicateCheck.existingSeller) {
        return {
          ok: false,
          message: `Phone number is already linked to seller "${duplicateCheck.existingSeller.name}". Confirm if you wish to proceed.`,
          duplicateWarning: duplicateCheck.existingSeller,
        };
      }
    }

    const seller = await db.$transaction(async (tx) => {
      const created = await tx.seller.create({
        data: {
          name: rest.name,
          phone: phone || null,
          whatsapp: rest.whatsapp || null,
          emiratesId: rest.emiratesId || null,
          location: rest.location || null,
          notes: rest.notes || null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "CREATE",
          entityType: "SELLER",
          entityId: created.id,
          after: JSON.parse(JSON.stringify(parsed.data)),
        },
      });

      return created;
    });

    revalidatePath("/sellers");
    revalidatePath("/cars/new");

    return {
      ok: true,
      data: { id: seller.id, name: seller.name },
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateSellerAction(
  input: unknown,
): Promise<SellerActionResult> {
  const parsed = updateSellerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the seller details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor("cars:write");
    const { id, phone, allowDuplicatePhone, ...rest } = parsed.data;

    const existing = await db.seller.findUnique({ where: { id } });
    if (!existing) {
      return { ok: false, message: "Seller not found." };
    }

    // Check duplicate phone warning against other sellers
    if (phone && !allowDuplicatePhone) {
      const duplicateCheck = await checkDuplicateSellerPhone(phone, id);
      if (duplicateCheck.exists && duplicateCheck.existingSeller) {
        return {
          ok: false,
          message: `Phone number is already linked to seller "${duplicateCheck.existingSeller.name}". Confirm if you wish to proceed.`,
          duplicateWarning: duplicateCheck.existingSeller,
        };
      }
    }

    const updated = await db.$transaction(async (tx) => {
      const seller = await tx.seller.update({
        where: { id },
        data: {
          name: rest.name,
          phone: phone || null,
          whatsapp: rest.whatsapp || null,
          emiratesId: rest.emiratesId || null,
          location: rest.location || null,
          notes: rest.notes || null,
          isActive: rest.isActive !== undefined ? rest.isActive : existing.isActive,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "UPDATE",
          entityType: "SELLER",
          entityId: id,
          before: JSON.parse(JSON.stringify(existing)),
          after: JSON.parse(JSON.stringify(seller)),
        },
      });

      return seller;
    });

    revalidatePath("/sellers");
    revalidatePath(`/sellers/${id}`);
    revalidatePath("/cars/new");

    return {
      ok: true,
      data: { id: updated.id, name: updated.name },
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function toggleSellerActiveAction(
  sellerId: string,
  isActive: boolean,
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
  try {
    const actor = await requireActor("cars:write");
    const existing = await db.seller.findUnique({ where: { id: sellerId } });
    if (!existing) {
      return { ok: false, message: "Seller not found." };
    }

    await db.$transaction(async (tx) => {
      await tx.seller.update({
        where: { id: sellerId },
        data: { isActive },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "UPDATE",
          entityType: "SELLER",
          entityId: sellerId,
          reason: isActive ? "Reactivated seller" : "Archived/deactivated seller",
          before: { isActive: existing.isActive },
          after: { isActive },
        },
      });
    });

    revalidatePath("/sellers");
    revalidatePath(`/sellers/${sellerId}`);

    return { ok: true, data: { id: sellerId, isActive } };
  } catch (error) {
    return handleError(error);
  }
}

export async function cleanExpiredSellersAction(
  days = 45,
): Promise<ActionResult<ExpiredSellersCleanupResult>> {
  try {
    const actor = await requireActor("cars:write");
    const thresholdDays = Math.max(1, Number(days) || 45);
    const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - thresholdMs);

    // Fetch active sellers with their cars
    const activeSellers = await db.seller.findMany({
      where: { isActive: true },
      include: {
        cars: {
          select: { id: true, purchaseDate: true },
        },
      },
    });

    const idsToDelete: string[] = [];
    const idsToArchive: string[] = [];

    for (const seller of activeSellers) {
      if (seller.cars.length === 0) {
        if (seller.createdAt <= cutoffDate) {
          idsToDelete.push(seller.id);
        }
      } else {
        // Find latest purchaseDate
        const latestPurchaseTime = Math.max(
          ...seller.cars.map((c) => new Date(c.purchaseDate).getTime()),
        );
        if (latestPurchaseTime <= cutoffDate.getTime()) {
          idsToArchive.push(seller.id);
        }
      }
    }

    if (idsToDelete.length === 0 && idsToArchive.length === 0) {
      return {
        ok: true,
        data: { deletedCount: 0, archivedCount: 0, totalCleaned: 0 },
      };
    }

    await db.$transaction(async (tx) => {
      // Safely delete unused sellers (0 cars)
      if (idsToDelete.length > 0) {
        await tx.seller.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }

      // Safely archive sellers with car history (preserves all cars, expenses, and cash transactions)
      if (idsToArchive.length > 0) {
        await tx.seller.updateMany({
          where: { id: { in: idsToArchive } },
          data: { isActive: false },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "UPDATE",
          entityType: "SELLER",
          entityId: "BATCH_CLEANUP",
          reason: `Cleaned expired sellers older than ${thresholdDays} days. Deleted: ${idsToDelete.length} (0 cars), Archived: ${idsToArchive.length} (cars preserved).`,
          after: {
            thresholdDays,
            deletedIds: idsToDelete,
            archivedIds: idsToArchive,
          },
        },
      });
    });

    revalidatePath("/sellers");
    revalidatePath("/cars/new");

    return {
      ok: true,
      data: {
        deletedCount: idsToDelete.length,
        archivedCount: idsToArchive.length,
        totalCleaned: idsToDelete.length + idsToArchive.length,
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteSingleSellerAction(
  sellerId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireActor("cars:write");
    const seller = await db.seller.findUnique({
      where: { id: sellerId },
      include: {
        cars: { select: { id: true } },
      },
    });

    if (!seller) {
      return { ok: false, message: "Seller not found." };
    }

    if (seller.cars.length > 0) {
      return {
        ok: false,
        message:
          "This seller has vehicle purchase history. To protect and preserve all car records (# all cars এ রেকর্ড সেভ থাকবে #), please Archive this seller instead.",
      };
    }

    await db.$transaction(async (tx) => {
      await tx.seller.delete({ where: { id: sellerId } });

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "VOID",
          entityType: "SELLER",
          entityId: sellerId,
          reason: `Deleted unused seller "${seller.name}" with 0 cars.`,
          before: { id: seller.id, name: seller.name },
        },
      });
    });

    revalidatePath("/sellers");
    revalidatePath("/cars/new");

    return { ok: true, data: { id: sellerId } };
  } catch (error) {
    return handleError(error);
  }
}
