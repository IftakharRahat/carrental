"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Car,
  ContactRound,
  DollarSign,
  Edit3,
  MapPin,
  MessageSquare,
  Phone,
  Power,
  Shield,
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
import type { SellerProfileData } from "../domain/seller-types";
import { toggleSellerActiveAction } from "../server/seller-actions";
import { EditSellerDialog } from "./edit-seller-dialog";

export function SellerProfileView({
  seller,
}: {
  seller: SellerProfileData;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggleActive() {
    startTransition(async () => {
      const res = await toggleSellerActiveAction(seller.id, !seller.isActive);
      if (!res.ok) {
        toast.error(res.message || "Failed to toggle status");
        return;
      }
      toast.success(
        `Seller "${seller.name}" ${seller.isActive ? "archived" : "activated"}`,
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/sellers"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to Sellers
        </Link>
      </div>

      {/* Header Profile Summary */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
            <ContactRound className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {seller.name}
              </h1>
              <Badge variant={seller.isActive ? "default" : "secondary"}>
                {seller.isActive ? "Active" : "Archived"}
              </Badge>
              {seller.emiratesId && (
                <Badge variant="outline" className="text-xs font-mono">
                  EID: {seller.emiratesId}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Vehicle Seller • ID: {seller.id.slice(0, 8)} • Added on{" "}
              {seller.createdAt.slice(0, 10)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="gap-1.5"
          >
            <Edit3 className="size-4" />
            Edit Seller
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleActive}
            disabled={isPending}
            className="gap-1.5"
          >
            <Power className="size-4" />
            {seller.isActive ? "Archive" : "Activate"}
          </Button>
        </div>
      </div>

      {/* Section 10.1 Summary Cards (3 KPIs) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Cars Sold to You */}
        <Card className="shadow-xs border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cars Sold to You
            </CardTitle>
            <Car className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-foreground"
              data-testid="kpi-cars-sold"
            >
              {seller.kpis.carsSoldToYou}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Vehicles purchased from this seller
            </p>
          </CardContent>
        </Card>

        {/* Total Amount in AED */}
        <Card className="shadow-xs border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Purchase Amount
            </CardTitle>
            <DollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-foreground"
              data-testid="kpi-total-amount"
            >
              {formatAed(seller.kpis.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total AED paid to this seller
            </p>
          </CardContent>
        </Card>

        {/* Last Deal */}
        <Card className="shadow-xs border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Last Deal Date
            </CardTitle>
            <Calendar className="size-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div
              className="text-xl font-bold text-foreground truncate"
              data-testid="kpi-last-deal"
            >
              {seller.kpis.lastDeal || "Never"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Most recent transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Seller Contact Card + Linked Cars Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Contact Card */}
        <div className="space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Contact & Profile Details
              </CardTitle>
              <CardDescription className="text-xs">
                Direct seller contact and identification (Section 10.1).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* Phone */}
              <div>
                <span className="text-muted-foreground block mb-1">
                  Primary Phone
                </span>
                {seller.phone ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{seller.phone}</span>
                    <a
                      href={`tel:${seller.phone}`}
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
                {seller.whatsapp ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {seller.whatsapp}
                    </span>
                    <a
                      href={`https://wa.me/${seller.whatsapp.replace(/[^0-9]/g, "")}`}
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

              {/* Emirates ID */}
              <div>
                <span className="text-muted-foreground block mb-1">
                  Emirates ID
                </span>
                {seller.emiratesId ? (
                  <div className="flex items-center gap-1.5 font-mono font-medium">
                    <Shield className="size-3.5 text-muted-foreground" />
                    {seller.emiratesId}
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
                {seller.location ? (
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    {seller.location}
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">
                    Not specified
                  </span>
                )}
              </div>

              {/* Notes */}
              <div>
                <span className="text-muted-foreground block mb-1">
                  Relationship Notes
                </span>
                <p className="text-muted-foreground whitespace-pre-wrap rounded-lg bg-muted/40 p-2.5 border">
                  {seller.notes || "No context notes recorded for this seller."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 2 Columns: Linked Cars Table (Section 10.2) */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Car className="size-4 text-primary" />
                    Cars Sold to You ({seller.linkedCars.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    All cars purchased from this seller.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" data-testid="seller-linked-cars-table">
                  <thead className="bg-muted/50 text-xs font-medium uppercase tracking-wider text-muted-foreground border-y">
                    <tr>
                      <th className="px-4 py-2.5">Car ID</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Vehicle</th>
                      <th className="px-4 py-2.5 text-right">Purchase Amount (AED)</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {seller.linkedCars.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-xs text-muted-foreground"
                        >
                          No vehicles linked to this seller yet.
                        </td>
                      </tr>
                    ) : (
                      seller.linkedCars.map((car) => (
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
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <EditSellerDialog
          seller={seller}
          open={isEditing}
          onOpenChange={setIsEditing}
        />
      )}
    </div>
  );
}
