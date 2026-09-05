import "server-only";

import { formatCarNumber, parseCarNumber } from "@/features/cars/domain/car-number";
import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";
import { calculateCarKpis } from "../domain/car-details-calculations";
import type {
  CarActivityEvent,
  CarDetailsFull,
  CarExpenseRecord,
  CarPhotoItem,
  CarRecoveryItemProgress,
  CarRecoveryRecord,
} from "../domain/car-details-types";

export async function getCarDetails(
  identifier: string | number,
): Promise<CarDetailsFull | null> {
  if (!isDatabaseConfigured()) return null;

  const parsedNum =
    typeof identifier === "number"
      ? identifier
      : parseCarNumber(identifier);

  const where = parsedNum
    ? { carNumber: parsedNum }
    : { id: String(identifier) };

  const car = await db.car.findFirst({
    where,
    include: {
      seller: true,
      source: true,
      expenses: {
        orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
      },
      recoveries: {
        include: { buyer: true },
        orderBy: [{ saleDate: "desc" }, { createdAt: "desc" }],
      },
      recoveryItems: {
        orderBy: { createdAt: "asc" },
      },
      attachments: {
        orderBy: [{ isMain: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!car) return null;

  const purchasePrice = Number(car.purchasePrice);

  const expenses: CarExpenseRecord[] = car.expenses.map((exp) => ({
    id: exp.id,
    carId: exp.carId,
    expenseDate: exp.expenseDate.toISOString().split("T")[0],
    category: exp.category,
    categoryOther: exp.categoryOther,
    amount: Number(exp.amount),
    paymentMethod: exp.paymentMethod,
    description: exp.description,
    notes: exp.notes,
    status: exp.status as "ACTIVE" | "VOIDED",
  }));

  const recoveries: CarRecoveryRecord[] = car.recoveries.map((rec) => ({
    id: rec.id,
    carId: rec.carId,
    buyerId: rec.buyerId,
    buyerName: rec.buyer.name,
    mode: rec.mode,
    itemType: rec.itemType,
    itemLabel: rec.itemLabel,
    saleDate: rec.saleDate.toISOString().split("T")[0],
    amount: Number(rec.amount),
    paymentMethod: rec.paymentMethod,
    notes: rec.notes,
    status: rec.status as "ACTIVE" | "VOIDED",
  }));

  const kpis = calculateCarKpis({
    status: car.status,
    purchasePrice,
    expenses,
    recoveries,
  });

  // Map recovery items progress (Section 7.5)
  const recoveryProgress: CarRecoveryItemProgress[] = car.recoveryItems.map(
    (item) => {
      // Find matching recovery transaction if sold
      const matchedTx = recoveries.find(
        (r) => r.itemType === item.type && r.status === "ACTIVE",
      );

      return {
        id: item.id,
        type: item.type,
        label: item.label,
        status: item.status,
        amount: matchedTx ? matchedTx.amount : null,
        buyerName: matchedTx ? matchedTx.buyerName : null,
        saleDate: matchedTx ? matchedTx.saleDate : null,
      };
    },
  );

  // Photos
  const photos: CarPhotoItem[] = car.attachments
    .filter((att) => att.kind === "PHOTO")
    .map((photo) => ({
      id: photo.id,
      pathname: photo.pathname,
      url: photo.pathname,
      contentType: photo.contentType,
      sizeBytes: photo.sizeBytes,
      isMain: photo.isMain,
      uploadedAt: photo.createdAt.toISOString(),
    }));

  // If car has mainPhotoUrl but no attachment record, provide it
  if (car.mainPhotoUrl && !photos.some((p) => p.url === car.mainPhotoUrl)) {
    photos.unshift({
      id: `main-${car.id}`,
      pathname: car.mainPhotoUrl,
      url: car.mainPhotoUrl,
      contentType: "image/jpeg",
      sizeBytes: 0,
      isMain: true,
      uploadedAt: car.createdAt.toISOString(),
    });
  }

  // Activities timeline
  const activities: CarActivityEvent[] = [
    {
      id: `purchase-${car.id}`,
      date: car.purchaseDate.toISOString().split("T")[0],
      title: "Vehicle Purchased",
      description: `Purchased from ${car.seller.name} for AED ${purchasePrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`,
      type: "PURCHASE",
      amount: purchasePrice,
    },
  ];

  for (const exp of expenses) {
    activities.push({
      id: `expense-${exp.id}`,
      date: exp.expenseDate,
      title: `Expense Added: ${exp.description}`,
      description: `Category: ${exp.category} · Method: ${exp.paymentMethod} · Status: ${exp.status}`,
      type: "EXPENSE",
      amount: exp.amount,
    });
  }

  for (const rec of recoveries) {
    activities.push({
      id: `recovery-${rec.id}`,
      date: rec.saleDate,
      title: `Recovery Sale to ${rec.buyerName}`,
      description: `Mode: ${rec.mode}${rec.itemType ? ` · Item: ${rec.itemType}` : ""} · Status: ${rec.status}`,
      type: "RECOVERY",
      amount: rec.amount,
    });
  }

  if (car.completionDate) {
    activities.push({
      id: `completed-${car.id}`,
      date: car.completionDate.toISOString().split("T")[0],
      title: "Vehicle Completed",
      description: "Inventory cycle closed.",
      type: "STATUS_CHANGE",
    });
  }

  // Sort activities newest first
  activities.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return {
    id: car.id,
    carNumber: formatCarNumber(car.carNumber),
    rawCarNumber: car.carNumber,
    brand: car.brand,
    model: car.model,
    year: car.year,
    condition: car.condition,
    conditionOther: car.conditionOther,
    status: car.status,
    purchaseDate: car.purchaseDate.toISOString().split("T")[0],
    completionDate: car.completionDate
      ? car.completionDate.toISOString().split("T")[0]
      : null,
    purchasePrice,
    paymentMethod: car.paymentMethod,
    vinChassis: car.vinChassis,
    notes: car.notes,
    seller: {
      id: car.seller.id,
      name: car.seller.name,
      phone: car.seller.phone,
    },
    source: car.source
      ? {
          id: car.source.id,
          name: car.source.name,
          type: car.source.type,
        }
      : null,
    kpis,
    expenses,
    recoveries,
    recoveryProgress,
    activities,
    photos,
  };
}

export const getCarDetailsByNumber = (carNumber: number) =>
  getCarDetails(carNumber);

export async function getCustomExpenseCategories(): Promise<string[]> {
  if (!isDatabaseConfigured()) return [];

  const records = await db.customExpenseCategory.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });

  return records.map((r) => r.name);
}
