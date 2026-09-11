"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Calculator, CarFront, Layers, Plus, Save } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BulkBuyCarForm } from "./bulk-buy-car-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  peopleSourceTypes,
  sourceTypeValues,
  type SourceType,
} from "@/features/cars/domain/car-input";
import { formatAed } from "@/lib/currency";
import {
  createCarAction,
  type CreateCarActionResult,
} from "@/features/cars/server/create-car-action";
import { createBrandAction } from "@/features/cars/server/brand-actions";
import type {
  SellerOption,
  SourceOption,
} from "@/features/cars/server/reference-data";
import { AddSellerDialog, AddSourceDialog } from "./contact-modals";
import { PhotoPicker } from "./photo-picker";
import { ReferencePicker } from "./reference-picker";

const requiredText = z.string().trim().min(1, "Required");
const clientSchema = z
  .object({
    purchaseDate: z.string().date("Enter a valid purchase date"),
    sellerId: requiredText,
    brand: requiredText,
    model: requiredText,
    year: z
      .string()
      .refine(
        (value) =>
          !value ||
          (/^\d{4}$/.test(value) &&
            Number(value) >= 1900 &&
            Number(value) <= new Date().getFullYear() + 1),
        "Enter a sensible four-digit year",
      ),
    condition: z.enum([
      "SCRAP",
      "ACCIDENT_DAMAGED",
      "ENGINE_ISSUE",
      "GEARBOX_ISSUE",
      "OTHER",
    ]),
    conditionOther: z.string(),
    purchasePrice: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid AED amount")
      .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
    paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
    sourceType: z.enum(sourceTypeValues),
    sourceId: z.string(),
    vinChassis: z.string(),
    notes: z.string(),
    allowFutureDate: z.boolean(),
    confirmDuplicateVin: z.boolean(),
  })
  .refine(
    (values) => values.condition !== "OTHER" || values.conditionOther.trim(),
    {
      path: ["conditionOther"],
      message: "Describe the other condition",
    },
  )
  .refine(
    (values) => !peopleSourceTypes.has(values.sourceType) || values.sourceId,
    { path: ["sourceId"], message: "Select a source name" },
  );

type FormValues = z.infer<typeof clientSchema>;

type BuyCarFormProps = {
  initialSellers: SellerOption[];
  initialSources: SourceOption[];
  initialBrands?: string[];
  purchaseDate: string;
  idempotencyKey: string;
};

