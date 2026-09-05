"use client";

import { useState, useTransition } from "react";
import { Plus, UserPlus } from "lucide-react";
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
import type { BuyerOption } from "../domain/sales-types";
import { createQuickBuyerAction } from "../server/sales-actions";

type QuickAddBuyerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBuyerCreated: (buyer: BuyerOption) => void;
};

export function QuickAddBuyerDialog({
  open,
  onOpenChange,
  onBuyerCreated,
}: QuickAddBuyerDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData();
    formData.append("name", name);
    if (phone) formData.append("phone", phone);
    if (companyName) formData.append("companyName", companyName);
    if (location) formData.append("location", location);
    if (notes) formData.append("notes", notes);

    startTransition(async () => {
      const res = await createQuickBuyerAction(formData);
      if (res.ok) {
        toast.success(`Buyer "${res.data.name}" added successfully.`);
        onBuyerCreated(res.data);
        setName("");
        setPhone("");
        setCompanyName("");
        setLocation("");
        setNotes("");
        onOpenChange(false);
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
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-primary" />
              Add New Buyer
            </DialogTitle>
            <DialogDescription>
              Create a buyer record quickly to associate with this sale.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="buyer-name">Buyer Name *</Label>
              <Input
                id="buyer-name"
                placeholder="e.g. Al Amana Scrap Trading"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
              {fieldErrors.name && (
                <p className="text-destructive text-xs">{fieldErrors.name[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="buyer-phone">Phone Number</Label>
                <Input
                  id="buyer-phone"
                  placeholder="+971 50 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="buyer-company">Company</Label>
                <Input
                  id="buyer-company"
                  placeholder="Optional company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="buyer-location">Location / Yard</Label>
              <Input
                id="buyer-location"
                placeholder="e.g. Industrial Area 6, Sharjah"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="buyer-notes">Notes</Label>
              <Textarea
                id="buyer-notes"
                placeholder="Preferred payment terms, parts interest..."
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
              {isPending ? "Creating..." : "Create Buyer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
