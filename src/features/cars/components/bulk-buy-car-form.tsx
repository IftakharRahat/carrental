"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  Copy,
  Layers,
  Plus,
  Printer,
  Sparkles,
  Trash2,
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAed } from "@/lib/currency";
import {
  calculateBulkSummary,
  type BulkCarItem,
} from "../domain/bulk-car-input";
import {
  peopleSourceTypes,
  sourceTypeValues,
  type SourceType,
} from "../domain/car-input";
import {
  bulkCreateCarsAction,
  type BulkCreateCarResult,
} from "../server/bulk-create-car-action";
import type {
  SellerOption,
  SourceOption,
} from "../server/reference-data";
import { AddBrandDialog } from "./buy-car-form";
import { AddSellerDialog, AddSourceDialog } from "./contact-modals";
import { ReferencePicker } from "./reference-picker";

type BulkBuyCarFormProps = {
  initialSellers: SellerOption[];
  initialSources: SourceOption[];
  initialBrands?: string[];
  purchaseDate: string;
};

const emptyCarItem = (): BulkCarItem => ({
  brand: "",
  model: "",
  year: "",
  condition: "SCRAP",
  conditionOther: "",
  purchasePrice: "",
  vinChassis: "",
  notes: "",
});

export function BulkBuyCarForm({
  initialSellers,
  initialSources,
  initialBrands = [],
  purchaseDate,
}: BulkBuyCarFormProps) {
  const router = useRouter();
  const [sellers, setSellers] = useState(initialSellers);
  const [sources, setSources] = useState(initialSources);
  const [brands, setBrands] = useState(initialBrands);

  // Modals state
  const [sellerDialogOpen, setSellerDialogOpen] = useState(false);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);

  // Common batch fields
  const [batchDate, setBatchDate] = useState(purchaseDate);
  const [sellerId, setSellerId] = useState(initialSellers[0]?.id || "");
  const [sourceType, setSourceType] = useState<SourceType>("GARAGE_OWNER");
  const [sourceId, setSourceId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "BANK_TRANSFER" | "CHEQUE" | "OTHER"
  >("CASH");
  const [batchNotes, setBatchNotes] = useState("");

  // Cars in the batch (starts with 3 items)
  const [items, setItems] = useState<BulkCarItem[]>([
    emptyCarItem(),
    emptyCarItem(),
    emptyCarItem(),
  ]);

  // Lump sum calculator
  const [lumpSumAmount, setLumpSumAmount] = useState("");

  // Submission & Result
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<
    Extract<BulkCreateCarResult, { ok: true }> | null
  >(null);

  const matchingSources = useMemo(
    () => sources.filter((s) => s.type === sourceType),
    [sources, sourceType],
  );

  const summary = useMemo(() => calculateBulkSummary(items), [items]);

  // Helper to update individual car fields
  const updateItem = (index: number, field: keyof BulkCarItem, value: string) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Helper to remove a car
  const removeItem = (index: number) => {
    if (items.length <= 2) {
      toast.error("Bulk purchase must contain at least 2 vehicles.");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Preset car count handlers
  const setExactCarCount = (count: number) => {
    setItems((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        const toAdd = count - prev.length;
        const newItems = Array.from({ length: toAdd }, () => emptyCarItem());
        return [...prev, ...newItems];
      }
      return prev.slice(0, count);
    });
  };

  const addCar = () => {
    setItems((prev) => [...prev, emptyCarItem()]);
  };

  // Distribute lump sum equally
  const handleDistributeLumpSum = () => {
    const total = Number(lumpSumAmount);
    if (!total || total <= 0) {
      toast.error("Enter a valid total lump sum amount first.");
      return;
    }
    const perCar = (total / items.length).toFixed(2);
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        purchasePrice: perCar,
      })),
    );
    toast.success(
      `Distributed AED ${formatAed(total)} equally across ${items.length} cars (${formatAed(Number(perCar))} each)`,
    );
  };

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!sellerId) {
      setActionError("Please select a seller for this bulk purchase.");
      return;
    }

    if (peopleSourceTypes.has(sourceType) && !sourceId) {
      setActionError("Please select a source name for this channel.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.brand.trim()) {
        setActionError(`Car #${i + 1} is missing a brand name.`);
        return;
      }
      if (!item.model.trim()) {
        setActionError(`Car #${i + 1} (${item.brand}) is missing a model.`);
        return;
      }
      if (!item.purchasePrice || Number(item.purchasePrice) <= 0) {
        setActionError(
          `Car #${i + 1} (${item.brand} ${item.model}) must have a purchase price > 0.`,
        );
        return;
      }
    }

    startTransition(async () => {
      const result = await bulkCreateCarsAction({
        purchaseDate: batchDate,
        sellerId,
        sourceType,
        sourceId,
        paymentMethod,
        batchNotes,
        items,
      });

      if (!result.ok) {
        setActionError(result.message);
        toast.error(result.message);
        return;
      }

      toast.success(
        `Successfully purchased ${result.count} vehicles in bulk! (Total: ${formatAed(result.totalAmount)})`,
      );
      setSuccessData(result);
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {actionError && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive text-sm flex items-center gap-3"
          >
            <AlertCircle className="size-5 shrink-0" />
            <p className="font-medium">{actionError}</p>
          </div>
        )}

        {/* 1. Common Batch Information */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Layers className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Batch Information & Seller
                </CardTitle>
                <CardDescription className="text-xs">
                  Common acquisition details shared across all vehicles in this bulk purchase.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Purchase Date */}
              <div className="space-y-1.5">
                <Label htmlFor="batch-date" className="text-xs font-medium">
                  Purchase Date *
                </Label>
                <Input
                  id="batch-date"
                  type="date"
                  value={batchDate}
                  onChange={(e) => setBatchDate(e.target.value)}
                  required
                />
              </div>

              {/* Seller */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="batch-seller" className="text-xs font-medium">
                    Seller (Garage / Middleman) *
                  </Label>
                  <button
                    type="button"
                    onClick={() => setSellerDialogOpen(true)}
                    className="text-primary hover:underline text-[11px] font-semibold flex items-center gap-0.5"
                  >
                    <Plus className="size-3" /> Add Seller
                  </button>
                </div>
                <select
                  id="batch-seller"
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select seller...</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.detail ? `(${s.detail})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Channel */}
              <div className="space-y-1.5">
                <Label htmlFor="batch-source-type" className="text-xs font-medium">
                  Source Channel *
                </Label>
                <select
                  id="batch-source-type"
                  value={sourceType}
                  onChange={(e) => {
                    const newType = e.target.value as SourceType;
                    setSourceType(newType);
                    setSourceId("");
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {sourceTypeValues.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <Label htmlFor="batch-payment" className="text-xs font-medium">
                  Payment Method *
                </Label>
                <select
                  id="batch-payment"
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value as "CASH" | "BANK_TRANSFER" | "CHEQUE" | "OTHER",
                    )
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Source Name picker if needed */}
            {peopleSourceTypes.has(sourceType) && (
              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="batch-source-name" className="text-xs font-medium">
                      Source Name *
                    </Label>
                    <button
                      type="button"
                      onClick={() => setSourceDialogOpen(true)}
                      className="text-primary hover:underline text-[11px] font-semibold flex items-center gap-0.5"
                    >
                      <Plus className="size-3" /> Add Source
                    </button>
                  </div>
                  <select
                    id="batch-source-name"
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Select source name...</option>
                    {matchingSources.map((src) => (
                      <option key={src.id} value={src.id}>
                        {src.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="batch-notes" className="text-xs font-medium">
                    Batch Notes (Optional)
                  </Label>
                  <Input
                    id="batch-notes"
                    placeholder="e.g. Al Quoz garage clearance deal"
                    value={batchNotes}
                    onChange={(e) => setBatchNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Quick Presets & Lump-Sum Pricing Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3.5 rounded-xl border">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1">
              Quick Presets:
            </span>
            <Button
              type="button"
              variant={items.length === 3 ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs font-medium"
              onClick={() => setExactCarCount(3)}
            >
              3 Cars
            </Button>
            <Button
              type="button"
              variant={items.length === 4 ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs font-medium"
              onClick={() => setExactCarCount(4)}
            >
              4 Cars
            </Button>
            <Button
              type="button"
              variant={items.length === 5 ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs font-medium"
              onClick={() => setExactCarCount(5)}
            >
              5 Cars
            </Button>
            <Button
              type="button"
              variant={items.length === 8 ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs font-medium"
              onClick={() => setExactCarCount(8)}
            >
              8 Cars
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs font-medium border-dashed"
              onClick={addCar}
            >
              <Plus className="size-3 mr-1" /> Add Car
            </Button>
          </div>

          {/* Lump Sum Splitter Tool */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                AED
              </span>
              <Input
                type="number"
                placeholder="Total lump sum"
                className="h-8 pl-10 w-36 text-xs"
                value={lumpSumAmount}
                onChange={(e) => setLumpSumAmount(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 text-xs gap-1.5 shadow-xs"
              onClick={handleDistributeLumpSum}
            >
              <Calculator className="size-3.5" />
              Split Lump Sum
            </Button>
          </div>
        </div>

        {/* 3. Car Items List and Sticky Summary */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* Cars List */}
          <div className="space-y-4">
            {items.map((car, index) => (
              <Card key={index} className="shadow-xs border-border/80 relative">
                <CardHeader className="py-2.5 px-4 bg-muted/30 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-bold bg-background">
                      Car #{index + 1}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {car.brand || car.model ? `${car.brand} ${car.model}` : "Pending details"}
                    </span>
                  </div>
                  {items.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(index)}
                      title="Remove this car from batch"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Brand *</Label>
                        <button
                          type="button"
                          onClick={() => setBrandDialogOpen(true)}
                          className="text-primary hover:underline text-[10px] font-semibold"
                        >
                          + New
                        </button>
                      </div>
                      <Input
                        list="car-brands"
                        placeholder="e.g. Toyota"
                        value={car.brand}
                        onChange={(e) => updateItem(index, "brand", e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>

                    {/* Model */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Model *</Label>
                      <Input
                        placeholder="e.g. Camry"
                        value={car.model}
                        onChange={(e) => updateItem(index, "model", e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>

                    {/* Year */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Year</Label>
                      <Input
                        placeholder="e.g. 2018"
                        value={car.year || ""}
                        onChange={(e) => updateItem(index, "year", e.target.value)}
                        maxLength={4}
                        className="text-xs"
                      />
                    </div>

                    {/* Condition */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Condition *</Label>
                      <select
                        value={car.condition}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "condition",
                            e.target.value as BulkCarItem["condition"],
                          )
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="SCRAP">Scrap</option>
                        <option value="ACCIDENT_DAMAGED">Accident Damaged</option>
                        <option value="ENGINE_ISSUE">Engine Issue</option>
                        <option value="GEARBOX_ISSUE">Gearbox Issue</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    {/* Purchase Price */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Purchase Price (AED) *</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                          AED
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={car.purchasePrice}
                          onChange={(e) => updateItem(index, "purchasePrice", e.target.value)}
                          required
                          className="pl-10 text-xs font-semibold"
                        />
                      </div>
                    </div>

                    {/* VIN / Chassis */}
                    <div className="space-y-1 sm:col-span-3">
                      <Label className="text-xs font-medium">
                        VIN / Chassis (Optional)
                      </Label>
                      <Input
                        placeholder="Optional VIN or Chassis identifier"
                        value={car.vinChassis || ""}
                        onChange={(e) => updateItem(index, "vinChassis", e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-dashed h-10 gap-1.5"
              onClick={addCar}
            >
              <Plus className="size-4" /> Add Another Vehicle to Batch
            </Button>
          </div>

          {/* Sticky Summary & Submit Panel */}
          <div className="space-y-4 xl:sticky xl:top-6 self-start">
            <Card className="shadow-md border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span>Bulk Deal Summary</span>
                  <Badge variant="outline" className="text-primary font-bold">
                    {summary.totalCarsCount} Vehicles
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Consolidated financial impact of this acquisition batch.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 border-t pt-3 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Vehicles:</span>
                    <span className="font-semibold text-foreground">
                      {summary.totalCarsCount} Cars
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Average Cost / Car:</span>
                    <span className="font-semibold text-foreground">
                      {formatAed(summary.averagePricePerCar)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Payment Method:</span>
                    <span className="font-semibold capitalize text-foreground">
                      {paymentMethod.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t text-sm font-bold">
                    <span>Total Investment:</span>
                    <span className="text-lg text-primary">
                      {formatAed(summary.totalInvestment)}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-bold shadow-md"
                  disabled={isPending}
                >
                  {isPending ? "Recording Bulk Purchase..." : `Save Bulk Purchase (${summary.totalCarsCount} Cars)`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Datalist for Brand Autocomplete */}
      <datalist id="car-brands">
        {brands.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>

      {/* Contact & Brand Modals */}
      <AddSellerDialog
        open={sellerDialogOpen}
        onOpenChange={setSellerDialogOpen}
        onCreated={(newSeller) => {
          setSellers((prev) => [...prev, newSeller]);
          setSellerId(newSeller.id);
        }}
      />
      <AddSourceDialog
        open={sourceDialogOpen}
        onOpenChange={setSourceDialogOpen}
        defaultType={sourceType}
        onCreated={(newSource) => {
          setSources((prev) => [...prev, newSource]);
          setSourceId(newSource.id);
        }}
      />
      <AddBrandDialog
        open={brandDialogOpen}
        onOpenChange={setBrandDialogOpen}
        onCreated={(newBrand) => {
          setBrands((prev) => [...prev, newBrand]);
        }}
      />

      {/* Success Modal */}
      {successData && (
        <Dialog open={Boolean(successData)} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-[550px]" showCloseButton={false}>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">
                    Bulk Purchase Completed!
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    {successData.count} vehicles have been recorded with sequential IDs.
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="py-3 space-y-3">
              <div className="rounded-lg border bg-muted/20 p-3 flex justify-between items-center text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">
                    Total Paid to Seller
                  </span>
                  <span className="text-base font-bold text-foreground">
                    {formatAed(successData.totalAmount)}
                  </span>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 font-semibold border-emerald-500/30">
                  {successData.count} Cars Added
                </Badge>
              </div>

              <div className="rounded-lg border max-h-48 overflow-y-auto divide-y text-xs">
                {successData.cars.map((car, idx) => (
                  <div key={car.id} className="p-2.5 flex justify-between items-center hover:bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">
                        {car.carNumber}
                      </span>
                      <span className="font-medium text-foreground">
                        {car.brand} {car.model}
                      </span>
                    </div>
                    <span className="font-semibold text-muted-foreground">
                      {formatAed(car.purchasePrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSuccessData(null);
                  setItems([emptyCarItem(), emptyCarItem(), emptyCarItem()]);
                }}
              >
                Buy Another Batch
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => router.push("/stock")}
              >
                View in Stock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
