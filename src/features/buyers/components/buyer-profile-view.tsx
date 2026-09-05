"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  Calendar,
  CarFront,
  CircleDollarSign,
  Clock,
  Edit2,
  MapPin,
  MessageCircle,
  Phone,
  Receipt,
  ShoppingBag,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAed } from "@/lib/currency";
import type { BuyerProfileDetail, BuyerTypeOption } from "../domain/buyer-types";
import { ArchiveBuyerDialog } from "./archive-buyer-dialog";
import { EditBuyerDialog } from "./edit-buyer-dialog";

type BuyerProfileViewProps = {
  buyer: BuyerProfileDetail;
  availableTypes: BuyerTypeOption[];
};

export function BuyerProfileView({
  buyer,
  availableTypes,
}: BuyerProfileViewProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/buyers"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to Buyers
        </Link>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-semibold text-primary text-sm">Buyer Profile</span>
            <span className="text-muted-foreground/50">·</span>
            <Badge
              variant="outline"
              className={`text-xs ${
                buyer.isActive
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-muted-foreground/30 bg-muted/40 text-muted-foreground"
              }`}
            >
              {buyer.isActive ? "Active Buyer" : "Archived Buyer"}
            </Badge>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {buyer.name}
          </h1>

          {buyer.companyName && (
            <p className="text-muted-foreground text-sm mt-0.5 font-medium">
              {buyer.companyName}
            </p>
          )}

          {/* Categories Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {buyer.types.length > 0 ? (
              buyer.types.map((type) => (
                <Badge
                  key={type.id}
                  variant="outline"
                  className="text-xs border-primary/30 bg-primary/10 text-primary font-medium"
                >
                  {type.name}
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                General Buyer
              </Badge>
            )}
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {buyer.phone && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href={`tel:${buyer.phone}`} />}
              className="gap-1.5 shadow-xs text-xs"
            >
              <Phone className="size-3.5" />
              Call
            </Button>
          )}

          {buyer.whatsapp && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <a
                  href={`https://wa.me/${buyer.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              className="gap-1.5 shadow-xs text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            >
              <MessageCircle className="size-3.5" />
              WhatsApp
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
            className="gap-1.5 shadow-xs text-xs"
            data-testid="edit-buyer-btn"
          >
            <Edit2 className="size-3.5" />
            Edit Profile
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsArchiveDialogOpen(true)}
            className="gap-1.5 shadow-xs text-xs"
            data-testid="archive-buyer-btn"
          >
            <Archive className="size-3.5" />
            {buyer.isActive ? "Archive" : "Restore"}
          </Button>
        </div>
      </div>

      {/* 11.3 Summary Cards: Total Purchases, Total Amount, Last Purchase */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="shadow-xs" data-testid="kpi-total-purchases">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Total Purchases
            </CardTitle>
            <Receipt className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {buyer.kpis.totalPurchasesCount}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Completed sale & recovery transactions
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs" data-testid="kpi-total-amount">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Total Amount Paid
            </CardTitle>
            <CircleDollarSign className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatAed(buyer.kpis.totalAmountPaid)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Cumulative recovered revenue in AED
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs" data-testid="kpi-last-purchase">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Last Purchase
            </CardTitle>
            <Clock className="size-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {buyer.kpis.lastPurchaseDate ? (
                new Date(buyer.kpis.lastPurchaseDate).toLocaleDateString("en-AE", {
                  dateStyle: "medium",
                  timeZone: "UTC",
                })
              ) : (
                <span className="text-muted-foreground text-lg">No purchases yet</span>
              )}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Latest recorded transaction date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Buyer Info Card + Transaction History */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 1 Column: Profile Information Card */}
        <div className="space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShoppingBag className="size-4 text-primary" />
                Contact & Details
              </CardTitle>
              <CardDescription className="text-xs">
                Section 11.2 buyer profile details and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              {/* Phone */}
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <Phone className="size-3.5 text-muted-foreground" />
                  Primary Phone
                </span>
                <span className="font-semibold text-foreground">
                  {buyer.phone || "—"}
                </span>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <MessageCircle className="size-3.5 text-emerald-600" />
                  WhatsApp
                </span>
                <span className="font-semibold text-foreground">
                  {buyer.whatsapp || "—"}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  Location / Yard
                </span>
                <span className="font-semibold text-foreground text-right max-w-[160px] truncate">
                  {buyer.location || "—"}
                </span>
              </div>

              {/* Registered Date */}
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  Registered Date
                </span>
                <span className="font-medium text-foreground">
                  {new Date(buyer.createdAt).toLocaleDateString("en-AE", {
                    dateStyle: "medium",
                    timeZone: "UTC",
                  })}
                </span>
              </div>

              {/* Notes */}
              <div className="pt-1">
                <span className="text-muted-foreground font-medium block mb-1">Notes:</span>
                <p className="bg-muted/40 p-2.5 rounded-md text-foreground leading-relaxed italic">
                  {buyer.notes || "No notes recorded for this buyer."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 2 Columns: 11.3 Transaction History Table */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Receipt className="size-4 text-primary" />
                    Transaction History
                  </CardTitle>
                  <CardDescription className="text-xs">
                    All whole-car and dismantled item sales recorded for this buyer.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {buyer.transactions.length} record(s)
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" data-testid="buyer-transactions-table">
                  <thead className="bg-muted/50 text-xs font-medium uppercase tracking-wider text-muted-foreground border-y">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Car ID</th>
                      <th className="px-4 py-2.5">Item / Sale Mode</th>
                      <th className="px-4 py-2.5 text-right">Amount (AED)</th>
                      <th className="px-4 py-2.5">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {buyer.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-muted-foreground text-xs">
                          No sales transactions recorded for this buyer yet.
                        </td>
                      </tr>
                    ) : (
                      buyer.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                          {/* Date */}
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(tx.saleDate).toLocaleDateString("en-AE", {
                              dateStyle: "medium",
                              timeZone: "UTC",
                            })}
                          </td>

                          {/* Car ID & Name */}
                          <td className="px-4 py-3">
                            <Link
                              href={`/cars/${tx.carNumber}`}
                              className="font-mono text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                              <CarFront className="size-3.5" />
                              {tx.carNumber}
                            </Link>
                            <p className="text-muted-foreground text-[11px] truncate max-w-[160px]">
                              {tx.carName}
                            </p>
                          </td>

                          {/* Item / Whole Car Mode */}
                          <td className="px-4 py-3">
                            {tx.mode === "WHOLE_CAR" ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              >
                                Whole Car Sale
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                              >
                                {tx.itemType ? tx.itemType.replace("_", " ") : "Item Sale"}
                                {tx.itemLabel ? ` (${tx.itemLabel})` : ""}
                              </Badge>
                            )}
                          </td>

                          {/* Amount Paid in AED */}
                          <td className="px-4 py-3 text-right font-bold text-foreground">
                            {formatAed(tx.amount)}
                          </td>

                          {/* Payment Method */}
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {tx.paymentMethod.replace("_", " ")}
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

      {/* Edit Buyer Dialog */}
      <EditBuyerDialog
        buyer={buyer}
        availableTypes={availableTypes}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      {/* Archive / Delete Confirmation Dialog */}
      <ArchiveBuyerDialog
        buyer={buyer}
        open={isArchiveDialogOpen}
        onOpenChange={setIsArchiveDialogOpen}
      />
    </div>
  );
}
