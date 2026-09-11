"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CarFront,
  ChevronDown,
  Edit,
  FileText,
  Plus,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { conditionLabels } from "@/features/stock/domain/stock-types";
import type { CarDetailsFull } from "../domain/car-details-types";
import { AddExpenseDialog } from "./add-expense-dialog";
import { PurchaseReceiptDialog } from "./purchase-receipt-dialog";

const statusVariants: Record<string, { label: string; className: string }> = {
  IN_STOCK: {
    label: "In Stock",
    className:
      "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400 font-medium",
  },
  PARTIALLY_RECOVERED: {
    label: "Partially Recovered",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium",
  },
  COMPLETED: {
    label: "Completed",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium",
  },
};

type CarDetailsHeaderProps = {
  car: CarDetailsFull;
  isViewer?: boolean;
};

export function CarDetailsHeader({ car, isViewer = false }: CarDetailsHeaderProps) {
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);

  const statusConfig = statusVariants[car.status] ?? {
    label: car.status,
    className: "",
  };

  const conditionLabel =
    car.conditionOther ||
    conditionLabels[car.condition as keyof typeof conditionLabels] ||
    car.condition;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-sm font-semibold tracking-tight text-primary">
              {car.carNumber}
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-xs text-muted-foreground">{conditionLabel}</span>
            <span className="text-muted-foreground/50">·</span>
            <Badge variant="outline" className={`text-xs ${statusConfig.className}`}>
              Status: {statusConfig.label}
            </Badge>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {car.brand} {car.model} {car.year ? `- ${car.year}` : ""}
          </h1>

          <p className="text-muted-foreground mt-1.5 text-xs sm:text-sm">
            Purchased on{" "}
            {new Date(car.purchaseDate).toLocaleDateString("en-AE", {
              dateStyle: "medium",
              timeZone: "UTC",
            })}{" "}
            from <span className="font-medium text-foreground">{car.seller.name}</span>
            {car.source && !isViewer ? ` via ${car.source.name}` : ""}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isViewer && (
            <>
              <Button
                onClick={() => setExpenseDialogOpen(true)}
                size="sm"
                className="gap-1.5 shadow-xs"
                data-testid="add-expense-header-btn"
              >
                <Plus className="size-4" />
                Add Expense
              </Button>

              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/sell?carId=${car.carNumber}`} />}
                className="gap-1.5 shadow-xs"
                data-testid="sell-recovery-header-btn"
              >
                <Wrench className="size-4" />
                Sell / Recovery
              </Button>
            </>
          )}

          <PurchaseReceiptDialog
            car={car}
            isViewer={isViewer}
            triggerText="Receipt / Voucher"
            triggerVariant="outline"
          />

          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center gap-1 h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-medium shadow-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2"
              aria-label="More options"
            >
              More
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                render={<Link href={`/stock?search=${car.carNumber}`} />}
              >
                <CarFront className="size-4 mr-2" />
                View in Stock
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Edit className="size-4 mr-2" />
                Edit Car Details (Admin)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Add Car Expense Modal Dialog */}
      <AddExpenseDialog
        carId={car.id}
        carNumber={car.carNumber}
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
      />
    </>
  );
}
