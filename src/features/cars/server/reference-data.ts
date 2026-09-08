import "server-only";

import { isAuthConfigured, isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";

export type SellerOption = {
  id: string;
  name: string;
  detail: string | null;
};

export type SourceOption = SellerOption & {
  type: string;
};

export type BuyCarReferenceData = {
  sellers: SellerOption[];
  sources: SourceOption[];
};

export async function getBuyCarReferenceData(): Promise<BuyCarReferenceData> {
  const authenticationUnavailable = !isAuthConfigured();

  if (!isDatabaseConfigured() || authenticationUnavailable) {
    return { sellers: [], sources: [] };
  }

  const [sellers, sources] = await Promise.all([
    db.seller.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true },
    }),
    db.source.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true, type: true },
    }),
  ]);

  return {
    sellers: sellers.map(({ id, name, phone }) => ({
      id,
      name,
      detail: phone,
    })),
    sources: sources.map(({ id, name, phone, type }) => ({
      id,
      name,
      detail: phone,
      type,
    })),
  };
}
