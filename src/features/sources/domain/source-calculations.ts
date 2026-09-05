import type {
  OverallSourcesKpis,
  SourceKpis,
} from "./source-types";

export function calculateSourceKpis(
  cars: Array<{ purchasePrice: number | string | { toString(): string }; purchaseDate: string | Date }>,
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
    lastDeal,
  };
}

export function calculateOverallSourcesKpis(
  sources: Array<{ isActive: boolean; kpis: SourceKpis }>,
): OverallSourcesKpis {
  let totalCarsBought = 0;
  let totalPurchaseValue = 0;
  let totalCommissionPaid = 0;
  let activeSources = 0;

  for (const src of sources) {
    if (src.isActive) {
      activeSources++;
    }
    totalCarsBought += src.kpis.carsBought;
    totalPurchaseValue += src.kpis.totalPurchaseValue;
    totalCommissionPaid += src.kpis.commissionPaid;
  }

  return {
    totalSources: sources.length,
    activeSources,
    totalCarsBought,
    totalPurchaseValue: Math.round(totalPurchaseValue * 100) / 100,
    totalCommissionPaid: Math.round(totalCommissionPaid * 100) / 100,
  };
}
