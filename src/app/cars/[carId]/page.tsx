import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CarDetailsHeader } from "@/features/cars/components/car-details-header";
import { CarKpiStrip } from "@/features/cars/components/car-kpi-strip";
import { CarDetailsTabs } from "@/features/cars/components/car-details-tabs";
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

  const car = await getCarDetails(carId);
  if (!car) notFound();

  const created = query.created === "1";

  return (
    <div className="space-y-6">
      {created && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950 shadow-xs">
          <p className="font-semibold">Car purchase saved successfully.</p>
          <p className="mt-1 text-emerald-900/80">
            The matching money-out transaction was created automatically in Finance.
          </p>
        </div>
      )}

      {/* 7.1 Header */}
      <CarDetailsHeader car={car} />

      {/* 7.2 KPI Strip */}
      <CarKpiStrip kpis={car.kpis} />

      {/* 7.3 Tabs & Details */}
      <CarDetailsTabs car={car} />
    </div>
  );
}
