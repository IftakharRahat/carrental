import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionActor } from "@/lib/auth/actor";

import { BuyCarForm } from "@/features/cars/components/buy-car-form";
import { getBusinessDate } from "@/features/cars/domain/car-input";
import { getBuyCarReferenceData } from "@/features/cars/server/reference-data";

export const metadata: Metadata = { title: "Buy Car" };
export const dynamic = "force-dynamic";

export default async function BuyCarPage() {
  const actor = await getSessionActor();
  if (actor?.role === "VIEWER") {
    redirect("/dashboard");
  }

  const references = await getBuyCarReferenceData();
  const timeZone = process.env.APP_TIMEZONE ?? "Asia/Dubai";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Buy Car</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-5">
          Create the initial purchase record. Add transport, labour, repairs and
          other car expenses later from Car Details.
        </p>
      </div>
      <BuyCarForm
        initialSellers={references.sellers}
        initialSources={references.sources}
        initialBrands={references.brands}
        purchaseDate={getBusinessDate(new Date(), timeZone)}
        idempotencyKey={crypto.randomUUID()}
      />
    </div>
  );
}
