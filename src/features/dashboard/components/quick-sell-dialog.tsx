"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CarFront,
  ChevronRight,
  Search,
  Wrench,
  X,
} from "lucide-react";

import { formatCurrency } from "@/lib/currency";
import type { ActiveCarOption } from "../domain/dashboard-types";

type QuickSellDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCars: ActiveCarOption[];
};

export function QuickSellDialog({
  open,
  onOpenChange,
  activeCars,
}: QuickSellDialogProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  if (!open) return null;

  const filteredCars = activeCars.filter((car) => {
    const term = searchTerm.toLowerCase();
    return (
      car.carNumber.toString().includes(term) ||
      car.brand.toLowerCase().includes(term) ||
      car.model.toLowerCase().includes(term) ||
      car.status.toLowerCase().includes(term)
    );
  });

  const handleSelectCar = (carId: string) => {
    onOpenChange(false);
    router.push(`/sell?carId=${encodeURIComponent(carId)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-card relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border p-6 shadow-2xl">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="text-muted-foreground hover:text-foreground absolute right-4 top-4 rounded-lg p-1.5 transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="bg-emerald-500/10 text-emerald-500 flex size-10 items-center justify-center rounded-xl">
            <Wrench className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Sell / Recovery</h2>
            <p className="text-muted-foreground text-xs">
              Select an active vehicle to record whole-car sale or dismantle parts recovery
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search active stock by car number, brand, model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-background w-full rounded-lg border py-2 pl-9 pr-3 text-xs"
          />
        </div>

        {/* Car List */}
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {filteredCars.length === 0 ? (
            <div className="rounded-xl border border-dashed py-8 text-center">
              <CarFront className="text-muted-foreground/40 mx-auto size-8" />
              <p className="text-muted-foreground mt-2 text-xs">
                {activeCars.length === 0
                  ? "No active cars currently in stock."
                  : "No cars match your search filter."}
              </p>
            </div>
          ) : (
            filteredCars.map((car) => {
              const totalInvestment = car.purchasePrice + car.expensesTotal;
              return (
                <button
                  key={car.id}
                  type="button"
                  onClick={() => handleSelectCar(car.id)}
                  className="hover:border-primary/50 hover:bg-muted/50 group flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                      #{car.carNumber}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {car.brand} {car.model} {car.year ? `(${car.year})` : ""}
                      </p>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <span>Inv: {formatCurrency(totalInvestment)}</span>
                        <span>&middot;</span>
                        <span className="text-emerald-600 font-medium">
                          Rec: {formatCurrency(car.recoveryTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                      {car.status}
                    </span>
                    <ChevronRight className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 size-4 transition-transform" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              router.push("/sell");
            }}
            className="text-primary hover:underline text-xs font-medium cursor-pointer"
          >
            Open All Sell & Recovery →
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="hover:bg-muted rounded-lg border px-4 py-1.5 text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
