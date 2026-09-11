"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Car,
  ContactRound,
  DollarSign,
  Edit3,
  Eye,
  MapPin,
  MoreHorizontal,
  Phone,
  Power,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { formatAed } from "@/lib/currency";
import type { OverallSellersKpis, SellerRowData } from "../domain/seller-types";
import {
  deleteSingleSellerAction,
  toggleSellerActiveAction,
} from "../server/seller-actions";
import { AddSellerDialog } from "./add-seller-dialog";
import { CleanExpiredSellersDialog } from "./clean-expired-sellers-dialog";
import { EditSellerDialog } from "./edit-seller-dialog";

export function SellersView({
  initialSellers,
  initialOverallKpis,
}: {
  initialSellers: SellerRowData[];
  initialOverallKpis: OverallSellersKpis;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "ARCHIVED" | "ALL">("ACTIVE");
  const [editingSeller, setEditingSeller] = useState<SellerRowData | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const activeCount = useMemo(
    () => initialSellers.filter((s) => s.isActive).length,
    [initialSellers],
  );
  const archivedCount = initialSellers.length - activeCount;

  const filteredSellers = useMemo(() => {
    return initialSellers.filter((s) => {
      // Status filter
      if (statusFilter === "ACTIVE" && !s.isActive) return false;
      if (statusFilter === "ARCHIVED" && s.isActive) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesPhone = s.phone?.toLowerCase().includes(query);
        const matchesLocation = s.location?.toLowerCase().includes(query);
        return matchesName || matchesPhone || matchesLocation;
      }

      return true;
    });
  }, [initialSellers, statusFilter, searchQuery]);

  function handleToggleActive(seller: SellerRowData) {
    const actionText = seller.isActive ? "archive" : "activate";
    startTransition(async () => {
      const res = await toggleSellerActiveAction(seller.id, !seller.isActive);
      if (!res.ok) {
        toast.error(res.message || `Failed to ${actionText} seller`);
        return;
      }
      toast.success(
        `Seller "${seller.name}" ${seller.isActive ? "archived" : "activated"}`,
      );
      router.refresh();
    });
  }

  function handleDeleteSeller(seller: SellerRowData) {
    if (!confirm(`Are you sure you want to permanently delete unused seller "${seller.name}"?`)) {
      return;
    }
    startTransition(async () => {
      const res = await deleteSingleSellerAction(seller.id);
      if (!res.ok) {
        toast.error(res.message || "Failed to delete seller");
        return;
      }
      toast.success(`Seller "${seller.name}" deleted`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <ContactRound className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Sellers
            </h1>
            <Badge variant="outline" className="text-xs">
              Page 7
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Database of actual vehicle owners and legal sellers (Section 10). Distinct from opportunity sources.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CleanExpiredSellersDialog sellers={initialSellers} />
          <AddSellerDialog />
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="shadow-xs border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Sellers
            </CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-foreground"
              data-testid="kpi-active-sellers"
            >
              {initialOverallKpis.activeSellers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of {initialOverallKpis.totalSellers} total contacts
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cars Purchased
            </CardTitle>
            <Car className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-foreground"
              data-testid="kpi-cars-purchased"
            >
              {initialOverallKpis.totalCarsPurchased}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Vehicles bought from sellers
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Purchase Spend
            </CardTitle>
            <DollarSign className="size-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-foreground"
              data-testid="kpi-total-spend"
            >
              {formatAed(initialOverallKpis.totalSpend)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total capital paid to vehicle owners
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Avg Cars / Seller
            </CardTitle>
            <ContactRound className="size-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-foreground"
              data-testid="kpi-avg-cars"
            >
              {initialOverallKpis.avgCarsPerSeller}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Repeat deal frequency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search sellers by name, phone, area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs"
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
            Active ({activeCount})
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
            All ({initialSellers.length})
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
            Archived ({archivedCount})
          </button>
        </div>
      </div>

      {/* Sellers Data Table (Section 10.2) */}
      <Card className="shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="sellers-table">
            <thead className="bg-muted/50 text-xs font-medium uppercase tracking-wider text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3">Seller Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3 text-center">Cars Sold to You</th>
                <th className="px-4 py-3 text-right">Total Amount (AED)</th>
                <th className="px-4 py-3">Last Deal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSellers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No sellers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredSellers.map((seller) => (
                  <tr
                    key={seller.id}
                    className={`hover:bg-muted/30 transition-colors ${
                      !seller.isActive ? "opacity-60 bg-muted/10" : ""
                    }`}
                  >
                    {/* Name */}
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/sellers/${seller.id}`}
                          className="hover:underline text-primary font-semibold flex items-center gap-1"
                        >
                          {seller.name}
                        </Link>
                      </div>
                      {seller.notes && (
                        <p className="text-[11px] text-muted-foreground truncate max-w-[200px] mt-0.5">
                          {seller.notes}
                        </p>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 text-xs">
                      {seller.phone ? (
                        <a
                          href={`tel:${seller.phone}`}
                          className="text-foreground hover:text-primary flex items-center gap-1"
                        >
                          <Phone className="size-3 text-muted-foreground" />
                          {seller.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">None</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {seller.location ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {seller.location}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* Cars Sold to You */}
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className="text-xs font-medium">
                        {seller.kpis.carsSoldToYou}
                      </Badge>
                    </td>

                    {/* Total Amount in AED */}
                    <td className="px-4 py-3 text-right text-xs font-semibold">
                      {formatAed(seller.kpis.totalAmount)}
                    </td>

                    {/* Last Deal */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {seller.kpis.lastDeal || "Never"}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-xs">
                      <Badge
                        variant={seller.isActive ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {seller.isActive ? "Active" : "Archived"}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none cursor-pointer"
                          aria-label={`Actions for ${seller.name}`}
                        >
                          <MoreHorizontal className="size-4 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            render={
                              <Link
                                href={`/sellers/${seller.id}`}
                                className="flex items-center gap-2 cursor-pointer"
                              />
                            }
                          >
                            <Eye className="size-4" />
                            View Profile
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => setEditingSeller(seller)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Edit3 className="size-4" />
                            Edit Seller
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => handleToggleActive(seller)}
                            disabled={isPending}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Power className="size-4" />
                            {seller.isActive ? "Archive Seller" : "Activate Seller"}
                          </DropdownMenuItem>

                          {seller.kpis.carsSoldToYou === 0 && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteSeller(seller)}
                              disabled={isPending}
                              className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Trash2 className="size-4" />
                              Delete Seller
                            </DropdownMenuItem>
                          )}
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

      {/* Edit Seller Modal */}
      {editingSeller && (
        <EditSellerDialog
          seller={editingSeller}
          open={Boolean(editingSeller)}
          onOpenChange={(open) => {
            if (!open) setEditingSeller(null);
          }}
        />
      )}
    </div>
  );
}
