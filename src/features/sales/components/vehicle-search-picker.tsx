"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CarFront, Check, ChevronDown, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SellCarSummary } from "../domain/sales-types";

type VehicleSearchPickerProps = {
  cars: SellCarSummary[];
  selectedCarId: string | null;
  onSelectCar: (carId: string) => void;
};

export function VehicleSearchPicker({
  cars,
  selectedCarId,
  onSelectCar,
}: VehicleSearchPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selectedCar = useMemo(
    () => cars.find((c) => c.id === selectedCarId) || null,
    [cars, selectedCarId],
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCars = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cars;

    return cars.filter((c) => {
      const matchCarNumber = c.carNumber.toLowerCase().includes(q);
      const matchRawNumber = String(c.rawCarNumber).includes(q);
      const matchBrand = c.brand.toLowerCase().includes(q);
      const matchModel = c.model.toLowerCase().includes(q);
      const matchYear = c.year ? String(c.year).includes(q) : false;
      const matchStatus = c.status.toLowerCase().replace(/_/g, " ").includes(q);
      const matchCondition = c.condition.toLowerCase().replace(/_/g, " ").includes(q);

      return (
        matchCarNumber ||
        matchRawNumber ||
        matchBrand ||
        matchModel ||
        matchYear ||
        matchStatus ||
        matchCondition
      );
    });
  }, [cars, query]);

  function handleSelect(car: SellCarSummary) {
    onSelectCar(car.id);
    setQuery("");
    setOpen(false);
  }

  function handleOpenSearch() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Selected Vehicle Display Card / Trigger */}
      {!open && selectedCar ? (
        <div
          onClick={handleOpenSearch}
          className="border-input bg-background hover:bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer transition-colors shadow-xs group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleOpenSearch();
            }
          }}
          aria-label="Click to search or change selected vehicle"
        >
          <div className="flex min-w-0 items-center gap-3">
            {selectedCar.mainPhotoUrl ? (
              <div className="relative size-9 shrink-0 rounded-md overflow-hidden border">
                <Image
                  src={selectedCar.mainPhotoUrl}
                  alt={selectedCar.brand}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md border">
                <CarFront className="size-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-sm font-mono">
                  {selectedCar.carNumber}
                </span>
                <span className="text-muted-foreground text-xs font-medium">
                  {selectedCar.brand} {selectedCar.model} {selectedCar.year ? `(${selectedCar.year})` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    selectedCar.status === "COMPLETED"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : selectedCar.status === "PARTIALLY_RECOVERED"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400"
                  }`}
                >
                  {selectedCar.status.replace("_", " ")}
                </Badge>
                <span className="text-[11px] text-muted-foreground truncate">
                  {selectedCar.condition.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs font-medium gap-1 text-muted-foreground group-hover:text-foreground"
            >
              <Search className="size-3" />
              Search / Change
            </Button>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-hover:text-foreground" />
          </div>
        </div>
      ) : (
        /* Search Input Box */
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            ref={inputRef}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            autoComplete="off"
            placeholder="Search by Car ID (e.g. 0002), Brand, Model, Year, or Status..."
            value={query}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            className="pl-9 pr-10 h-10 text-xs sm:text-sm"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 p-1"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 p-1"
            >
              <ChevronDown className="size-4" />
            </button>
          )}
        </div>
      )}

      {/* Dropdown Options List */}
      {open && (
        <div
          role="listbox"
          className="bg-popover text-popover-foreground border-border absolute top-full left-0 right-0 z-50 mt-1.5 max-h-72 overflow-y-auto rounded-xl border p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95"
        >
          <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {filteredCars.length} Vehicle{filteredCars.length === 1 ? "" : "s"} Available
          </div>

          {filteredCars.length > 0 ? (
            <div className="space-y-0.5">
              {filteredCars.map((car) => {
                const isSelected = car.id === selectedCarId;
                return (
                  <button
                    key={car.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(car)}
                    className={cn(
                      "hover:bg-accent/80 flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors cursor-pointer",
                      isSelected && "bg-accent font-medium",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {car.mainPhotoUrl ? (
                        <div className="relative size-8 shrink-0 rounded overflow-hidden border">
                          <Image
                            src={car.mainPhotoUrl}
                            alt={car.brand}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded">
                          <CarFront className="size-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs font-mono text-foreground">
                            {car.carNumber}
                          </span>
                          <span className="text-xs text-foreground truncate">
                            {car.brand} {car.model} {car.year ? `(${car.year})` : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">
                            {car.condition.replace(/_/g, " ")}
                          </span>
                          <span className="text-muted-foreground/60 text-[10px]">•</span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1 py-0 ${
                              car.status === "COMPLETED"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : car.status === "PARTIALLY_RECOVERED"
                                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                  : "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400"
                            }`}
                          >
                            {car.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="text-primary size-4 shrink-0 mr-1" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-muted-foreground">
              <CarFront className="size-6 mx-auto mb-1.5 text-muted-foreground/50" />
              No vehicles found matching &quot;{query}&quot;.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
