"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { requireActor } from "@/lib/auth/actor";
import { db } from "@/lib/db";
import {
  createBusinessContactSchema,
  updateBusinessContactSchema,
  type BusinessContactRowData,
} from "../domain/business-contact-types";

function handleError(error: unknown): ActionResult<never> {
  return {
    ok: false,
    message: error instanceof Error ? error.message : "An unexpected error occurred",
  };
}

export async function createBusinessContactAction(
  input: unknown,
): Promise<ActionResult<BusinessContactRowData>> {
  const parsed = createBusinessContactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check your input values and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor("contacts:manage");

    const contact = await db.$transaction(async (tx) => {
      const created = await tx.businessContact.create({
        data: {
          name: parsed.data.name,
          businessName: parsed.data.businessName || null,
          category: parsed.data.category,
          purpose: parsed.data.purpose || null,
          phone: parsed.data.phone || null,
          whatsapp: parsed.data.whatsapp || null,
          email: parsed.data.email || null,
          location: parsed.data.location || null,
          notes: parsed.data.notes || null,
          isImportant: parsed.data.isImportant,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "CREATE",
          entityType: "BUSINESS_CONTACT",
          entityId: created.id,
          after: JSON.parse(JSON.stringify(created)),
        },
      });

      return created;
    });

    revalidatePath("/business-contacts");

    return {
      ok: true,
      data: {
        id: contact.id,
        name: contact.name,
        businessName: contact.businessName,
        category: contact.category,
        purpose: contact.purpose,
        phone: contact.phone,
        whatsapp: contact.whatsapp,
        email: contact.email,
        location: contact.location,
        notes: contact.notes,
        isImportant: contact.isImportant,
        isActive: contact.isActive,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateBusinessContactAction(
  input: unknown,
): Promise<ActionResult<BusinessContactRowData>> {
  const parsed = updateBusinessContactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check your input values and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor("contacts:manage");

    const contact = await db.$transaction(async (tx) => {
      const before = await tx.businessContact.findUnique({
        where: { id: parsed.data.id },
      });
      if (!before || !before.isActive) {
        throw new Error("Business contact not found");
      }

      const updated = await tx.businessContact.update({
        where: { id: parsed.data.id },
        data: {
          name: parsed.data.name,
          businessName: parsed.data.businessName || null,
          category: parsed.data.category,
          purpose: parsed.data.purpose || null,
          phone: parsed.data.phone || null,
          whatsapp: parsed.data.whatsapp || null,
          email: parsed.data.email || null,
          location: parsed.data.location || null,
          notes: parsed.data.notes || null,
          isImportant: parsed.data.isImportant,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "UPDATE",
          entityType: "BUSINESS_CONTACT",
          entityId: updated.id,
          before: JSON.parse(JSON.stringify(before)),
          after: JSON.parse(JSON.stringify(updated)),
        },
      });

      return updated;
    });

    revalidatePath("/business-contacts");

    return {
      ok: true,
      data: {
        id: contact.id,
        name: contact.name,
        businessName: contact.businessName,
        category: contact.category,
        purpose: contact.purpose,
        phone: contact.phone,
        whatsapp: contact.whatsapp,
        email: contact.email,
        location: contact.location,
        notes: contact.notes,
        isImportant: contact.isImportant,
        isActive: contact.isActive,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function toggleBusinessContactImportantAction(
  id: string,
): Promise<ActionResult<{ id: string; isImportant: boolean }>> {
  try {
    const actor = await requireActor("contacts:manage");

    const contact = await db.$transaction(async (tx) => {
      const existing = await tx.businessContact.findUnique({
        where: { id },
      });
      if (!existing || !existing.isActive) {
        throw new Error("Business contact not found");
      }

      const updated = await tx.businessContact.update({
        where: { id },
        data: {
          isImportant: !existing.isImportant,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "UPDATE",
          entityType: "BUSINESS_CONTACT",
          entityId: updated.id,
          after: { isImportant: updated.isImportant },
        },
      });

      return updated;
    });

    revalidatePath("/business-contacts");

    return {
      ok: true,
      data: {
        id: contact.id,
        isImportant: contact.isImportant,
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteBusinessContactAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireActor("contacts:manage");

    await db.$transaction(async (tx) => {
      const existing = await tx.businessContact.findUnique({
        where: { id },
      });
      if (!existing || !existing.isActive) {
        throw new Error("Business contact not found");
      }

      await tx.businessContact.update({
        where: { id },
        data: { isActive: false },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.profileId,
          action: "VOID",
          entityType: "BUSINESS_CONTACT",
          entityId: id,
          reason: "Deleted by user",
        },
      });
    });

    revalidatePath("/business-contacts");

    return {
      ok: true,
      data: { id },
    };
  } catch (error) {
    return handleError(error);
  }
}
