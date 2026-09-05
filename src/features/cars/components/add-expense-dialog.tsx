"use client";

import { useState, useTransition } from "react";
import { Plus, Receipt, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { expenseCategoryLabels } from "../domain/car-details-calculations";
import { createCarExpenseAction } from "../server/car-expense-actions";

type AddExpenseDialogProps = {
  carId: string;
  carNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddExpenseDialog({
  carId,
  carNumber,
  open,
  onOpenChange,
}: AddExpenseDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("TRANSPORT");
  const [categoryOther, setCategoryOther] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = JSON.parse(
        localStorage.getItem("custom_car_expense_categories") || "[]",
      );
      if (Array.isArray(stored)) return stored;
    } catch {}
    return [];
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleAddNewCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error("Category name cannot be empty.");
      return;
    }

    if (!customCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem(
          "custom_car_expense_categories",
          JSON.stringify(updated),
        );
      } catch {}
    }

    setCategory("OTHER");
    setCategoryOther(trimmed);
    setIsAddingCategory(false);
    setNewCategoryName("");
    toast.success(`Category "${trimmed}" added and selected.`);
  };

  const handleCategorySelectChange = (val: string) => {
    if (val === "__NEW__") {
      setIsAddingCategory(true);
      return;
    }

    if (val.startsWith("CUSTOM:")) {
      const customName = val.replace("CUSTOM:", "");
      setCategory("OTHER");
      setCategoryOther(customName);
      return;
    }

    setCategory(val);
    if (val !== "OTHER") {
      setCategoryOther("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData();
    formData.append("carId", carId);
    formData.append("carNumber", carNumber);
    formData.append("expenseDate", date);
    formData.append("category", category);
    if (category === "OTHER" && categoryOther.trim()) {
      formData.append("categoryOther", categoryOther.trim());
    }
    formData.append("amount", amount);
    formData.append("description", description);
    formData.append("paymentMethod", paymentMethod);
    if (notes) formData.append("notes", notes);

    startTransition(async () => {
      const result = await createCarExpenseAction(formData);
      if (result.ok) {
        toast.success("Car expense recorded successfully.");
        // Reset form
        setAmount("");
        setDescription("");
        setNotes("");
        setCategoryOther("");
        setIsAddingCategory(false);
        onOpenChange(false);
      } else {
        toast.error(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="size-5 text-primary" />
              Add Car Expense ({carNumber})
            </DialogTitle>
            <DialogDescription>
              Record an operational cost for this vehicle. Total Investment and Finance Money Out will update immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3.5 py-1">
            {/* Date & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="expense-date">Expense Date *</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                {fieldErrors.expenseDate && (
                  <p className="text-destructive text-xs">
                    {fieldErrors.expenseDate[0]}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="expense-category">Category *</Label>
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory((v) => !v)}
                    className="text-primary hover:underline text-xs flex items-center gap-1 font-medium cursor-pointer"
                    title="Add a custom category"
                  >
                    <Plus className="size-3" />
                    Add Category
                  </button>
                </div>

                <select
                  id="expense-category"
                  value={
                    category === "OTHER" && categoryOther
                      ? `CUSTOM:${categoryOther}`
                      : category
                  }
                  onChange={(e) => handleCategorySelectChange(e.target.value)}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-3"
                  required
                >
                  <optgroup label="Standard Categories">
                    {Object.entries(expenseCategoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </optgroup>

                  {customCategories.length > 0 && (
                    <optgroup label="Custom Categories">
                      {customCategories.map((c) => (
                        <option key={c} value={`CUSTOM:${c}`}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  <option value="__NEW__">+ Add new category...</option>
                </select>

                {/* Inline Add Category input */}
                {isAddingCategory && (
                  <div className="mt-1 flex items-center gap-1.5 animate-in fade-in-50 duration-200">
                    <Input
                      placeholder="e.g. Towing, Inspection"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="h-8 text-xs flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddNewCategory();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs px-2.5"
                      onClick={handleAddNewCategory}
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs px-1.5 text-muted-foreground"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryName("");
                      }}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                )}

                {/* If OTHER is chosen directly, allow typing custom name */}
                {category === "OTHER" && !isAddingCategory && !categoryOther && (
                  <div className="mt-1 space-y-1">
                    <Input
                      id="custom-category-name"
                      placeholder="Specify custom category name *"
                      value={categoryOther}
                      onChange={(e) => setCategoryOther(e.target.value)}
                      required
                      className="h-8 text-xs"
                      autoFocus
                    />
                  </div>
                )}

                {/* Show active custom category badge if selected */}
                {category === "OTHER" && categoryOther && !isAddingCategory && (
                  <div className="mt-1 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-md px-2 py-0.5 text-xs text-primary font-medium">
                    <span className="flex items-center gap-1 truncate">
                      <Sparkles className="size-3 shrink-0" />
                      Custom: {categoryOther}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCategory("TRANSPORT");
                        setCategoryOther("");
                      }}
                      className="text-muted-foreground hover:text-foreground text-[10px] ml-1.5"
                    >
                      Reset
                    </button>
                  </div>
                )}

                {fieldErrors.category && (
                  <p className="text-destructive text-xs">
                    {fieldErrors.category[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Amount & Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="expense-amount">Amount (AED) *</Label>
                <Input
                  id="expense-amount"
                  inputMode="decimal"
                  placeholder="500.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                {fieldErrors.amount && (
                  <p className="text-destructive text-xs">
                    {fieldErrors.amount[0]}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expense-payment-method">Payment Method *</Label>
                <select
                  id="expense-payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-3"
                  required
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
                {fieldErrors.paymentMethod && (
                  <p className="text-destructive text-xs">
                    {fieldErrors.paymentMethod[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="expense-description">Description *</Label>
              <Input
                id="expense-description"
                placeholder="e.g. Recovery winch transport from Sharjah"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              {fieldErrors.description && (
                <p className="text-destructive text-xs">
                  {fieldErrors.description[0]}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="expense-notes">Notes (Optional)</Label>
              <Textarea
                id="expense-notes"
                placeholder="Additional details or invoice reference..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="gap-1.5">
              <Plus className="size-4" />
              {isPending ? "Saving expense…" : "Save Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
