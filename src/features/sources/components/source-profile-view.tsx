"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Car,
  Coins,
  DollarSign,
  Edit3,
  GitFork,
  MapPin,
  MessageSquare,
  Phone,
  Power,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAed } from "@/lib/currency";
import type { SourceProfileData } from "../domain/source-types";
import { toggleSourceActiveAction } from "../server/source-actions";
import { EditSourceDialog } from "./edit-source-dialog";
import { PayCommissionDialog } from "./pay-commission-dialog";

export function SourceProfileView({
  source,
  availableCars = [],
}: {
  source: SourceProfileData;
  availableCars?: Array<{
    id: string;
    carNumber: number;
    brand: string;
    model: string;
    year?: number | null;
  }>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggleActive() {
    startTransition(async () => {
      const res = await toggleSourceActiveAction(source.id, !source.isActive);
      if (!res.ok) {
        toast.error(res.message || "Failed to toggle status");
        return;
      }
      toast.success(
        `Source "${source.name}" ${source.isActive ? "archived" : "activated"}`,
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          href="/sources"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to Sources
        </Link>
      </div>

      {/* Header Profile Summary */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
            <GitFork className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {source.name}
              </h1>
              <Badge variant={source.isActive ? "default" : "secondary"}>
                {source.isActive ? "Active" : "Archived"}
              </Badge>
              <Badge variant="outline">{source.categoryLabel}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {source.typeLabel} • Source ID: {source.id.slice(0, 8)} • Added on{" "}
              {source.createdAt.slice(0, 10)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsCommissionOpen(true)}
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Coins className="size-4" />
            Pay Commission
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="gap-1.5"
          >
            <Edit3 className="size-4" />
            Edit
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleActive}
            disabled={isPending}
            className="gap-1.5"
          >
            <Power className="size-4" />
            {source.isActive ? "Archive" : "Activate"}
          </Button>
        </div>
      </div>

      {/* Section 9.3 Performance Summary Cards (5 KPIs) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {/* Total Leads */}
        <Card className="shadow-xs border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Leads
            </CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-foreground"
              data-testid="kpi-total-leads"
            >
              {source.kpis.totalLeads}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Opportunities</p>
          </CardContent>
        </Card>

        {/* Cars Bought */}
        <Card className="shadow-xs border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cars Bought
            </CardTitle>
            <Car className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-foreground"
              data-testid="kpi-cars-bought"
            >
              {source.kpis.carsBought}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Acquired cars</p>
          </CardContent>
        </Card>

        {/* Total Purchase Value */}
        <Card className="shadow-xs border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Purchase Value
            </CardTitle>
            <DollarSign className="size-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-foreground"
              data-testid="kpi-purchase-value"
            >
              {formatAed(source.kpis.totalPurchaseValue)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Inventory spend</p>
          </CardContent>
        </Card>

        {/* Commission Paid */}
        <Card className="shadow-xs border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Commission Paid
            </CardTitle>
            <Coins className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-foreground"
              data-testid="kpi-commission-paid"
            >
              {formatAed(source.kpis.commissionPaid)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Payouts to source</p>
          </CardContent>
        </Card>

        {/* Last Deal */}
        <Card className="shadow-xs border col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Last Deal
            </CardTitle>
            <Calendar className="size-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div
              className="text-xl font-bold text-foreground truncate"
              data-testid="kpi-last-deal"
            >
              {source.kpis.lastDeal || "None"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Latest purchase</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Contact Card + Linked Data */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Source Profile Details */}
        <div className="space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Source Details
              </CardTitle>
              <CardDescription className="text-xs">
                Contact information & channel attributes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* Type & Category */}
              <div>
                <span className="text-muted-foreground block mb-1">
                  Type & Category
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline">{source.typeLabel}</Badge>
                  <Badge variant="secondary">{source.categoryLabel}</Badge>
                </div>
              </div>

              {/* Phone */}
              <div>
                <span className="text-muted-foreground block mb-1">
                  Phone Number
                </span>
                {source.phone ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{source.phone}</span>
                    <a
                      href={`tel:${source.phone}`}
                      className="p-1.5 rounded-md hover:bg-muted text-primary"
                      title="Call Phone"
                    >
                      <Phone className="size-3.5" />
                    </a>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">
                    Not specified
                  </span>
                )}
              </div>

              {/* WhatsApp */}
              <div>
                <span className="text-muted-foreground block mb-1">WhatsApp</span>
                {source.whatsapp ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {source.whatsapp}
                    </span>
                    <a
                      href={`https://wa.me/${source.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md hover:bg-muted text-emerald-600 dark:text-emerald-400"
                      title="Open WhatsApp Chat"
                    >
                      <MessageSquare className="size-3.5" />
                    </a>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">
                    Not specified
                  </span>
                )}
              </div>

              {/* Location */}
              <div>
                <span className="text-muted-foreground block mb-1">Location</span>
                {source.location ? (
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    {source.location}
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">
                    Not specified
                  </span>
                )}
              </div>

              {/* Notes */}
              <div>
                <span className="text-muted-foreground block mb-1">Notes</span>
                <p className="text-muted-foreground whitespace-pre-wrap rounded-lg bg-muted/40 p-2.5 border">
                  {source.notes || "No notes recorded for this source."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 2 Columns: Linked Cars & Commission History */}
        <div className="space-y-6 lg:col-span-2">
          {/* Linked Cars Table */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Car className="size-4 text-primary" />
                    Linked Cars ({source.linkedCars.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Vehicles purchased that were sourced via this channel.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" data-testid="source-linked-cars-table">
                  <thead className="bg-muted/50 text-xs font-medium uppercase tracking-wider text-muted-foreground border-y">
                    <tr>
                      <th className="px-4 py-2.5">Car ID</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Vehicle</th>
                      <th className="px-4 py-2.5 text-right">Purchase Amount</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {source.linkedCars.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-xs text-muted-foreground"
                        >
                          No cars have been sourced via {source.name} yet.
                        </td>
                      </tr>
                    ) : (
                      source.linkedCars.map((car) => (
                        <tr key={car.id} className="hover:bg-muted/30">
                          <td className="px-4 py-2.5">
                            <Link
                              href={`/cars/CAR-${String(car.carNumber).padStart(4, "0")}`}
                              className="font-mono font-semibold text-primary hover:underline text-xs"
                            >
                              CAR-{String(car.carNumber).padStart(4, "0")}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">
                            {car.purchaseDate}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-xs">
                            {car.year || ""} {car.brand} {car.model}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs font-semibold">
                            {formatAed(car.purchasePrice)}
                          </td>
                          <td className="px-4 py-2.5 text-xs">
                            <Badge variant="outline" className="text-[11px]">
                              {car.status.replace(/_/g, " ")}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Commission History Table (Section 9.3) */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Coins className="size-4 text-amber-500" />
                    Commission Payouts ({source.commissions.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Money Out commission transactions recorded for this source.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCommissionOpen(true)}
                  className="gap-1.5 text-xs h-8 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                >
                  <Coins className="size-3.5" />
                  Pay Commission
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" data-testid="source-commissions-table">
                  <thead className="bg-muted/50 text-xs font-medium uppercase tracking-wider text-muted-foreground border-y">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Linked Car</th>
                      <th className="px-4 py-2.5 text-right">Amount (AED)</th>
                      <th className="px-4 py-2.5">Payment Method</th>
                      <th className="px-4 py-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {source.commissions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-xs text-muted-foreground"
                        >
                          No commission payments recorded for this source.
                        </td>
                      </tr>
                    ) : (
                      source.commissions.map((comm) => (
                        <tr key={comm.id} className="hover:bg-muted/30">
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">
                            {comm.transactionDate}
                          </td>
                          <td className="px-4 py-2.5 text-xs">
                            {comm.carNumber ? (
                              <Link
                                href={`/cars/CAR-${String(comm.carNumber).padStart(4, "0")}`}
                                className="font-mono text-primary hover:underline font-medium"
                              >
                                CAR-{String(comm.carNumber).padStart(4, "0")}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground italic">General</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-xs text-amber-600 dark:text-amber-400">
                            {formatAed(comm.amount)}
                          </td>
                          <td className="px-4 py-2.5 text-xs">
                            <Badge variant="secondary" className="text-[10px]">
                              {comm.paymentMethod.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[200px]">
                            {comm.description || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <EditSourceDialog
          source={source}
          open={isEditing}
          onOpenChange={setIsEditing}
        />
      )}

      {/* Pay Commission Modal */}
      {isCommissionOpen && (
        <PayCommissionDialog
          source={source}
          availableCars={availableCars}
          open={isCommissionOpen}
          onOpenChange={setIsCommissionOpen}
        />
      )}
    </div>
  );
}
