import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionActor } from "@/lib/auth/actor";

import { SellRecoveryView } from "@/features/sales/components/sell-recovery-view";
import { getSellPageData } from "@/features/sales/server/sales-service";

export const metadata: Metadata = {
  title: "Sell / Recovery | Car Scrap Business",
  description: "Record whole-car sales or dismantled item recoveries.",
};

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getSessionActor();
  if (actor?.role === "VIEWER") {
    redirect("/dashboard");
  }

  const query = await searchParams;
  const carParam =
    typeof query.carId === "string"
      ? query.carId
      : typeof query.car === "string"
        ? query.car
        : undefined;

  const data = await getSellPageData(carParam);

  return (
    <SellRecoveryView
      cars={data.cars}
      initialBuyers={data.buyers}
      preselectedCarId={data.selectedCarId}
      initialCustomItems={data.customItems}
    />
  );
}
