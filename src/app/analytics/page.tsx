import type { Metadata } from "next";

import { getSessionActor } from "@/lib/auth/actor";
import { AnalyticsView } from "@/features/analytics/components/analytics-view";
import { getBusinessAnalyticsPageData } from "@/features/analytics/server/analytics-service";

export const metadata: Metadata = {
  title: "Business Analytics | Car Scrap Business",
  description:
    "Analyze buying, recovery, and profitability performance across brands, conditions, sources, and buyers (Section 16).",
};

export default async function AnalyticsPage() {
  const actor = await getSessionActor();
  const isViewer = actor?.role === "VIEWER";

  const data = await getBusinessAnalyticsPageData();

  if (isViewer) {
    // Strip sensitive source and buyer information for Viewer role
    data.sourceAnalytics = [];
    data.buyerCategoryAnalytics = [];
    data.topBuyers = [];
  }

  return <AnalyticsView initialData={data} isViewer={isViewer} />;
}
