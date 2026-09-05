import type { Metadata } from "next";
import { SellersView } from "@/features/sellers/components/sellers-view";
import { getSellersListPageData } from "@/features/sellers/server/seller-service";

export const metadata: Metadata = {
  title: "Sellers | Car Scrap Business Management",
  description:
    "Database of legal vehicle owners and sellers with transaction history and duplicate phone protection.",
};

export default async function SellersPage() {
  const { sellers, overallKpis } = await getSellersListPageData();

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <SellersView
        initialSellers={sellers}
        initialOverallKpis={overallKpis}
      />
    </div>
  );
}
