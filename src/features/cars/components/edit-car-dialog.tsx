"use client";

import { useEffect, useState, useTransition } from "react";
import { Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { conditionLabels } from "@/features/stock/domain/stock-types";
import type { CarDetailsFull, CarStatus } from "../domain/car-details-types";
import { updateCarAction } from "../server/update-car-action";

type EditCarDialogProps = {
  car: CarDetailsFull;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const paymentMethodOptions = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

export function EditCarDialog({ car, open, onOpenChange }: EditCarDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Form state
  const [brand, setBrand] = useState(car.brand);
  const [model, setModel] = useState(car.model);
  const [year, setYear] = useState(car.year?.toString() ?? "");
  const [status, setStatus] = useState<CarStatus>(car.status);
  const [condition, setCondition] = useState(car.condition);
  const [conditionOther, setConditionOther] = useState(car.conditionOther ?? "");
  const [purchasePrice, setPurchasePrice] = useState(car.purchasePrice.toString());
  const [paymentMethod, setPaymentMethod] = useState(car.paymentMethod);
  const [vinChassis, setVinChassis] = useState(car.vinChassis ?? "");
  const [notes, setNotes] = useState(car.notes ?? "");

  useEffect(() => {
    if (open) {
      setBrand(car.brand);
      setModel(car.model);
      setYear(car.year?.toString() ?? "");
      setStatus(car.status);
      setCondition(car.condition);
      setConditionOther(car.conditionOther ?? "");
      setPurchasePrice(car.purchasePrice.toString());
      setPaymentMethod(car.paymentMethod);
      setVinChassis(car.vinChassis ?? "");
      setNotes(car.notes ?? "");
      setFieldErrors({});
    }
  }, [open, car]);

  function resetForm() {
    setBrand(car.brand);
    setModel(car.model);
    setYear(car.year?.toString() ?? "");
    setStatus(car.status);
    setCondition(car.condition);
    setConditionOther(car.conditionOther ?? "");
    setPurchasePrice(car.purchasePrice.toString());
    setPaymentMethod(car.paymentMethod);
    setVinChassis(car.vinChassis ?? "");
    setNotes(car.notes ?? "");
    setFieldErrors({});
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  }

  function handleSubmit() {
    const formData = new FormData();
    formData.set("carId", car.id);
    formData.set("brand", brand);
    formData.set("model", model);
    formData.set("year", year);
    formData.set("status", status);
    formData.set("condition", condition);
    formData.set("conditionOther", conditionOther);
    formData.set("purchasePrice", purchasePrice);
    formData.set("paymentMethod", paymentMethod);
    formData.set("vinChassis", vinChassis);
    formData.set("notes", notes);

    startTransition(async () => {
      const result = await updateCarAction(formData);

      if (result.ok) {
        toast.success("Car details updated successfully.");
        setFieldErrors({});
        onOpenChange(false);
      } else {
        toast.error(result.message);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Edit className="size-4 text-primary" />
            Edit Car Details — {car.carNumber}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Update the vehicle information, status, and pricing. Changes to
            purchase price will automatically update the finance ledger.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Brand & Model */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-brand" className="text-xs font-medium">
                Brand <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Toyota"
                className="text-sm"
              />
              {fieldErrors.brand && (
                <p className="text-xs text-destructive">{fieldErrors.brand[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-model" className="text-xs font-medium">
                Model <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Camry"
                className="text-sm"
              />
              {fieldErrors.model && (
                <p className="text-xs text-destructive">{fieldErrors.model[0]}</p>
              )}
            </div>
          </div>

          {/* Year & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-year" className="text-xs font-medium">
                Year
              </Label>
              <Input
                id="edit-year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2015"
                className="text-sm"
              />
              {fieldErrors.year && (
                <p className="text-xs text-destructive">{fieldErrors.year[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-status" className="text-xs font-medium">
                Status <span className="text-destructive">*</span>
              </Label>
              <select
                id="edit-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as CarStatus)}
                className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium"
              >
                <option value="IN_STOCK">In Stock</option>
                <option value="PARTIALLY_RECOVERED">Partially Recovered</option>
                <option value="COMPLETED">Completed</option>
                <option value="VOIDED">Voided</option>
              </select>
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-condition" className="text-xs font-medium">
              Condition <span className="text-destructive">*</span>
            </Label>
            <select
              id="edit-condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value as typeof condition)}
              className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {Object.entries(conditionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Condition Other (conditional) */}
          {condition === "OTHER" && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-conditionOther" className="text-xs font-medium">
                Describe Condition <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-conditionOther"
                value={conditionOther}
                onChange={(e) => setConditionOther(e.target.value)}
                placeholder="Describe the vehicle condition"
                className="text-sm"
              />
              {fieldErrors.conditionOther && (
                <p className="text-xs text-destructive">
                  {fieldErrors.conditionOther[0]}
                </p>
              )}
            </div>
          )}

          {/* Purchase Price & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-price" className="text-xs font-medium">
                Purchase Price (AED) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-price"
                type="text"
                inputMode="decimal"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="e.g. 3500"
                className="text-sm"
              />
              {fieldErrors.purchasePrice && (
                <p className="text-xs text-destructive">
                  {fieldErrors.purchasePrice[0]}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-payment" className="text-xs font-medium">
                Payment Method <span className="text-destructive">*</span>
              </Label>
              <select
                id="edit-payment"
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as typeof paymentMethod)
                }
                className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {paymentMethodOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* VIN / Chassis */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-vin" className="text-xs font-medium">
              VIN / Chassis No.
            </Label>
            <Input
              id="edit-vin"
              value={vinChassis}
              onChange={(e) => setVinChassis(e.target.value)}
              placeholder="Optional"
              className="text-sm"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-notes" className="text-xs font-medium">
              Notes
            </Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes..."
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
