"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  Award,
  CircleDollarSign,
  Edit2,
  ExternalLink,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { formatAed } from "@/lib/currency";
import { calculateOverallBuyersKpis } from "../domain/buyer-calculations";
import type { BuyerListItem, BuyerTypeOption, BuyersPageKpis } from "../domain/buyer-types";
import { AddBuyerDialog } from "./add-buyer-dialog";
import { AddBuyerTypeDialog } from "./add-buyer-type-dialog";
import { ArchiveBuyerDialog } from "./archive-buyer-dialog";
import { EditBuyerDialog } from "./edit-buyer-dialog";

type BuyersViewProps = {
  initialBuyers: BuyerListItem[];
  initialPageKpis: BuyersPageKpis;
  availableTypes: BuyerTypeOption[];
};

export function BuyersView({
  initialBuyers,
  initialPageKpis,
  availableTypes,
}: BuyersViewProps) {
  const [typesList, setTypesList] = useState<BuyerTypeOption[]>(availableTypes);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "ARCHIVED" | "ALL">("ACTIVE");

  // Modals state
  const [editingBuyer, setEditingBuyer] = useState<BuyerListItem | null>(null);
  const [archivingBuyer, setArchivingBuyer] = useState<BuyerListItem | null>(null);

  const handleCategoryCreated = (newType: BuyerTypeOption) => {
    setTypesList((prev) => {
      if (prev.some((t) => t.id === newType.id)) return prev;
      return [...prev, newType].sort((a, b) => a.name.localeCompare(b.name));
    });
    setSelectedTypeFilter(newType.id);
  };

  // Filtered Buyers
  const filteredBuyers = useMemo(() => {
    return initialBuyers.filter((b) => {
      // Status filter
      if (statusFilter === "ACTIVE" && !b.isActive) return false;
      if (statusFilter === "ARCHIVED" && b.isActive) return false;

      // Type filter
      if (selectedTypeFilter !== "ALL") {
        const hasType = b.types.some((t) => t.id === selectedTypeFilter);
        if (!hasType) return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(query);
        const matchesCompany = b.companyName?.toLowerCase().includes(query) ?? false;
        const matchesPhone = b.phone?.toLowerCase().includes(query) ?? false;
        const matchesLocation = b.location?.toLowerCase().includes(query) ?? false;
        if (!matchesName && !matchesCompany && !matchesPhone && !matchesLocation) {
          return false;
        }
      }

      return true;
    });
  }, [initialBuyers, statusFilter, selectedTypeFilter, searchTerm]);

  // Reactive KPIs calculated specifically for currently filtered buyers
  const dynamicKpis = useMemo(() => {
    return calculateOverallBuyersKpis(filteredBuyers);
  }, [filteredBuyers]);

  return (
    <div className="space-y-6">
      {/* 11. Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2.5">
            <ShoppingBag className="size-7 text-primary" />
            Buyers
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Store whole-car and item buyers and analyze buyer activity.
          </p>
        </div>

        {/* 11. Primary Actions */}
        <div className="flex items-center gap-2">
          <AddBuyerTypeDialog
            onSuccess={handleCategoryCreated}
            triggerLabel="+ Add Category"
          />
          <AddBuyerDialog availableTypes={typesList} />
        </div>
      </div>

      {/* KPI Cards Strip (Reactive to selected category and search filters) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* 1. Total Buyers */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Total Buyers
            </CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {dynamicKpis.totalBuyers}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {dynamicKpis.activeBuyers} active in business
            </p>
          </CardContent>
        </Card>

        {/* 2. Top Category */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Top Category
            </CardTitle>
            <Award className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tracking-tight text-foreground truncate" title={dynamicKpis.topCategory}>
              {dynamicKpis.topCategory}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Leading recovery segment
            </p>
          </CardContent>
        </Card>

        {/* 3. Repeat Buyer Rate */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Repeat Buyer Rate
            </CardTitle>
            <RefreshCw className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {dynamicKpis.repeatBuyerRate}%
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {dynamicKpis.repeatBuyersCount} repeat buyer{dynamicKpis.repeatBuyersCount === 1 ? "" : "s"} (&gt;1 purchase)
            </p>
          </CardContent>
        </Card>

        {/* 4. Total Recovered */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Total Recovered
            </CardTitle>
            <CircleDollarSign className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatAed(dynamicKpis.totalRecoveredAmount)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Cumulative buyer revenue
            </p>
          </CardContent>
        </Card>

        {/* 5. Avg. Purchase / Buyer */}
        <Card className="shadow-xs col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Avg. Purchase / Buyer
            </CardTitle>
            <TrendingUp className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatAed(dynamicKpis.averagePurchasePerBuyer)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Across buyers with purchases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search by buyer name, company, phone, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                data-testid="search-buyers-input"
              />
            </div>

            {/* Status Segmented Control */}
            <div className="flex items-center rounded-lg border bg-muted/40 p-1 text-xs font-medium self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === "ACTIVE"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === "ALL"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ARCHIVED")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === "ARCHIVED"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Archived
              </button>
            </div>
          </div>

          {/* Category Filter Pills (11.1) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t">
            <span className="text-muted-foreground text-xs mr-1 font-medium">Category:</span>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter("ALL")}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                selectedTypeFilter === "ALL"
                  ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                  : "bg-background text-muted-foreground hover:bg-muted/50 border-input"
              }`}
            >
              All Categories
            </button>
            {typesList.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedTypeFilter(type.id)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  selectedTypeFilter === type.id
                    ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                    : "bg-background text-muted-foreground hover:bg-muted/50 border-input"
                }`}
              >
                {type.name}
              </button>
            ))}
            <AddBuyerTypeDialog
              onSuccess={handleCategoryCreated}
              triggerLabel="+ New Category"
            />
          </div>
        </CardContent>
      </Card>

      {/* 11.2 Buyers Table */}
      <Card className="shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="buyers-table">
            <thead className="bg-muted/50 text-xs font-medium uppercase tracking-wider text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3">Buyer / Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Categories (11.1)</th>
                <th className="px-4 py-3 text-right">Total Purchases</th>
                <th className="px-4 py-3 text-right">Total Amount (AED)</th>
                <th className="px-4 py-3">Last Purchase</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBuyers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <p className="font-semibold text-foreground">No buyers found</p>
                    <p className="text-xs mt-1">
                      {searchTerm
                        ? "Try clearing your search query or filter"
                        : "Click '+ Add Buyer' to create your first buyer profile"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBuyers.map((buyer) => (
                  <tr
                    key={buyer.id}
                    className="hover:bg-muted/30 transition-colors group"
                    data-testid={`buyer-row-${buyer.id}`}
                  >
                    {/* Buyer & Company */}
                    <td className="px-4 py-3">
                      <div>
                        <Link
                          href={`/buyers/${buyer.id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors hover:underline"
                        >
                          {buyer.name}
                        </Link>
                        {buyer.companyName && (
                          <p className="text-muted-foreground text-xs">
                            {buyer.companyName}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Contact (Phone & WhatsApp) */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 text-xs">
                        {buyer.phone ? (
                          <a
                            href={`tel:${buyer.phone}`}
                            className="text-foreground hover:underline flex items-center gap-1"
                          >
                            <Phone className="size-3 text-muted-foreground" />
                            {buyer.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                        {buyer.whatsapp && (
                          <a
                            href={`https://wa.me/${buyer.whatsapp.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            <MessageCircle className="size-3" />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {buyer.location ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 shrink-0 text-muted-foreground/70" />
                          <span className="truncate max-w-[140px]">{buyer.location}</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* Categories (11.1 Multi-select Badges) */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {buyer.types.length > 0 ? (
                          buyer.types.map((t) => (
                            <Badge
                              key={t.id}
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-primary/30 bg-primary/5 text-primary"
                            >
                              {t.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground/60 text-xs">General</span>
                        )}
                      </div>
                    </td>

                    {/* Total Purchases (Count) */}
                    <td className="px-4 py-3 text-right font-medium text-xs">
                      {buyer.kpis.totalPurchasesCount}
                    </td>

                    {/* Total Amount Paid (AED) */}
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      {formatAed(buyer.kpis.totalAmountPaid)}
                    </td>

                    {/* Last Purchase Date */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {buyer.kpis.lastPurchaseDate ? (
                        new Date(buyer.kpis.lastPurchaseDate).toLocaleDateString("en-AE", {
                          dateStyle: "medium",
                          timeZone: "UTC",
                        })
                      ) : (
                        <span className="text-muted-foreground/60">No purchases yet</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          buyer.isActive
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "border-muted-foreground/30 bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        {buyer.isActive ? "Active" : "Archived"}
                      </Badge>
                    </td>

                    {/* Row Actions */}
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none"
                          aria-label="Buyer options"
                        >
                          <MoreHorizontal className="size-4 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            render={<Link href={`/buyers/${buyer.id}`} />}
                          >
                            <ExternalLink className="size-3.5 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingBuyer(buyer)}>
                            <Edit2 className="size-3.5 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setArchivingBuyer(buyer)}>
                            <Archive className="size-3.5 mr-2" />
                            {buyer.isActive ? "Archive Buyer" : "Restore Buyer"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Buyer Dialog */}
      <EditBuyerDialog
        buyer={editingBuyer}
        availableTypes={typesList}
        open={Boolean(editingBuyer)}
        onOpenChange={(open) => !open && setEditingBuyer(null)}
      />

      {/* Archive / Delete Dialog */}
      <ArchiveBuyerDialog
        buyer={archivingBuyer}
        open={Boolean(archivingBuyer)}
        onOpenChange={(open) => !open && setArchivingBuyer(null)}
      />
    </div>
  );
}
