"use server";

import { z } from "zod";

import { sourceTypeValues } from "@/features/cars/domain/car-input";
import type { SellerOption, SourceOption } from "./reference-data";
import type { ActionResult } from "@/lib/action-result";
import { requireActor } from "@/lib/auth/actor";
import { db } from "@/lib/db";

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => value || undefined)
    .optional();

const sellerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: optionalText(40),
  whatsapp: optionalText(40),
  emiratesId: optionalText(80),
  location: optionalText(160),
  notes: optionalText(1000),
});

const sourceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(sourceTypeValues),
  phone: optionalText(40),
  whatsapp: optionalText(40),
  location: optionalText(160),
  notes: optionalText(1000),
});

export async function createSellerAction(
  input: unknown,
): Promise<ActionResult<SellerOption>> {
  const parsed = sellerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the seller details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor("cars:write");
    const seller = await db.$transaction(async (tx) => {
      const created = await tx.seller.create({ data: parsed.data });
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

    return {
      ok: true,
      data: { id: seller.id, name: seller.name, detail: seller.phone },
    };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function createSourceAction(
  input: unknown,
): Promise<ActionResult<SourceOption>> {
  const parsed = sourceSchema.safeParse(input);
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
      const created = await tx.source.create({ data: parsed.data });
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

    return {
      ok: true,
      data: {
        id: source.id,
        name: source.name,
        detail: source.phone,
        type: source.type,
      },
    };
  } catch (error) {
    return actionFailure(error);
  }
}

function actionFailure(error: unknown): ActionResult<never> {
  return {
    ok: false,
    message:
      error instanceof Error ? error.message : "Unable to save the record.",
  };
}
