export type StockCarStatus = "IN_STOCK" | "PARTIALLY_RECOVERED" | "COMPLETED";

export type StockCarCondition =
  | "SCRAP"
  | "ACCIDENT_DAMAGED"
  | "ENGINE_ISSUE"
  | "GEARBOX_ISSUE"
  | "OTHER";

export type StockCarItem = {
  id: string;
  carNumber: string; // e.g. "CAR-0001"
  rawCarNumber: number;
  brand: string;
  model: string;
  year: number | null;
  condition: StockCarCondition;
  conditionOther: string | null;
  status: StockCarStatus;
  purchaseDate: string; // ISO date "YYYY-MM-DD"
  completionDate: string | null; // ISO date "YYYY-MM-DD"
  purchasePrice: number;
  totalExpenses: number;
  totalInvestment: number;
  recovery: number;
  pendingItemsCount: number | null; // null represents "N/A" (whole-car not yet dismantled)
  mainPhotoUrl: string | null;
  daysInStock: number;
  vinChassis: string | null;
  notes: string | null;
};

export type StockSummary = {
  activeCarsCount: number;
  stockValue: number;
  recoveredFromActiveStock: number;
};

export type StockFilterCriteria = {
  search?: string;
  condition?: string;
  status?: string;
  brand?: string;
  purchaseDateFrom?: string;
  purchaseDateTo?: string;
  daysInStockMin?: number;
  daysInStockMax?: number;
  includeCompleted?: boolean;
};
