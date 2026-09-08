"use client";

import { useState, useTransition } from "react";
import { ArrowDownLeft, ArrowUpRight, FolderPlus } from "lucide-react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCustomCategoryAction } from "../server/finance-actions";

type AddCategoryDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: boolean;
  defaultDirection?: "IN" | "OUT";
  onSuccess?: (newCategory: { id: string; name: string }) => void;
};

export function AddCategoryDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  triggerButton = true,
  defaultDirection = "IN",
  onSuccess,
}: AddCategoryDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;

  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [direction, setDirection] = useState<"IN" | "OUT">(defaultDirection);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("direction", direction);

    startTransition(async () => {
      const res = await createCustomCategoryAction(formData);
      if (res.ok) {
        toast.success(`Category "${res.data.name}" added successfully.`);
        setName("");
        setDirection(defaultDirection);
        onOpenChange?.(false);
        onSuccess?.(res.data);
      } else {
        toast.error(res.message);
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerButton && (
        <DialogTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 shadow-xs"
              data-testid="add-category-btn"
            >
              <FolderPlus className="size-4" />
              Add Category
            </Button>
          }
        />
      )}
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="size-5 text-primary" />
              Add Custom Category
            </DialogTitle>
            <DialogDescription>
              Create a custom financial category for Money In or Money Out.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Category Type *</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection("IN")}
                  className={`flex items-center justify-center gap-1.5 rounded-md border p-2 text-xs font-semibold transition-colors ${
                    direction === "IN"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "border-input bg-transparent text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <ArrowDownLeft className="size-3.5" />
                  Money In
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("OUT")}
                  className={`flex items-center justify-center gap-1.5 rounded-md border p-2 text-xs font-semibold transition-colors ${
                    direction === "OUT"
                      ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                      : "border-input bg-transparent text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <ArrowUpRight className="size-3.5" />
                  Money Out
                </button>
              </div>
              {fieldErrors.direction && (
                <p className="text-destructive text-xs">{fieldErrors.direction[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Category Name *</Label>
              <Input
                id="cat-name"
                placeholder={
                  direction === "IN"
                    ? "e.g. Battery Recycling, Scrap Metal"
                    : "e.g. Forklift Fuel, Workshop Rent"
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
              {fieldErrors.name && (
                <p className="text-destructive text-xs">{fieldErrors.name[0]}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
