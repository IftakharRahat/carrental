import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionActor } from "@/lib/auth/actor";
import { BuyersView } from "@/features/buyers/components/buyers-view";
import { getBuyersListPageData } from "@/features/buyers/server/buyer-service";

export const metadata: Metadata = {
  title: "Buyers | Car Scrap Business",
  description: "Store whole-car and item buyers and analyze buyer activity.",
};

export default async function BuyersPage() {
  const actor = await getSessionActor();
  if (actor?.role === "VIEWER") {
    redirect("/dashboard");
  }

  const data = await getBuyersListPageData();

  return (
    <BuyersView
      initialBuyers={data.buyers}
      initialPageKpis={data.pageKpis}
      availableTypes={data.availableTypes}
    />
  );
}
