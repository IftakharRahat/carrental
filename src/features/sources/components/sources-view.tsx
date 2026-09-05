"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Car,
  Coins,
  DollarSign,
  Edit3,
  Eye,
  GitFork,
  MapPin,
  MoreHorizontal,
  Phone,
  Power,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  SOURCE_CATEGORIES,
  SOURCE_CATEGORY_LABELS,
  type OverallSourcesKpis,
  type SourceRowData,
} from "../domain/source-types";
import { toggleSourceActiveAction } from "../server/source-actions";
import { AddSourceDialog } from "./add-source-dialog";
import { EditSourceDialog } from "./edit-source-dialog";
import { PayCommissionDialog } from "./pay-commission-dialog";

export function SourcesView({
  initialSources,
  initialOverallKpis,
}: {
  initialSources: SourceRowData[];
  initialOverallKpis: OverallSourcesKpis;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [editingSource, setEditingSource] = useState<SourceRowData | null>(null);
  const [commissionSource, setCommissionSource] = useState<SourceRowData | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filteredSources = useMemo(() => {
    return initialSources.filter((s) => {
      // Category filter
      if (selectedCategory !== "ALL" && s.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesType = s.typeLabel.toLowerCase().includes(query);
        const matchesPhone = s.phone?.toLowerCase().includes(query);
        const matchesLocation = s.location?.toLowerCase().includes(query);
        return matchesName || matchesType || matchesPhone || matchesLocation;
      }
      return true;
    });
  }, [initialSources, selectedCategory, searchQuery]);

  function handleToggleActive(source: SourceRowData) {
    const actionText = source.isActive ? "archive" : "activate";
    startTransition(async () => {
      const res = await toggleSourceActiveAction(source.id, !source.isActive);
      if (!res.ok) {
        toast.error(res.message || `Failed to ${actionText} source`);
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
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <GitFork className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Sources
            </h1>
            <Badge variant="outline" className="text-xs">
              Page 6
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Track where opportunities and vehicles originated (People, Online, Offline). Source is distinct from Seller.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AddSourceDialog />
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="shadow-xs border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Sources
            </CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-foreground"
              data-testid="kpi-active-sources"
            >
              {initialOverallKpis.activeSources}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of {initialOverallKpis.totalSources} registered channels
            </p>
          </CardContent>
        </Card>

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
              {initialOverallKpis.totalCarsBought}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Vehicles acquired via sources
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Purchase Value
            </CardTitle>
            <DollarSign className="size-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-foreground"
              data-testid="kpi-purchase-value"
            >
              {formatAed(initialOverallKpis.totalPurchaseValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total inventory capital sourced
            </p>
          </CardContent>
        </Card>

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
              {formatAed(initialOverallKpis.totalCommissionPaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total payouts recorded to date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={selectedCategory === "ALL" ? "default" : "outline"}
            className="text-xs h-8"
            onClick={() => setSelectedCategory("ALL")}
          >
            All Categories
          </Button>
          {SOURCE_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={selectedCategory === cat ? "default" : "outline"}
              className="text-xs h-8"
              onClick={() => setSelectedCategory(cat)}
            >
              {SOURCE_CATEGORY_LABELS[cat]}
            </Button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
      </div>

      {/* Sources Data Table (Section 9.2) */}
      <Card className="shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="sources-table">
            <thead className="bg-muted/50 text-xs font-medium uppercase tracking-wider text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3">Source Name</th>
                <th className="px-4 py-3">Type & Category</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3 text-center">Total Leads</th>
                <th className="px-4 py-3 text-center">Cars Bought</th>
                <th className="px-4 py-3 text-right">Purchase Value</th>
                <th className="px-4 py-3 text-right">Commission Paid</th>
                <th className="px-4 py-3">Last Deal</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSources.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No sources found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredSources.map((source) => (
                  <tr
                    key={source.id}
                    className={`hover:bg-muted/30 transition-colors ${
                      !source.isActive ? "opacity-60 bg-muted/10" : ""
                    }`}
                  >
                    {/* Name */}
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/sources/${source.id}`}
                          className="hover:underline text-primary font-semibold flex items-center gap-1"
                        >
                          {source.name}
                        </Link>
                        {!source.isActive && (
                          <Badge variant="secondary" className="text-[10px] py-0">
                            Archived
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Type & Category */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-xs text-foreground">
                          {source.typeLabel}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {source.categoryLabel}
                        </span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3 text-xs">
                      {source.phone ? (
                        <a
                          href={`tel:${source.phone}`}
                          className="text-foreground hover:text-primary flex items-center gap-1"
                        >
                          <Phone className="size-3 text-muted-foreground" />
                          {source.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">None</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {source.location ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {source.location}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* Leads */}
                    <td className="px-4 py-3 text-center text-xs font-semibold">
                      {source.kpis.totalLeads}
                    </td>

                    {/* Cars Bought */}
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className="text-xs font-medium">
                        {source.kpis.carsBought}
                      </Badge>
                    </td>

                    {/* Purchase Value in AED */}
                    <td className="px-4 py-3 text-right text-xs font-semibold">
                      {formatAed(source.kpis.totalPurchaseValue)}
                    </td>

                    {/* Commission Paid in AED */}
                    <td className="px-4 py-3 text-right text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {formatAed(source.kpis.commissionPaid)}
                    </td>

                    {/* Last Deal */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {source.kpis.lastDeal || "Never"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none cursor-pointer"
                          aria-label={`Actions for ${source.name}`}
                        >
                          <MoreHorizontal className="size-4 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            render={
                              <Link
                                href={`/sources/${source.id}`}
                                className="flex items-center gap-2 cursor-pointer"
                              />
                            }
                          >
                            <Eye className="size-4" />
                            View Profile
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => setCommissionSource(source)}
                            className="flex items-center gap-2 cursor-pointer text-amber-600 dark:text-amber-400"
                          >
                            <Coins className="size-4" />
                            Pay Commission
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => setEditingSource(source)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Edit3 className="size-4" />
                            Edit Source
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => handleToggleActive(source)}
                            disabled={isPending}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Power className="size-4" />
                            {source.isActive ? "Archive Source" : "Activate Source"}
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

      {/* Edit Source Modal */}
      {editingSource && (
        <EditSourceDialog
          source={editingSource}
          open={Boolean(editingSource)}
          onOpenChange={(open) => {
            if (!open) setEditingSource(null);
          }}
        />
      )}

      {/* Pay Commission Modal */}
      {commissionSource && (
        <PayCommissionDialog
          source={commissionSource}
          open={Boolean(commissionSource)}
          onOpenChange={(open) => {
            if (!open) setCommissionSource(null);
          }}
        />
      )}
    </div>
  );
}
