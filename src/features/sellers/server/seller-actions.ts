"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { requireActor } from "@/lib/auth/actor";
import { db } from "@/lib/db";
import {
  createSellerSchema,
  updateSellerSchema,
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
