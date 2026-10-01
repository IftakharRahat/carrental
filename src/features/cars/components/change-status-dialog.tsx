"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock, Loader2, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateCarStatusAction } from "../server/update-car-status-action";

type StatusOption = "IN_STOCK" | "PARTIALLY_RECOVERED" | "COMPLETED" | "VOIDED";

type ChangeStatusDialogProps = {
  car: {
    id: string;
    carNumber: string;
    brand: string;
    model: string;
    status: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const statusConfigs: Record<
  StatusOption,
  { label: string; desc: string; icon: typeof CheckCircle2; color: string }
> = {
  IN_STOCK: {
    label: "In Stock",
    desc: "Active in inventory, ready for dismantling or whole-car sale.",
    icon: Clock,
    color: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  PARTIALLY_RECOVERED: {
    label: "Partially Recovered",
    desc: "Some parts or recovery recorded, still actively being processed.",
    icon: RefreshCw,
    color: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  COMPLETED: {
    label: "Completed",
    desc: "Car fully recovered or sold. Recorded with completion date.",
    icon: CheckCircle2,
    color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  VOIDED: {
    label: "Voided",
    desc: "Deal or acquisition was cancelled / voided.",
    icon: XCircle,
    color: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
};

export function ChangeStatusDialog({
  car,
  open,
  onOpenChange,
}: ChangeStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<StatusOption>(
    (car.status as StatusOption) || "IN_STOCK",
  );
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: StatusOption) => {
    setSelectedStatus(newStatus);
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const res = await updateCarStatusAction({
        carId: car.id,
        status: selectedStatus,
        notes: notes.trim() || undefined,
      });

      if (res.ok) {
        toast.success(res.message || "Status updated successfully.");
        onOpenChange(false);
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <RefreshCw className="size-4 text-primary" />
            Change Status — {car.carNumber}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {car.brand} {car.model} · Select the new lifecycle status for this vehicle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Options */}
          <div className="grid gap-2">
            {(Object.keys(statusConfigs) as StatusOption[]).map((st) => {
              const cfg = statusConfigs[st];
              const Icon = cfg.icon;
              const isSelected = selectedStatus === st;
              const isCurrent = car.status === st;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <Icon
                    className={`size-4 mt-0.5 shrink-0 ${
                      isSelected ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {cfg.label}
                      </span>
                      {isCurrent && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cfg.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Optional reason / notes */}
          <div className="space-y-1.5 pt-1">
            <Label htmlFor="status-notes" className="text-xs font-medium">
              Notes (Optional)
            </Label>
            <Textarea
              id="status-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Reopened to sell remaining parts..."
              rows={2}
              className="text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isPending || selectedStatus === car.status}
            className="gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Updating...
              </>
            ) : (
              "Save Status"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
