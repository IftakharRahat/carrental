export type AnalyticsDatePreset =
  | "ALL_TIME"
  | "THIS_MONTH"
  | "LAST_3_MONTHS"
  | "THIS_YEAR"
  | "CUSTOM";

export type BrandAnalyticsRow = {
  brand: string;
  carsBought: number;
  carsCompleted: number;
  totalInvestment: number;
  totalRecovery: number;
  realizedCarProfit: number;
  averageRealizedCarProfit: number;
};

export type ConditionAnalyticsRow = {
  condition: string;
  conditionLabel: string;
  carsBought: number;
  carsCompleted: number;
  averageInvestment: number;
  averageRecovery: number;
  averageRealizedCarProfit: number;
  averageDaysInStock: number;
};

export type SourceAnalyticsRow = {
  sourceId: string | null;
  sourceName: string;
  sourceType: string;
  carsBought: number;
  carsCompleted: number;
  purchaseValue: number;
  commissionPaid: number;
  totalRecovery: number;
  realizedCarProfit: number;
  averageRealizedCarProfit: number;
};

export type BuyerCategoryAnalyticsRow = {
  category: string;
  transactionCount: number;
  totalAmount: number;
  averageTransaction: number;
};

export type TopBuyerAnalyticsRow = {
  buyerId: string;
  buyerName: string;
  companyName: string | null;
  buyerTypes: string[];
  totalPurchases: number;
  totalAmount: number;
  averageTransaction: number;
  lastPurchaseDate: string | null;
};

export type AnalyticsOverview = {
  totalCarsBought: number;
  totalCarsCompleted: number;
  totalInvestment: number;
  totalRecovery: number;
  totalRealizedProfit: number;
  avgProfitPerCompletedCar: number;
  avgDaysInStock: number;
};

export type BusinessAnalyticsData = {
  overview: AnalyticsOverview;
  brandAnalytics: BrandAnalyticsRow[];
  conditionAnalytics: ConditionAnalyticsRow[];
  sourceAnalytics: SourceAnalyticsRow[];
  buyerCategoryAnalytics: BuyerCategoryAnalyticsRow[];
  topBuyers: TopBuyerAnalyticsRow[];
  startDate: string | null;
  endDate: string | null;
};
