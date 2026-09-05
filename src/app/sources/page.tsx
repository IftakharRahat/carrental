import type { Metadata } from "next";
import { SourcesView } from "@/features/sources/components/sources-view";
import { getSourcesListPageData } from "@/features/sources/server/source-service";

export const metadata: Metadata = {
  title: "Sources | Car Scrap Business Management",
  description:
    "Track vehicle and lead origins across People, Online, and Offline channels with commission payout tracking.",
};

export default async function SourcesPage() {
  const { sources, overallKpis } = await getSourcesListPageData();

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <SourcesView
        initialSources={sources}
        initialOverallKpis={overallKpis}
      />
    </div>
  );
}
