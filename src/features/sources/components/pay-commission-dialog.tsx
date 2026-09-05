"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Coins } from "lucide-react";
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
import { recordSourceCommissionAction } from "../server/source-actions";

type CarOption = {
  id: string;
  carNumber: number;
  brand: string;
  model: string;
  year?: number | null;
};

export function PayCommissionDialog({
  source,
  availableCars = [],
  open,
  onOpenChange,
}: {
  source: { id: string; name: string };
  availableCars?: CarOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [carId, setCarId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "BANK_TRANSFER" | "CHEQUE" | "OTHER"
  >("CASH");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    startTransition(async () => {
      const res = await recordSourceCommissionAction({
        sourceId: source.id,
        carId: carId || undefined,
        amount,
        paymentDate,
        paymentMethod,
        notes: notes || undefined,
      });

      if (!res.ok) {
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
        toast.error(res.message || "Failed to record commission");
        return;
      }

      toast.success(
        `Commission of AED ${amount} paid to ${source.name} recorded successfully`,
      );
      onOpenChange(false);
      setAmount("");
      setNotes("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="size-5 text-amber-500" />
            Pay Commission - {source.name}
          </DialogTitle>
          <DialogDescription>
            Creates a Money Out cash transaction linked to this source (Section 9.3).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Optional Linked Car */}
          <div className="space-y-1.5">
            <Label htmlFor="commissionCar">Linked Car (Optional)</Label>
            <select
              id="commissionCar"
              value={carId}
              onChange={(e) => setCarId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">-- General / Not Linked to Specific Car --</option>
              {availableCars.map((c) => (
                <option key={c.id} value={c.id}>
                  CAR-{String(c.carNumber).padStart(4, "0")} ({c.brand} {c.model} {c.year || ""})
                </option>
              ))}
            </select>
          </div>

          {/* Amount in AED */}
          <div className="space-y-1.5">
            <Label htmlFor="commissionAmount">Commission Amount (AED) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-semibold text-muted-foreground">
                AED
              </span>
              <Input
                id="commissionAmount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-12"
                required
              />
            </div>
            {fieldErrors.amount && (
              <p className="text-xs text-destructive">{fieldErrors.amount[0]}</p>
            )}
          </div>

          {/* Payment Date & Method */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="commissionDate">Payment Date *</Label>
              <Input
                id="commissionDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="commissionMethod">Payment Method *</Label>
              <select
                id="commissionMethod"
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value as "CASH" | "BANK_TRANSFER" | "CHEQUE" | "OTHER",
                  )
                }
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="commissionNotes">Notes / Reference</Label>
            <Textarea
              id="commissionNotes"
              placeholder="e.g. Agreed 500 AED referral for Camry deal"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isPending ? "Recording..." : "Record Commission"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
