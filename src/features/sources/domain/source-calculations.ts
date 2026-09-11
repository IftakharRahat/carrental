import type {
  OverallSourcesKpis,
  SourceKpis,
} from "./source-types";

export function calculateSourceKpis(
  cars: Array<{
    purchasePrice: number | string | { toString(): string };
    purchaseDate: string | Date;
    expenses?: Array<{ amount: number | string | { toString(): string } }>;
    recoveries?: Array<{ amount: number | string | { toString(): string } }>;
  }>,
  commissions: Array<{ amount: number | string | { toString(): string } }>,
): SourceKpis {
  const carsBought = cars.length;
  const totalLeads = carsBought; // In V1, leads equals sourced car count per Section 9.2

  const totalPurchaseValue = cars.reduce((sum, car) => {
    const price = Number(car.purchasePrice?.toString() ?? 0);
    return sum + (Number.isFinite(price) ? price : 0);
  }, 0);

  const commissionPaid = commissions.reduce((sum, comm) => {
    const amt = Number(comm.amount?.toString() ?? 0);
    return sum + (Number.isFinite(amt) ? amt : 0);
  }, 0);

  // Calculate total profit from linked cars: recoveries - (purchasePrice + expenses)
  let totalProfit = 0;
  for (const car of cars) {
    const purchasePrice = Number(car.purchasePrice?.toString() ?? 0);
    const carExpenses = (car.expenses ?? []).reduce(
      (s, e) => s + Number(e.amount?.toString() ?? 0),
      0,
    );
    const carRecoveries = (car.recoveries ?? []).reduce(
      (s, r) => s + Number(r.amount?.toString() ?? 0),
      0,
    );
    const investment = purchasePrice + carExpenses;
    totalProfit += carRecoveries - investment;
  }

  const avgProfitPerCar =
    carsBought > 0 ? Math.round((totalProfit / carsBought) * 100) / 100 : 0;

  let lastDeal: string | null = null;
  if (cars.length > 0) {
    const sorted = [...cars].sort((a, b) => {
      const dateA = new Date(a.purchaseDate).getTime();
      const dateB = new Date(b.purchaseDate).getTime();
      return dateB - dateA;
    });
    const latest = sorted[0];
    if (latest) {
      lastDeal =
        typeof latest.purchaseDate === "string"
          ? latest.purchaseDate.slice(0, 10)
          : latest.purchaseDate.toISOString().slice(0, 10);
    }
  }

  return {
    totalLeads,
    carsBought,
    totalPurchaseValue: Math.round(totalPurchaseValue * 100) / 100,
    commissionPaid: Math.round(commissionPaid * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    avgProfitPerCar,
    lastDeal,
  };
}

export function calculateOverallSourcesKpis(
  sources: Array<{
    id?: string;
    name: string;
    type?: string;
    typeLabel?: string;
    category?: string;
    isActive: boolean;
    kpis: SourceKpis;
  }>,
): OverallSourcesKpis {
  let totalCarsBought = 0;
  let totalPurchaseValue = 0;
  let totalCommissionPaid = 0;
  let totalProfit = 0;
  let activeSources = 0;

  const typeMap = new Map<string, { label: string; count: number; value: number }>();

  for (const src of sources) {
    if (src.isActive) {
      activeSources++;
    }
    totalCarsBought += src.kpis.carsBought;
    totalPurchaseValue += src.kpis.totalPurchaseValue;
    totalCommissionPaid += src.kpis.commissionPaid;
    totalProfit += src.kpis.totalProfit || 0;

    // Track by subcategory/type label
    const key = src.typeLabel || src.name;
    const existing = typeMap.get(key) || { label: key, count: 0, value: 0 };
    existing.count += src.kpis.carsBought;
    existing.value += src.kpis.totalPurchaseValue;
    typeMap.set(key, existing);
  }

  // Find top source
  let topSource = "None yet";
  let topSourceType = "";
  let maxCars = 0;
  let maxValue = 0;

  for (const [, data] of typeMap.entries()) {
    if (
      data.count > maxCars ||
      (data.count === maxCars && data.value > maxValue && data.value > 0)
    ) {
      maxCars = data.count;
      maxValue = data.value;
      topSourceType = data.label;
      topSource = `${data.label} (${data.count} car${data.count === 1 ? "" : "s"})`;
    }
  }

  if (maxCars === 0 && sources.length > 0) {
    topSource = sources[0].typeLabel || sources[0].name;
    topSourceType = topSource;
  }

  const avgProfitFromSource =
    totalCarsBought > 0 ? Math.round(totalProfit / totalCarsBought) : 0;

  const repeatDealFrequency =
    sources.length > 0
      ? Math.round((totalCarsBought / sources.length) * 10) / 10
      : 0;

  return {
    totalSources: sources.length,
    activeSources,
    totalCarsBought,
    totalPurchaseValue: Math.round(totalPurchaseValue * 100) / 100,
    totalCommissionPaid: Math.round(totalCommissionPaid * 100) / 100,
    topSource,
    topSourceType,
    avgProfitFromSource,
    repeatDealFrequency,
  };
}
