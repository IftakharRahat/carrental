"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { isSellerExpired } from "../domain/seller-calculations";
import type { SellerRowData } from "../domain/seller-types";
import { cleanExpiredSellersAction } from "../server/seller-actions";

type CleanExpiredSellersDialogProps = {
  sellers: SellerRowData[];
};

const THRESHOLD_OPTIONS = [
  { days: 30, label: "30 Days" },
  { days: 45, label: "45 Days (Recommended)" },
  { days: 60, label: "60 Days" },
  { days: 90, label: "90 Days" },
];

export function CleanExpiredSellersDialog({
  sellers,
}: CleanExpiredSellersDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState(45);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Calculate matching expired sellers preview
  const { expiredWithNoCars, expiredWithCars, totalExpired } = useMemo(() => {
    const activeSellers = sellers.filter((s) => s.isActive);
    let noCars = 0;
    let withCars = 0;

    for (const seller of activeSellers) {
      if (isSellerExpired(seller, selectedDays)) {
        if (seller.kpis.carsSoldToYou === 0) {
          noCars++;
        } else {
          withCars++;
        }
      }
    }

    return {
      expiredWithNoCars: noCars,
      expiredWithCars: withCars,
      totalExpired: noCars + withCars,
    };
  }, [sellers, selectedDays]);

  function handleExecuteCleanup() {
    startTransition(async () => {
      const res = await cleanExpiredSellersAction(selectedDays);
      if (!res.ok) {
        toast.error(res.message || "Failed to clean expired sellers");
        return;
      }

      const { deletedCount, archivedCount, totalCleaned } = res.data;
      if (totalCleaned === 0) {
        toast.info("No active sellers meet the expiration threshold.");
      } else {
        toast.success(
          `Cleaned ${totalCleaned} expired sellers (${deletedCount} deleted, ${archivedCount} archived). All car records safely preserved!`,
        );
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 border-amber-300/60 dark:border-amber-700/60 hover:bg-amber-50 dark:hover:bg-amber-950/30"
          />
        }
      >
        <Sparkles className="size-3.5 text-amber-600 dark:text-amber-400" />
        Clean Expired Sellers
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-950/50 rounded-lg text-amber-600 dark:text-amber-400">
              <Trash2 className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg">Clean Expired Sellers</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Clean up actual vehicle owners who rarely sell more than once in their lifetime.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Days threshold selector */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">
              Expiration Inactivity Threshold:
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {THRESHOLD_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setSelectedDays(opt.days)}
                  className={`px-3 py-2 text-xs rounded-lg border font-medium transition-all ${
                    selectedDays === opt.days
                      ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time preview card */}
          <div className="rounded-xl border bg-muted/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Found Matching Expired Sellers:
              </span>
              <Badge
                variant={totalExpired > 0 ? "default" : "secondary"}
                className="text-xs font-bold"
              >
                {totalExpired} sellers
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60 text-xs">
              <div className="p-2 rounded-lg bg-background/80 border border-border/40">
                <span className="text-muted-foreground text-[11px] block">
                  0 Cars Linked (Unused)
                </span>
                <span className="font-bold text-foreground text-sm">
                  {expiredWithNoCars}
                </span>
                <span className="text-[10px] text-destructive block mt-0.5">
                  Permanently deleted
                </span>
              </div>

              <div className="p-2 rounded-lg bg-background/80 border border-border/40">
                <span className="text-muted-foreground text-[11px] block">
                  Past Purchased Cars
                </span>
                <span className="font-bold text-foreground text-sm">
                  {expiredWithCars}
                </span>
                <span className="text-[10px] text-primary block mt-0.5">
                  Archived from active view
                </span>
              </div>
            </div>
          </div>

          {/* Car Data Protection Guarantee */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 flex gap-2.5 items-start">
            <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                Car Records Protected (# all cars এ রেকর্ড সেভ থাকবে #)
              </p>
              <p className="text-emerald-700 dark:text-emerald-400 text-[11px] leading-relaxed">
                All vehicle inventory, purchase prices, expense history, recovery transactions, and
                monthly reports remain 100% saved and completely untouched.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleExecuteCleanup}
            disabled={isPending || totalExpired === 0}
            className="gap-1.5"
          >
            {isPending ? (
              "Cleaning..."
            ) : (
              <>
                <Trash2 className="size-3.5" />
                Clean {totalExpired} Expired Sellers
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
