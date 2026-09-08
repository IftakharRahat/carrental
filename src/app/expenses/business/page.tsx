import type { Metadata } from "next";

import { BusinessExpensesView } from "@/features/expenses/components/business-expenses-view";
import { getBusinessExpensesPageData } from "@/features/expenses/server/business-expense-service";

export const metadata: Metadata = {
  title: "Business Expenses | Car Scrap Business",
  description:
    "Capture general business overheads not attributable to one specific car.",
};

export default async function BusinessExpensesPage() {
  const data = await getBusinessExpensesPageData();

  return (
    <BusinessExpensesView
      initialExpenses={data.expenses}
      initialPageKpis={data.pageKpis}
    />
  );
}
