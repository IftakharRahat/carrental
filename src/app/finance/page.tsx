import type { Metadata } from "next";

import { FinanceView } from "@/features/finance/components/finance-view";
import { getFinanceLedgerData } from "@/features/finance/server/finance-service";

export const metadata: Metadata = {
  title: "Finance & Cash Flow | Car Scrap Business",
  description:
    "Single ledger-based view of money entering and leaving the business.",
};

export default async function FinancePage() {
  const data = await getFinanceLedgerData();

  return (
    <FinanceView
      initialRows={data.rows}
      initialSummary={data.summary}
      customCategories={data.customCategories}
      availableCars={data.availableCars}
    />
  );
}
