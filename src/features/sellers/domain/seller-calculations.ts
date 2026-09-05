import type {
  OverallSellersKpis,
  SellerKpis,
} from "./seller-types";

export function calculateSellerKpis(
  cars: Array<{ purchasePrice: number | string | { toString(): string }; purchaseDate: string | Date }>,
): SellerKpis {
  const carsSoldToYou = cars.length;

  const totalAmount = cars.reduce((sum, car) => {
    const price = Number(car.purchasePrice?.toString() ?? 0);
    return sum + (Number.isFinite(price) ? price : 0);
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
    carsSoldToYou,
    totalAmount: Math.round(totalAmount * 100) / 100,
    lastDeal,
  };
}

export function calculateOverallSellersKpis(
  sellers: Array<{ isActive: boolean; kpis: SellerKpis }>,
): OverallSellersKpis {
  let totalCarsPurchased = 0;
  let totalSpend = 0;
  let activeSellers = 0;

  for (const s of sellers) {
    if (s.isActive) {
      activeSellers++;
    }
    totalCarsPurchased += s.kpis.carsSoldToYou;
    totalSpend += s.kpis.totalAmount;
  }

  const denominator = activeSellers > 0 ? activeSellers : 1;
  const avgCarsPerSeller =
    Math.round((totalCarsPurchased / denominator) * 10) / 10;

  return {
    totalSellers: sellers.length,
    activeSellers,
    totalCarsPurchased,
    totalSpend: Math.round(totalSpend * 100) / 100,
    avgCarsPerSeller,
  };
}
