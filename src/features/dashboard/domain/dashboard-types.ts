export type OverallKpiMetrics = {
  totalCapital: number;
  availableCash: number;
  stockCars: number;
  stockValue: number;
  totalCarsBought: number;
  totalCarsCompleted: number;
  totalRealizedRecovery: number;
  totalCarExpenses: number;
  totalBusinessExpenses: number;
  realizedCarProfit: number;
  netBusinessProfit: number;
};

export type ThisMonthMetrics = {
  carsBought: number;
  carsCompleted: number;
  purchaseAmount: number;
  carExpenses: number;
  businessExpenses: number;
  totalRecovery: number;
  realizedCarProfit: number;
  netBusinessProfit: number;
  closingStockCars: number;
  closingStockValue: number;
  closingCash: number;
};

export type ActiveCarOption = {
  id: string;
  carNumber: number;
  brand: string;
  model: string;
  year?: number | null;
  status: string;
  purchasePrice: number;
  expensesTotal: number;
  recoveryTotal: number;
};

export type DashboardViewData = {
  overall: OverallKpiMetrics;
  thisMonth: ThisMonthMetrics;
  currentMonthLabel: string;
  currentYear: number;
  currentMonth: number;
  lastRefreshedAt: string;
  activeCars: ActiveCarOption[];
  hasAnyData: boolean;
};
