import type { Metadata } from "next";

import { MonthlyReportView } from "@/features/reports/components/monthly-report-view";
import { getMonthlyReportData } from "@/features/reports/server/monthly-report-service";

export const metadata: Metadata = {
  title: "Monthly Report | Car Scrap Business",
  description:
    "View each month separately and preserve month-end business snapshots (Section 15).",
};

type MonthlyReportPageProps = {
  searchParams?: Promise<{
    year?: string;
    month?: string;
  }>;
};

export default async function MonthlyReportPage({
  searchParams,
}: MonthlyReportPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const year = resolvedParams?.year ? parseInt(resolvedParams.year, 10) : undefined;
  const month = resolvedParams?.month ? parseInt(resolvedParams.month, 10) : undefined;

  const data = await getMonthlyReportData(year, month);

  return <MonthlyReportView data={data} />;
}
