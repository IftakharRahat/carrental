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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BuyerTypeOption } from "../domain/buyer-types";
import { createBuyerAction } from "../server/buyer-actions";

type AddBuyerDialogProps = {
  availableTypes: BuyerTypeOption[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: boolean;
};

export function AddBuyerDialog({
  availableTypes,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  triggerButton = true,
}: AddBuyerDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;

  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const toggleType = (typeId: string) => {
    setSelectedTypeIds((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData();
    formData.append("name", name);
    if (companyName) formData.append("companyName", companyName);
    if (phone) formData.append("phone", phone);
    if (whatsapp) formData.append("whatsapp", whatsapp);
    if (location) formData.append("location", location);
    if (notes) formData.append("notes", notes);
    selectedTypeIds.forEach((id) => formData.append("buyerTypeIds", id));

    startTransition(async () => {
      const res = await createBuyerAction(formData);
      if (res.ok) {
        toast.success(`Buyer "${res.data.name}" added successfully.`);
        setName("");
        setCompanyName("");
        setPhone("");
        setWhatsapp("");
        setLocation("");
        setNotes("");
        setSelectedTypeIds([]);
        onOpenChange?.(false);
      } else {
        toast.error(res.message);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerButton && (
        <DialogTrigger
          render={
            <Button size="sm" className="gap-1.5 shadow-xs" data-testid="add-buyer-btn">
              <Plus className="size-4" />
              Add Buyer
            </Button>
          }
        />
      )}
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-primary" />
              Add New Buyer
            </DialogTitle>
            <DialogDescription>
              Record a buyer profile and select all relevant purchasing categories.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-1">
            {/* Name & Company */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="create-buyer-name">Buyer Name *</Label>
                <Input
                  id="create-buyer-name"
                  placeholder="e.g. Al Baraka Auto"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
                {fieldErrors.name && (
                  <p className="text-destructive text-xs">{fieldErrors.name[0]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-buyer-company">Company / Shop</Label>
                <Input
                  id="create-buyer-company"
                  placeholder="e.g. Al Baraka Scrap LLC"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </div>

            {/* Phone & WhatsApp */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="create-buyer-phone">Primary Phone</Label>
                <Input
                  id="create-buyer-phone"
                  type="tel"
                  placeholder="+971 50 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-buyer-whatsapp">WhatsApp (Optional)</Label>
                <Input
                  id="create-buyer-whatsapp"
                  type="tel"
                  placeholder="+971 50 123 4567"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="create-buyer-location">Location / Yard</Label>
              <Input
                id="create-buyer-location"
                placeholder="e.g. Industrial Area 6, Sharjah"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* 11.1 & 11.2 Buyer Type(s) - Multi-Select */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Buyer Type(s) (Multi-Select)
                </Label>
                <span className="text-muted-foreground text-[11px]">
                  {selectedTypeIds.length} selected
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {availableTypes.map((type) => {
                  const isChecked = selectedTypeIds.includes(type.id);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => toggleType(type.id)}
                      className={`flex items-center justify-between gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all text-left ${
                        isChecked
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <span className="truncate">{type.name}</span>
                      {isChecked && (
                        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="create-buyer-notes">Notes (Optional)</Label>
              <Textarea
                id="create-buyer-notes"
                placeholder="Preferred parts, payment reliability, scrap yard details..."
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
              onClick={() => onOpenChange?.(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Adding Buyer..." : "Create Buyer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
