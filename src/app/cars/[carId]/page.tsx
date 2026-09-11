import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionActor } from "@/lib/auth/actor";
import { CarDetailsHeader } from "@/features/cars/components/car-details-header";
import { CarKpiStrip } from "@/features/cars/components/car-kpi-strip";
import { CarDetailsTabs } from "@/features/cars/components/car-details-tabs";
import { PurchaseReceiptDialog } from "@/features/cars/components/purchase-receipt-dialog";
import { getCarDetails } from "@/features/cars/server/car-details-service";
import { isDatabaseConfigured } from "@/lib/config-state";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ carId: string }>;
}): Promise<Metadata> {
  const { carId } = await params;
  return {
    title: `${carId} Details`,
    description: `Complete financial and operational history of vehicle ${carId}.`,
  };
}

export default async function CarDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ carId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ carId }, query] = await Promise.all([params, searchParams]);

  if (!isDatabaseConfigured()) notFound();

  const actor = await getSessionActor();
  const isViewer = actor?.role === "VIEWER";

  const car = await getCarDetails(carId);
  if (!car) notFound();

  if (isViewer) {
    // Mask source and buyer details for Viewer
    car.source = null;
    car.recoveries = car.recoveries.map((rec) => ({
      ...rec,
      buyerName: "[Protected Buyer]",
    }));
    car.recoveryProgress = car.recoveryProgress.map((p) => ({
      ...p,
      buyerName: p.buyerName ? "[Protected Buyer]" : null,
    }));
    car.activities = car.activities.map((act) => ({
      ...act,
      title: act.title.replace(/to [^,]+/i, "to [Protected Buyer]"),
    }));
  }

  const created = query.created === "1";

  return (
    <div className="space-y-6">
      {created && !isViewer && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-semibold text-emerald-950">Car purchase saved successfully.</p>
            <p className="mt-0.5 text-xs text-emerald-900/80">
              The matching money-out transaction was created automatically in Finance.
            </p>
          </div>
          <div className="shrink-0">
            <PurchaseReceiptDialog
              car={car}
              isViewer={isViewer}
              triggerText="Print Seller Receipt"
              triggerVariant="default"
            />
          </div>
        </div>
      )}

      {/* 7.1 Header */}
      <CarDetailsHeader car={car} isViewer={isViewer} />

      {/* 7.2 KPI Strip */}
      <CarKpiStrip kpis={car.kpis} />

      {/* 7.3 Tabs & Details */}
      <CarDetailsTabs car={car} isViewer={isViewer} />
    </div>
  );
}
