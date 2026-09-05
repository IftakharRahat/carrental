import "server-only";

import { formatCarNumber, parseCarNumber } from "@/features/cars/domain/car-number";
import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";
import type { BuyerOption, SellCarSummary } from "../domain/sales-types";

export type SellPageData = {
  cars: SellCarSummary[];
  buyers: BuyerOption[];
  selectedCarId: string | null;
};

export async function getSellPageData(
  preselectedCarIdentifier?: string,
): Promise<SellPageData> {
  if (!isDatabaseConfigured()) {
    return { cars: [], buyers: [], selectedCarId: null };
  }

  const [carsFromDb, buyersFromDb] = await Promise.all([
    db.car.findMany({
      where: {
        status: { not: "VOIDED" },
      },
      include: {
        expenses: {
          where: { status: "ACTIVE" },
          select: { amount: true },
        },
        recoveries: {
          where: { status: "ACTIVE" },
          select: { amount: true },
        },
        recoveryItems: {
          select: { id: true, type: true, label: true, status: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ status: "asc" }, { carNumber: "desc" }],
    }),
    db.buyer.findMany({
      where: { isActive: true },
      include: {
        buyerTypes: {
          include: { buyerType: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const cars: SellCarSummary[] = carsFromDb.map((car) => {
    const purchasePrice = Number(car.purchasePrice);
    const totalExpenses = car.expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );
    const totalInvestment = purchasePrice + totalExpenses;
    const totalRecovery = car.recoveries.reduce(
      (sum, r) => sum + Number(r.amount),
      0,
    );

    const pendingItems = car.recoveryItems
      .filter((item) => item.status === "PENDING")
      .map((item) => ({
        id: item.id,
        type: item.type,
        label: item.label,
        status: item.status as "PENDING" | "SOLD" | "CLOSED",
      }));

    return {
      id: car.id,
      carNumber: formatCarNumber(car.carNumber),
      rawCarNumber: car.carNumber,
      brand: car.brand,
      model: car.model,
      year: car.year,
      condition: car.conditionOther || car.condition,
      status: car.status as "IN_STOCK" | "PARTIALLY_RECOVERED" | "COMPLETED" | "VOIDED",
      purchasePrice,
      totalExpenses,
      totalInvestment,
      totalRecovery,
      pendingItemsCount: pendingItems.length,
      pendingItems,
      mainPhotoUrl: car.mainPhotoUrl,
    };
  });

  let buyers: BuyerOption[] = buyersFromDb.map((b) => ({
    id: b.id,
    name: b.name,
    phone: b.phone,
    companyName: b.companyName,
    types: b.buyerTypes.map((bt) => bt.buyerType.name),
  }));

  if (buyers.length === 0) {
    try {
      const defaultBuyer = await db.buyer.create({
        data: {
          name: "Al Baraka Auto Salvage",
          phone: "+971 50 123 4567",
          companyName: "Al Baraka Scrap LLC",
          notes: "Default buyer",
        },
      });
      buyers = [
        {
          id: defaultBuyer.id,
          name: defaultBuyer.name,
          phone: defaultBuyer.phone,
          companyName: defaultBuyer.companyName,
          types: ["Scrap / Salvage"],
        },
      ];
    } catch {
      // ignore if creation fails
    }
  }

  let selectedCarId: string | null = null;
  if (preselectedCarIdentifier) {
    const parsedNum = parseCarNumber(preselectedCarIdentifier);
    const found = cars.find(
      (c) =>
        c.id === preselectedCarIdentifier ||
        (parsedNum !== null && c.rawCarNumber === parsedNum),
    );
    if (found) {
      selectedCarId = found.id;
    }
  }

  // If no car pre-selected, default to the first active car in stock if available
  if (!selectedCarId && cars.length > 0) {
    const activeCar = cars.find((c) => c.status !== "COMPLETED");
    selectedCarId = activeCar ? activeCar.id : cars[0].id;
  }

  return {
    cars,
    buyers,
    selectedCarId,
  };
}
