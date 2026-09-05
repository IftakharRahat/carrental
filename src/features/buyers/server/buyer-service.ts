import "server-only";

import { formatCarNumber } from "@/features/cars/domain/car-number";
import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";
import {
  calculateBuyerKpis,
  calculateOverallBuyersKpis,
} from "../domain/buyer-calculations";
import type {
  BuyerListItem,
  BuyerProfileDetail,
  BuyersPageKpis,
  BuyerTransactionRecord,
  BuyerTypeOption,
} from "../domain/buyer-types";
import { STANDARD_BUYER_TYPES } from "../domain/buyer-types";

/**
 * Ensures the standard Section 11.1 buyer types exist in the database.
 */
export async function ensureStandardBuyerTypes(): Promise<BuyerTypeOption[]> {
  if (!isDatabaseConfigured()) return [];

  const existingTypes = await db.buyerType.findMany({
    orderBy: { name: "asc" },
  });

  const existingNames = new Set(existingTypes.map((t) => t.name));
  const missing = STANDARD_BUYER_TYPES.filter((name) => !existingNames.has(name));

  if (missing.length > 0) {
    await Promise.all(
      missing.map((name) =>
        db.buyerType.upsert({
          where: { name },
          update: {},
          create: { name },
        }),
      ),
    );

    return db.buyerType.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  }

  return existingTypes.map((t) => ({ id: t.id, name: t.name }));
}

export type BuyersListPageData = {
  buyers: BuyerListItem[];
  pageKpis: BuyersPageKpis;
  availableTypes: BuyerTypeOption[];
};

/**
 * Queries all buyers with aggregated recovery transactions and multi-category assignments.
 */
export async function getBuyersListPageData(): Promise<BuyersListPageData> {
  if (!isDatabaseConfigured()) {
    return {
      buyers: [],
      pageKpis: {
        totalBuyers: 0,
        activeBuyers: 0,
        totalRecoveredAmount: 0,
        averagePurchasePerBuyer: 0,
      },
      availableTypes: [],
    };
  }

  const [availableTypes, buyersFromDb] = await Promise.all([
    ensureStandardBuyerTypes(),
    db.buyer.findMany({
      include: {
        buyerTypes: {
          include: { buyerType: true },
        },
        recoveryTransactions: {
          select: {
            amount: true,
            saleDate: true,
            status: true,
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
  ]);

  const buyers: BuyerListItem[] = buyersFromDb.map((b) => {
    const rawTransactions = b.recoveryTransactions.map((t) => ({
      amount: Number(t.amount),
      saleDate: t.saleDate.toISOString().split("T")[0],
      status: t.status,
    }));

    const kpis = calculateBuyerKpis(rawTransactions);

    return {
      id: b.id,
      name: b.name,
      companyName: b.companyName,
      phone: b.phone,
      whatsapp: b.whatsapp,
      location: b.location,
      notes: b.notes,
      isActive: b.isActive,
      types: b.buyerTypes.map((bt) => ({
        id: bt.buyerType.id,
        name: bt.buyerType.name,
      })),
      kpis,
      createdAt: b.createdAt.toISOString(),
    };
  });

  const pageKpis = calculateOverallBuyersKpis(buyers);

  return {
    buyers,
    pageKpis,
    availableTypes,
  };
}

/**
 * Queries complete buyer profile detail including transaction history (Section 11.3).
 */
export async function getBuyerProfileData(
  buyerId: string,
): Promise<BuyerProfileDetail | null> {
  if (!isDatabaseConfigured()) return null;

  const b = await db.buyer.findUnique({
    where: { id: buyerId },
    include: {
      buyerTypes: {
        include: { buyerType: true },
      },
      recoveryTransactions: {
        include: { car: true },
        orderBy: [{ saleDate: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!b) return null;

  const rawTransactions = b.recoveryTransactions.map((t) => ({
    amount: Number(t.amount),
    saleDate: t.saleDate.toISOString().split("T")[0],
    status: t.status,
  }));

  const kpis = calculateBuyerKpis(rawTransactions);

  const transactions: BuyerTransactionRecord[] = b.recoveryTransactions.map(
    (t) => ({
      id: t.id,
      carId: t.carId,
      carNumber: formatCarNumber(t.car.carNumber),
      carName: `${t.car.brand} ${t.car.model}${t.car.year ? ` - ${t.car.year}` : ""}`,
      mode: t.mode,
      itemType: t.itemType,
      itemLabel: t.itemLabel,
      saleDate: t.saleDate.toISOString().split("T")[0],
      amount: Number(t.amount),
      paymentMethod: t.paymentMethod,
      notes: t.notes,
      status: t.status,
    }),
  );

  return {
    id: b.id,
    name: b.name,
    companyName: b.companyName,
    phone: b.phone,
    whatsapp: b.whatsapp,
    location: b.location,
    notes: b.notes,
    isActive: b.isActive,
    types: b.buyerTypes.map((bt) => ({
      id: bt.buyerType.id,
      name: bt.buyerType.name,
    })),
    kpis,
    transactions,
    createdAt: b.createdAt.toISOString(),
  };
}
