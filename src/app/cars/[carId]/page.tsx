import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleDollarSign, Plus, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseCarNumber } from "@/features/cars/domain/car-number";
import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Car Details" };

export default async function CarDetailsPage({
  params,
  searchParams,
}: PageProps<"/cars/[carId]">) {
  const [{ carId }, query] = await Promise.all([params, searchParams]);
  const carNumber = parseCarNumber(carId);

  if (!carNumber || !isDatabaseConfigured()) notFound();

  const car = await db.car.findUnique({
    where: { carNumber },
    include: { seller: true, source: true },
  });
  if (!car) notFound();

  const purchasePrice = car.purchasePrice.toString();
  const created = query.created === "1";

  return (
    <div className="space-y-6">
      {created && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950">
          <p className="font-medium">Car purchase saved successfully.</p>
          <p className="mt-1 text-emerald-900/80">The matching money-out transaction was created automatically.</p>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-3">CAR-{String(car.carNumber).padStart(4, "0")}</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">{car.brand} {car.model}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Purchased {car.purchaseDate.toLocaleDateString("en-AE", { dateStyle: "medium", timeZone: "UTC" })} from {car.seller.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href={`/cars/${carId}/expenses/new`} />}>
            <Plus /> Add Expense
          </Button>
          <Button variant="outline" render={<Link href={`/sales/new?car=${carId}`} />}>
            <Wrench /> Sell / Recovery
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Purchase price" value={formatAed(purchasePrice)} />
        <Metric title="Car expenses" value="AED 0.00" />
        <Metric title="Initial investment" value={formatAed(purchasePrice)} emphasized />
      </div>

      <Card>
        <CardHeader><CardTitle>Purchase information</CardTitle></CardHeader>
        <CardContent className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Status" value={car.status.replaceAll("_", " ")} />
          <Detail label="Condition" value={car.conditionOther || car.condition.replaceAll("_", " ")} />
          <Detail label="Payment method" value={car.paymentMethod.replaceAll("_", " ")} />
          <Detail label="VIN / Chassis" value={car.vinChassis || "—"} />
          <Detail label="Seller" value={car.seller.name} />
          <Detail label="Source" value={car.source?.name || "—"} />
          <Detail label="Year" value={car.year?.toString() || "—"} />
          <Detail label="Notes" value={car.notes || "—"} />
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value, emphasized = false }: { title: string; value: string; emphasized?: boolean }) {
  return (
    <Card className={emphasized ? "border-primary/30 bg-primary/5" : undefined}>
      <CardContent className="flex items-center gap-3 py-5">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CircleDollarSign className="size-5" />
        </div>
        <div><p className="text-xs text-muted-foreground">{title}</p><p className="mt-1 font-semibold">{value}</p></div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>;
}

function formatAed(value: string): string {
  return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" }).format(Number(value));
}
