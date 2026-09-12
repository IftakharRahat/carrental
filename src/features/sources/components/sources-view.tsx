"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
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
  RefreshCw,
  Search,
  TrendingUp,
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
import { calculateOverallSourcesKpis } from "../domain/source-calculations";
import {
  SOURCE_CATEGORIES,
  SOURCE_CATEGORY_LABELS,
  type OverallSourcesKpis,
  type SourceCategory,
  type SourceRowData,
  type SourceType,
} from "../domain/source-types";
import { toggleSourceActiveAction } from "../server/source-actions";
import { AddSourceDialog } from "./add-source-dialog";
import { EditSourceDialog } from "./edit-source-dialog";
import { PayCommissionDialog } from "./pay-commission-dialog";

const SUBCATEGORIES_BY_CATEGORY: Record<
  SourceCategory,
  Array<{ type: SourceType; label: string }>
> = {
  PEOPLE: [
    { type: "GARAGE_OWNER", label: "Garage Owner" },
    { type: "MIDDLEMAN", label: "Middleman" },
    { type: "REFERRAL", label: "Referral" },
    { type: "AUCTION", label: "Auction" },
  ],
  ONLINE: [
    { type: "TIKTOK", label: "TikTok" },
    { type: "FACEBOOK", label: "Facebook" },
    { type: "INSTAGRAM", label: "Instagram" },
  ],
  OFFLINE: [
    { type: "WALK_IN", label: "Walk-in" },
  ],
};

export function SourcesView({
  initialSources,
}: {
  initialSources: SourceRowData[];
  initialOverallKpis: OverallSourcesKpis;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
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
      // Subcategory / Type filter
      if (selectedType !== "ALL" && s.type !== selectedType) {
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
  }, [initialSources, selectedCategory, selectedType, searchQuery]);

  // Reactive KPIs calculated specifically for the currently filtered category/subcategory
  const dynamicKpis = useMemo(() => {
    return calculateOverallSourcesKpis(filteredSources);
  }, [filteredSources]);

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

      {/* KPI Cards Strip (Reactive to selected category / subcategory) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        {/* 1. Top Source */}
        <Card className="shadow-xs border" size="sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Top Source
            </CardTitle>
            <Award className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-0">
            <div
              className="text-sm sm:text-base font-bold text-foreground truncate"
              title={dynamicKpis.topSource}
              data-testid="kpi-top-source"
            >
              {dynamicKpis.topSource}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              Leading channel
            </p>
          </CardContent>
        </Card>

        {/* 2. Cars Bought */}
        <Card className="shadow-xs border" size="sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Cars Bought
            </CardTitle>
            <Car className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-0">
            <div
              className="text-base sm:text-lg font-bold text-foreground"
              data-testid="kpi-cars-bought"
            >
              {dynamicKpis.totalCarsBought}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              Vehicles acquired
            </p>
          </CardContent>
        </Card>

        {/* 3. Average Profit from Source */}
        <Card className="shadow-xs border" size="sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Avg Profit / Source
            </CardTitle>
            <TrendingUp className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-0">
            <div
              className={`text-sm sm:text-base font-bold tracking-tight truncate ${
                dynamicKpis.avgProfitFromSource >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
              title={formatAed(dynamicKpis.avgProfitFromSource)}
              data-testid="kpi-avg-profit"
            >
              {formatAed(dynamicKpis.avgProfitFromSource)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              Net profit per car
            </p>
          </CardContent>
        </Card>

        {/* 4. Repeat Deal Frequency */}
        <Card className="shadow-xs border" size="sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Repeat Deals
            </CardTitle>
            <RefreshCw className="size-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-0">
            <div
              className="text-base sm:text-lg font-bold text-foreground"
              data-testid="kpi-repeat-frequency"
            >
              {dynamicKpis.repeatDealFrequency}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              Avg deals / source
            </p>
          </CardContent>
        </Card>

        {/* 5. Total Purchase Value */}
        <Card className="shadow-xs border" size="sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Purchase Value
            </CardTitle>
            <DollarSign className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-0">
            <div
              className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate"
              title={formatAed(dynamicKpis.totalPurchaseValue)}
              data-testid="kpi-purchase-value"
            >
              {formatAed(dynamicKpis.totalPurchaseValue)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              Capital deployed
            </p>
          </CardContent>
        </Card>

        {/* 6. Commission Paid */}
        <Card className="shadow-xs border" size="sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Commission Paid
            </CardTitle>
            <Coins className="size-3.5 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-0">
            <div
              className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate"
              title={formatAed(dynamicKpis.totalCommissionPaid)}
              data-testid="kpi-commission-paid"
            >
              {formatAed(dynamicKpis.totalCommissionPaid)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              Partner payouts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar with Hierarchical Category & Subcategory Pills */}
      <Card className="shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Primary Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Button
                size="sm"
                variant={selectedCategory === "ALL" ? "default" : "outline"}
                className="text-xs h-8"
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSelectedType("ALL");
                }}
              >
                All Categories
              </Button>
              {SOURCE_CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="text-xs h-8"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedType("ALL");
                  }}
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
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          {/* Subcategory Pills (Appears when a specific category is selected) */}
          {selectedCategory !== "ALL" && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-border/40">
              <span className="text-[11px] font-medium text-muted-foreground mr-1">
                Subcategory:
              </span>
              <button
                type="button"
                onClick={() => setSelectedType("ALL")}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  selectedType === "ALL"
                    ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                    : "bg-background text-muted-foreground hover:bg-muted/50 border-input"
                }`}
              >
                All {SOURCE_CATEGORY_LABELS[selectedCategory as SourceCategory]}
              </button>
              {SUBCATEGORIES_BY_CATEGORY[selectedCategory as SourceCategory]?.map((sub) => (
                <button
                  key={sub.type}
                  type="button"
                  onClick={() => setSelectedType(sub.type)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    selectedType === sub.type
                      ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                      : "bg-background text-muted-foreground hover:bg-muted/50 border-input"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
