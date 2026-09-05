"use client";

import Image from "next/image";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CarFront } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTaka } from "@/lib/currency";
import { formatPendingItems } from "../domain/stock-calculations";
import type { StockCarItem, StockCarStatus } from "../domain/stock-types";
import { conditionLabels } from "../server/stock-reference-service";
import { StockRowActions } from "./stock-row-actions";

const statusVariants: Record<
  StockCarStatus,
  { label: string; className: string }
> = {
  IN_STOCK: {
    label: "In Stock",
    className:
      "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  PARTIALLY_RECOVERED: {
    label: "Partially Recovered",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  COMPLETED: {
    label: "Completed",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
};

export const stockColumns: ColumnDef<StockCarItem>[] = [
  {
    accessorKey: "carNumber",
    header: "Car ID",
    cell: ({ row }) => {
      const car = row.original;
      return (
        <Link
          href={`/cars/${car.carNumber}`}
          className="text-primary hover:underline font-semibold"
          onClick={(e) => e.stopPropagation()}
        >
          {car.carNumber}
        </Link>
      );
    },
  },
  {
    accessorKey: "brand",
    header: "Car",
    cell: ({ row }) => {
      const car = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="bg-muted relative size-10 shrink-0 overflow-hidden rounded-md border">
            {car.mainPhotoUrl ? (
              <Image
                src={car.mainPhotoUrl}
                alt={`${car.brand} ${car.model}`}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="text-muted-foreground flex size-full items-center justify-center">
                <CarFront className="size-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {car.brand} {car.model}
            </p>
            <p className="text-muted-foreground text-xs">{car.year ?? "—"}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "condition",
    header: "Condition",
    cell: ({ row }) => {
      const car = row.original;
      const label =
        car.condition === "OTHER" && car.conditionOther
          ? car.conditionOther
          : conditionLabels[car.condition] ?? car.condition;
      return (
        <Badge variant="outline" className="text-xs font-normal">
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "purchasePrice",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-2 h-8 font-medium"
      >
        Purchase Price
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium text-foreground">
        {formatTaka(row.original.purchasePrice)}
      </span>
    ),
  },
  {
    accessorKey: "totalExpenses",
    header: "Total Expenses",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatTaka(row.original.totalExpenses)}
      </span>
    ),
  },
  {
    accessorKey: "totalInvestment",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-2 h-8 font-medium"
      >
        Total Investment
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-semibold text-foreground">
        {formatTaka(row.original.totalInvestment)}
      </span>
    ),
  },
  {
    accessorKey: "recovery",
    header: "Recovery",
    cell: ({ row }) => (
      <span className="font-medium text-emerald-600 dark:text-emerald-400">
        {formatTaka(row.original.recovery)}
      </span>
    ),
  },
  {
    accessorKey: "pendingItemsCount",
    header: "Remaining / Pending",
    cell: ({ row }) => {
      const count = row.original.pendingItemsCount;
      if (count === null) {
        return <span className="text-muted-foreground text-xs">N/A</span>;
      }
      return (
        <Badge
          variant="secondary"
          className="text-xs font-normal"
        >
          {formatPendingItems(count)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const config = statusVariants[status] ?? {
        label: status,
        className: "",
      };
      return (
        <Badge
          variant="outline"
          className={`text-xs font-medium ${config.className}`}
        >
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "daysInStock",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-2 h-8 font-medium"
      >
        Days in Stock
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm font-medium">
        {row.original.daysInStock}d
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <StockRowActions car={row.original} />,
  },
];
