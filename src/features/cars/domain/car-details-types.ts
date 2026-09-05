export type CarCondition =
  | "SCRAP"
  | "ACCIDENT_DAMAGED"
  | "ENGINE_ISSUE"
  | "GEARBOX_ISSUE"
  | "OTHER";

export type CarStatus = "IN_STOCK" | "PARTIALLY_RECOVERED" | "COMPLETED" | "VOIDED";

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CHEQUE" | "OTHER";

export type CarExpenseCategory =
  | "TRANSPORT"
  | "LABOUR"
  | "PARTS"
  | "REPAIR"
  | "RTA_DOCUMENTATION"
  | "OTHER";

export type RecoveryMode = "WHOLE_CAR" | "ITEM";

export type RecoveryItemType =
  | "ENGINE"
  | "BODY"
  | "GEARBOX"
  | "COPPER"
  | "PARTS"
  | "OTHER";

export type RecoveryItemStatus = "PENDING" | "SOLD" | "CLOSED";

export type CarKpis = {
  purchase: number;
  expenses: number;
  investment: number;
  recovery: number;
  realizedProfit: number | null;
  isProfitPending: boolean;
};

export type CarExpenseRecord = {
  id: string;
  carId: string;
  expenseDate: string; // "YYYY-MM-DD"
  category: CarExpenseCategory;
  categoryOther: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  notes: string | null;
  status: "ACTIVE" | "VOIDED";
};

export type CarRecoveryRecord = {
  id: string;
  carId: string;
  buyerId: string;
  buyerName: string;
  mode: RecoveryMode;
  itemType: RecoveryItemType | null;
  itemLabel: string | null;
  saleDate: string; // "YYYY-MM-DD"
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  status: "ACTIVE" | "VOIDED";
};

export type CarRecoveryItemProgress = {
  id: string;
  type: RecoveryItemType;
  label: string | null;
  status: RecoveryItemStatus;
  amount: number | null;
  buyerName: string | null;
  saleDate: string | null;
};

export type CarActivityEvent = {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "PURCHASE" | "EXPENSE" | "RECOVERY" | "STATUS_CHANGE" | "OTHER";
  amount?: number;
};

export type CarPhotoItem = {
  id: string;
  pathname: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  isMain: boolean;
  uploadedAt: string;
};

export type CarDetailsFull = {
  id: string;
  carNumber: string; // e.g. "CAR-0025"
  rawCarNumber: number;
  brand: string;
  model: string;
  year: number | null;
  condition: CarCondition;
  conditionOther: string | null;
  status: CarStatus;
  purchaseDate: string;
  completionDate: string | null;
  purchasePrice: number;
  paymentMethod: PaymentMethod;
  vinChassis: string | null;
  notes: string | null;
  seller: {
    id: string;
    name: string;
    phone: string | null;
  };
  source: {
    id: string;
    name: string;
    type: string;
  } | null;
  kpis: CarKpis;
  expenses: CarExpenseRecord[];
  recoveries: CarRecoveryRecord[];
  recoveryProgress: CarRecoveryItemProgress[];
  activities: CarActivityEvent[];
  photos: CarPhotoItem[];
};
