import type { Metadata } from "next";

import { ExpenseDetailsView } from "@/features/expenses/components/expense-details-view";
import { getExpenseDetailsPageData } from "@/features/expenses/server/expense-details-service";

export const metadata: Metadata = {
  title: "Expense Details | Car Scrap Business",
  description:
    "Combined transaction-level reporting for car expenses and business overheads.",
};

export default async function ExpenseDetailsPage() {
  const data = await getExpenseDetailsPageData();

  return (
    <ExpenseDetailsView
      initialRows={data.rows}
      availableCategories={data.availableCategories}
    />
  );
}
