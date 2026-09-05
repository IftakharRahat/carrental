import type {
  StockCarItem,
  StockFilterCriteria,
  StockSummary,
} from "../domain/stock-types";

export type StockQueryResult = {
  items: StockCarItem[];
  summary: StockSummary;
};

export interface StockRepository {
  getStock(criteria?: StockFilterCriteria): Promise<StockQueryResult>;
}
