import type { Metadata } from "next";

import { getSessionActor } from "@/lib/auth/actor";
import { FinanceView } from "@/features/finance/components/finance-view";
import { getFinanceLedgerData } from "@/features/finance/server/finance-service";

export const metadata: Metadata = {
  title: "Finance & Cash Flow | Car Scrap Business",
  description:
    "Single ledger-based view of money entering and leaving the business.",
};

export default async function FinancePage() {
  const actor = await getSessionActor();
  const isViewer = actor?.role === "VIEWER";

  const data = await getFinanceLedgerData();

  if (isViewer) {
    data.rows = data.rows.map((row) => ({
      ...row,
      description: row.description
        .replace(/(sale to|sold to)\s+[^\s,]+(?:\s+[^\s,]+)?/i, "$1 [Protected Buyer]")
        .replace(/(commission (?:paid )?to)\s+[^\s,:]+(?:\s+[^\s,:]+)?/i, "$1 [Protected Source]"),
    }));
  }

  return (
    <FinanceView
      initialRows={data.rows}
      initialSummary={data.summary}
      customCategories={data.customCategories}
      availableCars={data.availableCars}
      isViewer={isViewer}
    />
  );
}
