"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Tag } from "lucide-react";
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
import type { BuyerTypeOption } from "../domain/buyer-types";
import { createBuyerTypeAction } from "../server/buyer-actions";

type AddBuyerTypeDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: boolean;
  triggerLabel?: string;
  onSuccess?: (newType: BuyerTypeOption) => void;
};

export function AddBuyerTypeDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  triggerButton = true,
  triggerLabel = "Add Category",
  onSuccess,
}: AddBuyerTypeDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;

  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName("");
      setError(null);
    }
    if (isControlled) {
      controlledOnOpenChange?.(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Please enter a category name.");
      return;
    }

    if (trimmed.length < 2) {
      setError("Category name must be at least 2 characters.");
      return;
    }

    if (trimmed.length > 60) {
      setError("Category name must not exceed 60 characters.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await createBuyerTypeAction(trimmed);

      if (!result.ok) {
        setError(result.message);
        toast.error(result.message || "Failed to create category.");
        return;
      }

      toast.success(`Category "${result.data.name}" created successfully!`);
      setName("");
      handleOpenChange(false);
      onSuccess?.(result.data);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {triggerButton && (
        <DialogTrigger
          render={
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs font-medium border-dashed hover:border-primary hover:text-primary transition-colors"
              data-testid="add-buyer-category-trigger"
            >
              <Plus className="size-3.5" />
              {triggerLabel}
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Tag className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Add Buyer Category
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Create a new recovery item or vehicle category to classify buyers.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="category-name" className="text-xs font-medium">
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category-name"
                placeholder="e.g. Battery, Gearbox, Catalytic Converter..."
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isPending}
                autoFocus
                className="text-sm"
                data-testid="buyer-category-name-input"
              />
              {error && (
                <p className="text-destructive text-xs mt-1" role="alert">
                  {error}
                </p>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Once added, this category will appear in the filter toolbar and buyer assignment options immediately.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !name.trim()}
              data-testid="submit-buyer-category-button"
            >
              {isPending ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
