"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { requireActor } from "@/lib/auth/actor";
import { db } from "@/lib/db";
import {
  formatQuotationNumber,
  quotationInputSchema,
  type QuotationData,
} from "../domain/quotation-types";

function handleError(error: unknown): ActionResult<never> {
  return {
    ok: false,
    message: error instanceof Error ? error.message : "An unexpected error occurred",
  };
}

export async function saveQuotationAction(
  input: unknown,
): Promise<ActionResult<QuotationData>> {
  const parsed = quotationInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check quotation details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor();
    const data = parsed.data;

    let quotationDateObj: Date;
    try {
      quotationDateObj = new Date(data.quotationDate);
      if (isNaN(quotationDateObj.getTime())) {
        quotationDateObj = new Date();
      }
    } catch {
      quotationDateObj = new Date();
    }

    if (data.id) {
      // Update existing quotation
      const updated = await db.quotation.update({
        where: { id: data.id },
        data: {
          businessName: data.businessName,
          businessPhone: data.businessPhone,
          businessAddress: data.businessAddress,
          quotationDate: quotationDateObj,
          customerName: data.customerName,
          customerWhatsapp: data.customerWhatsapp || null,
          customerLocation: data.customerLocation || null,
          vehicleModel: data.vehicleModel,
          modelYear: data.modelYear || null,
          condition: data.condition,
          customerNotes: data.customerNotes || null,
          askingPrice: data.askingPrice != null ? data.askingPrice : null,
          offerPrice: data.offerPrice,
          terms: data.terms,
          status: data.status,
        },
      });

      revalidatePath("/dashboard");
      revalidatePath("/quotations");

      return {
        ok: true,
        data: {
          id: updated.id,
          quotationNumber: updated.quotationNumber,
          quotationNumberFormatted: formatQuotationNumber(updated.quotationNumber),
          businessName: updated.businessName,
          businessPhone: updated.businessPhone,
          businessAddress: updated.businessAddress,
          quotationDate: updated.quotationDate.toISOString().split("T")[0],
          customerName: updated.customerName,
          customerWhatsapp: updated.customerWhatsapp,
          customerLocation: updated.customerLocation,
          vehicleModel: updated.vehicleModel,
          modelYear: updated.modelYear,
          condition: updated.condition,
          customerNotes: updated.customerNotes,
          askingPrice: updated.askingPrice ? Number(updated.askingPrice) : null,
          offerPrice: Number(updated.offerPrice),
          terms: updated.terms || "",
          status: updated.status as any,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      };
    }

    // Create new quotation
    const created = await db.quotation.create({
      data: {
        businessName: data.businessName,
        businessPhone: data.businessPhone,
        businessAddress: data.businessAddress,
        quotationDate: quotationDateObj,
        customerName: data.customerName,
        customerWhatsapp: data.customerWhatsapp || null,
        customerLocation: data.customerLocation || null,
        vehicleModel: data.vehicleModel,
        modelYear: data.modelYear || null,
        condition: data.condition,
        customerNotes: data.customerNotes || null,
        askingPrice: data.askingPrice != null ? data.askingPrice : null,
        offerPrice: data.offerPrice,
        terms: data.terms,
        status: data.status,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/quotations");

    return {
      ok: true,
      data: {
        id: created.id,
        quotationNumber: created.quotationNumber,
        quotationNumberFormatted: formatQuotationNumber(created.quotationNumber),
        businessName: created.businessName,
        businessPhone: created.businessPhone,
        businessAddress: created.businessAddress,
        quotationDate: created.quotationDate.toISOString().split("T")[0],
        customerName: created.customerName,
        customerWhatsapp: created.customerWhatsapp,
        customerLocation: created.customerLocation,
        vehicleModel: created.vehicleModel,
        modelYear: created.modelYear,
        condition: created.condition,
        customerNotes: created.customerNotes,
        askingPrice: created.askingPrice ? Number(created.askingPrice) : null,
        offerPrice: Number(created.offerPrice),
        terms: created.terms || "",
        status: created.status as any,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteQuotationAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireActor();
    await db.quotation.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/quotations");

    return {
      ok: true,
      data: { id },
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateQuotationStatusAction(
  id: string,
  status: "OFFERED" | "ACCEPTED" | "REJECTED" | "EXPIRED",
): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    await requireActor();
    const updated = await db.quotation.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/dashboard");
    revalidatePath("/quotations");

    return {
      ok: true,
      data: { id: updated.id, status: updated.status },
    };
  } catch (error) {
    return handleError(error);
  }
}
