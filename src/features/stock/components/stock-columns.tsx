"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { ArrowUpDown, CarFront } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTaka } from "@/lib/currency";
import { formatPendingItems } from "../domain/stock-calculations";
import type { StockCarItem, StockCarStatus } from "../domain/stock-types";
import { conditionLabels } from "../server/stock-reference-service";
import { StockRowActions } from "./stock-row-actions";

function CarThumbnail({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md border">
        <CarFront className="size-5" />
      </div>
    );
  }

  return (
    <div className="bg-muted relative size-10 shrink-0 overflow-hidden rounded-md border">
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        onError={() => setHasError(true)}
        className="object-cover transition-transform duration-200 hover:scale-110"
      />
    </div>
  );
}

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
          <CarThumbnail
            src={car.mainPhotoUrl}
            alt={`${car.brand} ${car.model}`}
          />
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
      const total = row.original.totalItemsCount;
      if (count === null) {
        return <span className="text-muted-foreground/60 text-xs font-mono">N/A</span>;
      }
      if (count === 0) {
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium"
          >
            All cleared
          </Badge>
        );
      }
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium"
        >
          {formatPendingItems(count, total)}
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
