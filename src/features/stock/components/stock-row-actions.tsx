"use client";

import Link from "next/link";
import { Eye, MoreVertical, Plus, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StockCarItem } from "../domain/stock-types";

type StockRowActionsProps = {
  car: StockCarItem;
};

export function StockRowActions({ car }: StockRowActionsProps) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Actions for ${car.carNumber}`}
            />
          }
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem render={<Link href={`/cars/${car.carNumber}`} />}>
            <Eye className="mr-2 size-3.5" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={<Link href={`/cars/${car.carNumber}/expenses/new`} />}
          >
            <Plus className="mr-2 size-3.5" />
            Add Expense
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href={`/sales/new?car=${car.carNumber}`} />}
          >
            <Wrench className="mr-2 size-3.5" />
            Sell / Recovery
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
