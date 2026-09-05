export type CarFinancialStatus =
  "IN_STOCK" | "PARTIALLY_RECOVERED" | "COMPLETED";

export type CarFinancialInput = {
  purchaseFils: bigint;
  expenseFils: readonly bigint[];
  recoveryFils: readonly bigint[];
  status: CarFinancialStatus;
};

export type CarFinancialSummary = {
  investmentFils: bigint;
  recoveryFils: bigint;
  realizedProfitFils: bigint | null;
};

function sum(values: readonly bigint[]): bigint {
  return values.reduce((total, value) => total + value, 0n);
}

export function calculateCarFinancials(
  input: CarFinancialInput,
): CarFinancialSummary {
  const investmentFils = input.purchaseFils + sum(input.expenseFils);
  const recoveryFils = sum(input.recoveryFils);

  return {
    investmentFils,
    recoveryFils,
    realizedProfitFils:
      input.status === "COMPLETED" ? recoveryFils - investmentFils : null,
  };
}

export function calculateAvailableCash(
  openingCashFils: bigint,
  moneyInFils: readonly bigint[],
  moneyOutFils: readonly bigint[],
): bigint {
  return openingCashFils + sum(moneyInFils) - sum(moneyOutFils);
}

export function calculateNetBusinessProfit(
  completedCarProfitsFils: readonly bigint[],
  businessExpensesFils: readonly bigint[],
): bigint {
  return sum(completedCarProfitsFils) - sum(businessExpensesFils);
}
