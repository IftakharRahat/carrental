"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, MoreVertical, Plus, RefreshCw, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChangeStatusDialog } from "@/features/cars/components/change-status-dialog";
import type { StockCarItem } from "../domain/stock-types";

type StockRowActionsProps = {
  car: StockCarItem;
};

export function StockRowActions({ car }: StockRowActionsProps) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label={`Actions for ${car.carNumber}`}
            />
          }
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            render={<Link href={`/cars/${car.carNumber}`} />}
            className="cursor-pointer"
          >
            <Eye className="mr-2 size-3.5" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setStatusDialogOpen(true)}
            className="cursor-pointer"
          >
            <RefreshCw className="mr-2 size-3.5" />
            Change Status
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={<Link href={`/cars/${car.carNumber}/expenses/new`} />}
            className="cursor-pointer"
          >
            <Plus className="mr-2 size-3.5" />
            Add Expense
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href={`/sales/new?car=${car.carNumber}`} />}
            className="cursor-pointer"
          >
            <Wrench className="mr-2 size-3.5" />
            Sell / Recovery
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangeStatusDialog
        car={car}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
      />
    </div>
  );
}
