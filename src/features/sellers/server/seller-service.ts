import "server-only";

import { db } from "@/lib/db";
import {
  calculateOverallSellersKpis,
  calculateSellerKpis,
} from "../domain/seller-calculations";
import {
  normalizePhoneNumber,
  type OverallSellersKpis,
  type SellerCarItem,
  type SellerProfileData,
  type SellerRowData,
} from "../domain/seller-types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getSellersListPageData(): Promise<{
  sellers: SellerRowData[];
  overallKpis: OverallSellersKpis;
}> {
  const rawSellers = await db.seller.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      cars: {
        select: {
          id: true,
          purchasePrice: true,
          purchaseDate: true,
        },
      },
    },
  });

  const sellers: SellerRowData[] = rawSellers.map((s) => {
    const kpis = calculateSellerKpis(s.cars);
    return {
      id: s.id,
      name: s.name,
      phone: s.phone,
      whatsapp: s.whatsapp,
      emiratesId: s.emiratesId,
      location: s.location,
      notes: s.notes,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      kpis,
    };
  });

  const overallKpis = calculateOverallSellersKpis(sellers);

  return { sellers, overallKpis };
}

export async function getSellerProfileData(
  sellerId: string,
): Promise<SellerProfileData | null> {
  if (!UUID_REGEX.test(sellerId)) {
    return null;
  }

  const seller = await db.seller.findUnique({
    where: { id: sellerId },
    include: {
      cars: {
        orderBy: { purchaseDate: "desc" },
        select: {
          id: true,
          carNumber: true,
          brand: true,
          model: true,
          year: true,
          purchaseDate: true,
          purchasePrice: true,
          status: true,
        },
      },
    },
  });

  if (!seller) {
    return null;
  }

  const linkedCars: SellerCarItem[] = seller.cars.map((c) => ({
    id: c.id,
    carNumber: c.carNumber,
    brand: c.brand,
    model: c.model,
    year: c.year,
    purchaseDate: c.purchaseDate.toISOString().slice(0, 10),
    purchasePrice: Number(c.purchasePrice),
    status: c.status,
  }));

  const kpis = calculateSellerKpis(seller.cars);

  return {
    id: seller.id,
    name: seller.name,
    phone: seller.phone,
    whatsapp: seller.whatsapp,
    emiratesId: seller.emiratesId,
    location: seller.location,
    notes: seller.notes,
    isActive: seller.isActive,
    createdAt: seller.createdAt.toISOString(),
    kpis,
    linkedCars,
  };
}

export async function checkDuplicateSellerPhone(
  phone: string,
  excludeSellerId?: string,
): Promise<{ exists: boolean; existingSeller?: { id: string; name: string; phone: string } }> {
  const cleanPhone = normalizePhoneNumber(phone);
  if (!cleanPhone || cleanPhone.length < 5) {
    return { exists: false };
  }

  const sellers = await db.seller.findMany({
    where: {
      phone: { not: null },
      ...(excludeSellerId ? { id: { not: excludeSellerId } } : {}),
    },
    select: { id: true, name: true, phone: true },
  });

  const match = sellers.find((s) => {
    const sClean = normalizePhoneNumber(s.phone);
    return sClean === cleanPhone;
  });

  if (match && match.phone) {
    return {
      exists: true,
      existingSeller: { id: match.id, name: match.name, phone: match.phone },
    };
  }

  return { exists: false };
}
