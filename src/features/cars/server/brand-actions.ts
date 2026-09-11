"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";

const createBrandSchema = z.object({
  name: z.string().trim().min(1, "Brand name is required").max(100),
});

export async function createBrandAction(
  name: string,
): Promise<ActionResult<{ name: string }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const parsed = createBrandSchema.safeParse({ name });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message || "Invalid brand name.",
    };
  }

  const trimmed = parsed.data.name;

  try {
    await db.customBrand.upsert({
      where: { name: trimmed },
      update: {},
      create: { name: trimmed },
    });

    revalidatePath("/cars/new");

    return {
      ok: true,
      data: { name: trimmed },
    };
  } catch (error) {
    console.error("Failed to create brand", error);
    return {
      ok: false,
      message: "Failed to save brand. Please try again.",
    };
  }
}
