import "server-only";

import { db } from "@/lib/db";
import {
  calculateOverallSourcesKpis,
  calculateSourceKpis,
} from "../domain/source-calculations";
import {
  getSourceCategory,
  getSourceTypeLabel,
  type OverallSourcesKpis,
  type SourcedCarItem,
  type SourceCommissionItem,
  type SourceProfileData,
  type SourceRowData,
  type SourceType,
} from "../domain/source-types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getSourcesListPageData(): Promise<{
  sources: SourceRowData[];
  overallKpis: OverallSourcesKpis;
}> {
  const [rawSources, commissionTransactions] = await Promise.all([
    db.source.findMany({
      orderBy: { name: "asc" },
      include: {
        cars: {
          select: {
            id: true,
            purchasePrice: true,
            purchaseDate: true,
          },
        },
      },
    }),
    db.cashTransaction.findMany({
      where: {
        category: "COMMISSION",
        referenceType: "SOURCE_COMMISSION",
        status: "ACTIVE",
      },
      select: {
        amount: true,
        referenceId: true,
      },
    }),
  ]);

  // Group commission transactions by sourceId
  const commissionsBySource = new Map<string, Array<{ amount: string | number }>>();
  for (const comm of commissionTransactions) {
    const sourceId = comm.referenceId.split(":")[0];
    if (sourceId) {
      const existing = commissionsBySource.get(sourceId) ?? [];
      existing.push({ amount: comm.amount.toString() });
      commissionsBySource.set(sourceId, existing);
    }
  }

  const sources: SourceRowData[] = rawSources.map((s) => {
    const sourceComms = commissionsBySource.get(s.id) ?? [];
    const kpis = calculateSourceKpis(s.cars, sourceComms);
    const category = getSourceCategory(s.type);
    const typeLabel = getSourceTypeLabel(s.type);

    return {
      id: s.id,
      name: s.name,
      type: s.type as SourceType,
      typeLabel,
      category,
      categoryLabel: category.charAt(0) + category.slice(1).toLowerCase(),
      phone: s.phone,
      whatsapp: s.whatsapp,
      location: s.location,
      notes: s.notes,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      kpis,
    };
  });

  const overallKpis = calculateOverallSourcesKpis(sources);

  return { sources, overallKpis };
}

export async function getSourceProfileData(
  sourceId: string,
): Promise<SourceProfileData | null> {
  if (!UUID_REGEX.test(sourceId)) {
    return null;
  }

  const [source, commissionTransactions] = await Promise.all([
    db.source.findUnique({
      where: { id: sourceId },
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
    }),
    db.cashTransaction.findMany({
      where: {
        category: "COMMISSION",
        referenceType: "SOURCE_COMMISSION",
        referenceId: { startsWith: `${sourceId}:` },
        status: "ACTIVE",
      },
      include: {
        car: {
          select: {
            id: true,
            carNumber: true,
            brand: true,
            model: true,
          },
        },
      },
      orderBy: { transactionDate: "desc" },
    }),
  ]);

  if (!source) {
    return null;
  }

  const linkedCars: SourcedCarItem[] = source.cars.map((c) => ({
    id: c.id,
    carNumber: c.carNumber,
    brand: c.brand,
    model: c.model,
    year: c.year,
    purchaseDate: c.purchaseDate.toISOString().slice(0, 10),
    purchasePrice: Number(c.purchasePrice),
    status: c.status,
  }));

  const commissions: SourceCommissionItem[] = commissionTransactions.map((comm) => ({
    id: comm.id,
    transactionDate: comm.transactionDate.toISOString().slice(0, 10),
    amount: Number(comm.amount),
    paymentMethod: comm.paymentMethod,
    description: comm.description,
    carId: comm.carId,
    carNumber: comm.car?.carNumber,
    carName: comm.car ? `${comm.car.brand} ${comm.car.model}` : null,
  }));

  const kpis = calculateSourceKpis(
    source.cars,
    commissionTransactions.map((c) => ({ amount: c.amount.toString() })),
  );

  const category = getSourceCategory(source.type);
  const typeLabel = getSourceTypeLabel(source.type);

  return {
    id: source.id,
    name: source.name,
    type: source.type as SourceType,
    typeLabel,
    category,
    categoryLabel: category.charAt(0) + category.slice(1).toLowerCase(),
    phone: source.phone,
    whatsapp: source.whatsapp,
    location: source.location,
    notes: source.notes,
    isActive: source.isActive,
    createdAt: source.createdAt.toISOString(),
    kpis,
    linkedCars,
    commissions,
  };
}

export async function getCarsForSourceCommission(sourceId: string) {
  return db.car.findMany({
    where: {
      OR: [{ sourceId }, { status: { not: "VOIDED" } }],
    },
    select: {
      id: true,
      carNumber: true,
      brand: true,
      model: true,
      year: true,
    },
    orderBy: { carNumber: "desc" },
    take: 50,
  });
}
