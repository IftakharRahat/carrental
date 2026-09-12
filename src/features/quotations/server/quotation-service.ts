import { db } from "@/lib/db";
import {
  formatQuotationNumber,
  type QuotationData,
} from "../domain/quotation-types";

export async function getQuotations(): Promise<QuotationData[]> {
  try {
    const list = await db.quotation.findMany({
      orderBy: { createdAt: "desc" },
    });

    return list.map((q) => ({
      id: q.id,
      quotationNumber: q.quotationNumber,
      quotationNumberFormatted: formatQuotationNumber(q.quotationNumber),
      businessName: q.businessName,
      businessPhone: q.businessPhone,
      businessAddress: q.businessAddress,
      quotationDate: q.quotationDate.toISOString().split("T")[0],
      customerName: q.customerName,
      customerWhatsapp: q.customerWhatsapp,
      customerLocation: q.customerLocation,
      vehicleModel: q.vehicleModel,
      modelYear: q.modelYear,
      condition: q.condition,
      customerNotes: q.customerNotes,
      askingPrice: q.askingPrice ? Number(q.askingPrice) : null,
      offerPrice: Number(q.offerPrice),
      terms: q.terms || "",
      status: q.status as any,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function getQuotationById(id: string): Promise<QuotationData | null> {
  try {
    const q = await db.quotation.findUnique({
      where: { id },
    });
    if (!q) return null;

    return {
      id: q.id,
      quotationNumber: q.quotationNumber,
      quotationNumberFormatted: formatQuotationNumber(q.quotationNumber),
      businessName: q.businessName,
      businessPhone: q.businessPhone,
      businessAddress: q.businessAddress,
      quotationDate: q.quotationDate.toISOString().split("T")[0],
      customerName: q.customerName,
      customerWhatsapp: q.customerWhatsapp,
      customerLocation: q.customerLocation,
      vehicleModel: q.vehicleModel,
      modelYear: q.modelYear,
      condition: q.condition,
      customerNotes: q.customerNotes,
      askingPrice: q.askingPrice ? Number(q.askingPrice) : null,
      offerPrice: Number(q.offerPrice),
      terms: q.terms || "",
      status: q.status as any,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}