export function BuyCarForm({
  initialSellers,
  initialSources,
  initialBrands,
  purchaseDate,
  idempotencyKey,
}: BuyCarFormProps) {
  const [sellers, setSellers] = useState(initialSellers);
  const [sources, setSources] = useState(initialSources);
  const [brands, setBrands] = useState(
    initialBrands && initialBrands.length > 0 ? initialBrands : commonBrands,
  );
  const [photos, setPhotos] = useState<File[]>([]);
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
  const [sellerDialogOpen, setSellerDialogOpen] = useState(false);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [purchaseMode, setPurchaseMode] = useState<"SINGLE" | "BULK">("SINGLE");
  const [actionResult, setActionResult] = useState<CreateCarActionResult>();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      purchaseDate,
      sellerId: "",
      brand: "",
      model: "",
      year: "",
      condition: "SCRAP",
      conditionOther: "",
      purchasePrice: "",
      paymentMethod: "CASH",
      sourceType: "WALK_IN",
      sourceId: "",
      vinChassis: "",
      notes: "",
      allowFutureDate: false,
      confirmDuplicateVin: false,
    },
  });

  const values = useWatch({ control }) as FormValues;
  const matchingSources = useMemo(
    () => sources.filter((source) => source.type === values.sourceType),
    [sources, values.sourceType],
  );
  const summaryLabel = [values.brand || "New car", values.model, values.year]
    .filter(Boolean)
    .join(" ");

  function submit(formValues: FormValues) {
    setActionResult(undefined);
    const formData = new FormData();
    Object.entries(formValues).forEach(([key, value]) =>
      formData.set(key, typeof value === "boolean" ? String(value) : value),
    );
    formData.set("idempotencyKey", idempotencyKey);
    formData.set("mainPhotoIndex", String(mainPhotoIndex));
    photos.forEach((photo) => formData.append("photos", photo));

    startTransition(async () => {
      const result = await createCarAction(formData);
      setActionResult(result);
    });
  }

  function fieldError(name: keyof FormValues): string | undefined {
    const clientMessage = errors[name]?.message;
    if (clientMessage) return clientMessage;
    return actionResult?.ok === false
      ? actionResult.fieldErrors?.[name]?.[0]
      : undefined;
  }

  return (
    <div className="space-y-6">
      {/* Mode Switch: Single Car vs Bulk Quantity */}
      <div className="flex items-center justify-between bg-muted/40 p-1.5 rounded-xl border max-w-md shadow-xs">
        <button
          type="button"
          onClick={() => setPurchaseMode("SINGLE")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            purchaseMode === "SINGLE"
              ? "bg-background text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid="mode-single-car"
        >
          <CarFront className="size-4" />
          Single Car (Default)
        </button>
        <button
          type="button"
          onClick={() => setPurchaseMode("BULK")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            purchaseMode === "BULK"
              ? "bg-background text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid="mode-bulk-quantity"
        >
          <Layers className="size-4 text-primary" />
          Bulk Quantity (4, 5, 8+ Cars)
        </button>
      </div>

      {purchaseMode === "BULK" ? (
        <BulkBuyCarForm
          initialSellers={sellers}
          initialSources={sources}
          initialBrands={brands}
          purchaseDate={purchaseDate}
        />
      ) : (
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          {actionResult?.ok === false && (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/5 text-destructive flex gap-3 rounded-lg border p-3 text-sm"
            >
              <AlertCircle className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-medium">{actionResult.message}</p>
                {actionResult.duplicateVin && (
                  <p className="mt-1">
                    Match: {actionResult.duplicateVin.carNumber} ·{" "}
                    {actionResult.duplicateVin.carLabel}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <FormSection
            title="Basic information"
            description="Identify the vehicle and purchase date."
          >
            <Field label="Car ID" hint="Assigned automatically when saved">
              <Input value="CAR-0000 (automatic)" disabled />
            </Field>
            <Field label="Purchase date *" error={fieldError("purchaseDate")}>
              <Input
                type="date"
                {...register("purchaseDate")}
                aria-invalid={Boolean(fieldError("purchaseDate"))}
              />
            </Field>
            <Field
              label={
                <div className="flex items-center justify-between">
                  <span>Brand *</span>
                  <button
                    type="button"
                    onClick={() => setBrandDialogOpen(true)}
                    className="text-primary hover:text-primary/80 hover:underline text-xs flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Plus className="size-3" />
                    Add Brand
                  </button>
                </div>
              }
              error={fieldError("brand")}
            >
              <Input
                list="car-brands"
                placeholder="Toyota, Nissan, BMW..."
                value={values.brand || ""}
                onChange={(e) =>
                  setValue("brand", e.target.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
              />
              <datalist id="car-brands">
                {brands.map((brand) => (
                  <option key={brand} value={brand} />
                ))}
              </datalist>
            </Field>
            <Field label="Model *" error={fieldError("model")}>
              <Input placeholder="Camry" {...register("model")} />
            </Field>
            <Field label="Year" error={fieldError("year")}>
              <Input
                inputMode="numeric"
                maxLength={4}
                placeholder="2018"
                {...register("year")}
              />
            </Field>
            <Field label="Condition *" error={fieldError("condition")}>
              <NativeSelect {...register("condition")}>
                {conditionOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            {values.condition === "OTHER" && (
              <Field
                label="Other condition *"
                error={fieldError("conditionOther")}
                className="sm:col-span-2"
              >
                <Input
                  placeholder="Describe the vehicle condition"
                  {...register("conditionOther")}
                />
              </Field>
            )}
          </FormSection>

          <FormSection
            title="Purchase"
            description="Record the initial investment only."
          >
            <Field
              label="Purchase price (AED) *"
              error={fieldError("purchasePrice")}
            >
              <Input
                inputMode="decimal"
                placeholder="8000.00"
                {...register("purchasePrice")}
              />
            </Field>
            <Field label="Payment method *" error={fieldError("paymentMethod")}>
              <NativeSelect {...register("paymentMethod")}>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </NativeSelect>
            </Field>
            <Field
              label="VIN / Chassis"
              error={fieldError("vinChassis")}
              className="sm:col-span-2"
            >
              <Input
                placeholder="Searchable vehicle identifier"
                {...register("vinChassis")}
              />
            </Field>
            {actionResult?.ok === false && actionResult.duplicateVin && (
              <label className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  {...register("confirmDuplicateVin")}
                />
                <span>
                  <strong>Admin override:</strong> I reviewed the duplicate VIN
                  warning and want to continue.
                </span>
              </label>
            )}
            <label className="flex items-start gap-3 text-sm sm:col-span-2">
              <input
                type="checkbox"
                className="mt-1"
                {...register("allowFutureDate")}
              />
              <span>Admin override for a future purchase date</span>
            </label>
          </FormSection>

          <FormSection
            title="Seller"
            description="Select the actual owner or person selling this vehicle."
            single
          >
            <Field label="Seller *" error={fieldError("sellerId")}>
              <ReferencePicker
                options={sellers}
                value={values.sellerId}
                onChange={(id) =>
                  setValue("sellerId", id, { shouldValidate: true })
                }
                placeholder="Search sellers"
                emptyText="No seller found"
                addLabel="Add new seller"
                onAdd={() => setSellerDialogOpen(true)}
              />
            </Field>
          </FormSection>

          <FormSection
            title="Source"
            description="Track how this purchase reached the business."
          >
            <Field label="Source type *" error={fieldError("sourceType")}>
              <NativeSelect
                {...register("sourceType")}
                onChange={(event) => {
                  register("sourceType").onChange(event);
                  setValue("sourceId", "");
                }}
              >
                {sourceTypeValues.map((value) => (
                  <option key={value} value={value}>
                    {sourceTypeLabels[value]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field
              label={`Source name${peopleSourceTypes.has(values.sourceType) ? " *" : ""}`}
              error={fieldError("sourceId")}
            >
              <ReferencePicker
                key={`source-${values.sourceType}-${values.sourceId}`}
                options={matchingSources}
                value={values.sourceId}
                onChange={(id) =>
                  setValue("sourceId", id, { shouldValidate: true })
                }
                placeholder="Search known sources"
                emptyText="No matching source found"
                addLabel="Add new source"
                onAdd={() => setSourceDialogOpen(true)}
              />
            </Field>
          </FormSection>

          <FormSection
            title="Photos"
            description="Upload vehicle images and choose the main photo."
            single
          >
            <PhotoPicker
              files={photos}
              mainIndex={mainPhotoIndex}
              onChange={(nextPhotos, nextMainIndex) => {
                setPhotos(nextPhotos);
                setMainPhotoIndex(nextMainIndex);
              }}
            />
          </FormSection>

          <FormSection
            title="Notes"
            description="Operational information for your team."
            single
          >
            <Field label="Notes" error={fieldError("notes")}>
              <Textarea
                rows={5}
                maxLength={2000}
                placeholder="Optional operational notes"
                {...register("notes")}
              />
            </Field>
          </FormSection>
        </div>

        <aside className="xl:sticky xl:top-5 xl:self-start">
          <Card size="sm" className="shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="text-primary size-5" />
                <CardTitle>Purchase summary</CardTitle>
              </div>
              <CardDescription>
                Car expenses start at zero and are added later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
                <div className="bg-background text-primary flex size-10 items-center justify-center rounded-lg">
                  <CarFront className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{summaryLabel}</p>
                  <Badge variant="outline" className="mt-1">
                    New purchase
                  </Badge>
                </div>
              </div>
              <SummaryLine
                label="Purchase price"
                value={formatAed(values.purchasePrice)}
              />
              <SummaryLine label="Car expenses" value="AED 0.00" />
              <div className="border-t pt-4">
                <SummaryLine
                  label="Initial investment"
                  value={formatAed(values.purchasePrice)}
                  strong
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isPending}
              >
                <Save className="size-4" />
                {isPending ? "Saving car…" : "Save Car"}
              </Button>
              <p className="text-muted-foreground text-center text-xs leading-5">
                Saving creates the car and its matching money-out purchase
                transaction.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      <AddSellerDialog
        open={sellerDialogOpen}
        onOpenChange={setSellerDialogOpen}
        onCreated={(seller) => {
          setSellers((current) => [...current, seller]);
          setValue("sellerId", seller.id, { shouldValidate: true });
        }}
      />
      <AddSourceDialog
        open={sourceDialogOpen}
        onOpenChange={setSourceDialogOpen}
        defaultType={values.sourceType}
        onCreated={(source) => {
          setSources((current) => [...current, source]);
          setValue("sourceId", source.id, { shouldValidate: true });
        }}
      />
      <AddBrandDialog
        open={brandDialogOpen}
        onOpenChange={setBrandDialogOpen}
        onCreated={(newBrand) => {
          setBrands((current) =>
            current.includes(newBrand) ? current : [newBrand, ...current],
          );
          setValue("brand", newBrand, { shouldValidate: true });
        }}
      />
        </form>
      )}
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
  single = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  single?: boolean;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent
        className={single ? "space-y-3" : "grid gap-x-4 gap-y-3 sm:grid-cols-2"}
      >
        {children}
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: React.ReactNode;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      {typeof label === "string" ? <Label>{label}</Label> : label}
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

function NativeSelect(props: React.ComponentProps<"select">) {
  return (
    <select
      {...props}
      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3"
    />
  );
}

function SummaryLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={
        strong
          ? "flex justify-between gap-4 font-semibold"
          : "flex justify-between gap-4 text-sm"
      }
    >
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

const commonBrands = [
  "Toyota",
  "Nissan",
  "BMW",
  "Mercedes-Benz",
  "Honda",
  "Ford",
  "Hyundai",
  "Kia",
  "Lexus",
  "Audi",
  "Chevrolet",
  "Mitsubishi",
  "Volkswagen",
  "Mazda",
  "Land Rover",
  "Porsche",
  "Suzuki",
  "Jeep",
  "Volvo",
  "Renault",
  "Peugeot",
  "GMC",
  "Dodge",
  "Infiniti",
  "Subaru",
  "Cadillac",
  "Jaguar",
  "MG",
  "BYD",
  "Chery",
  "Geely",
  "Haval",
  "Changan",
  "Jetour",
];

export function AddBrandDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (brand: string) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a brand name");
      return;
    }

    startTransition(async () => {
      const res = await createBrandAction(trimmed);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      onCreated(trimmed);
      setName("");
      setError(undefined);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Brand</DialogTitle>
          <DialogDescription>
            Enter the vehicle manufacturer or brand name.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-brand-name">Brand Name *</Label>
            <Input
              id="new-brand-name"
              placeholder="e.g. Audi, Changan, BYD, Porsche"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(undefined);
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending || !name.trim()}
          >
            {isPending ? "Adding..." : "Add Brand"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const conditionOptions = [
  ["SCRAP", "Scrap"],
  ["ACCIDENT_DAMAGED", "Accident / Damaged"],
  ["ENGINE_ISSUE", "Engine Issue"],
  ["GEARBOX_ISSUE", "Gearbox Issue"],
  ["OTHER", "Other"],
] as const;

const sourceTypeLabels: Record<SourceType, string> = {
  GARAGE_OWNER: "Garage Owner",
  MIDDLEMAN: "Middleman",
  REFERRAL: "Referral",
  AUCTION: "Auction",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  WALK_IN: "Walk-in",
};
