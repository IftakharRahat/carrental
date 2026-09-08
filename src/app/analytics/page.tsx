import type { Metadata } from "next";

import { AnalyticsView } from "@/features/analytics/components/analytics-view";
import { getBusinessAnalyticsPageData } from "@/features/analytics/server/analytics-service";

export const metadata: Metadata = {
  title: "Business Analytics | Car Scrap Business",
  description:
    "Analyze buying, recovery, and profitability performance across brands, conditions, sources, and buyers (Section 16).",
};

export default async function AnalyticsPage() {
  const data = await getBusinessAnalyticsPageData();

  return <AnalyticsView initialData={data} />;
}
