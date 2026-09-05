import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { BuyCarForm } from "@/features/cars/components/buy-car-form";
import { getBusinessDate } from "@/features/cars/domain/car-input";
import { getBuyCarReferenceData } from "@/features/cars/server/reference-data";
import { isClerkConfigured, isDatabaseConfigured } from "@/lib/config-state";

export const metadata: Metadata = { title: "Buy Car" };

export default async function BuyCarPage() {
  const references = await getBuyCarReferenceData();
  const timeZone = process.env.APP_TIMEZONE ?? "Asia/Dubai";

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary" className="mb-3">
          Cars · Purchase
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Buy Car</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          Create the initial purchase record. Add transport, labour, repairs and
          other car expenses later from Car Details.
        </p>
      </div>
      <BuyCarForm
        initialSellers={references.sellers}
        initialSources={references.sources}
        purchaseDate={getBusinessDate(new Date(), timeZone)}
        idempotencyKey={crypto.randomUUID()}
        servicesReady={isDatabaseConfigured() && isClerkConfigured()}
      />
    </div>
  );
}
