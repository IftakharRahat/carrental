"use client";

import { useState, useTransition } from "react";
import { Edit2 } from "lucide-react";
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
import type { BuyerListItem, BuyerTypeOption } from "../domain/buyer-types";
import { updateBuyerAction } from "../server/buyer-actions";

type EditBuyerDialogProps = {
  buyer: BuyerListItem | null;
  availableTypes: BuyerTypeOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function EditBuyerForm({
  buyer,
  availableTypes,
  onClose,
}: {
  buyer: BuyerListItem;
  availableTypes: BuyerTypeOption[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(buyer.name);
  const [companyName, setCompanyName] = useState(buyer.companyName || "");
  const [phone, setPhone] = useState(buyer.phone || "");
  const [whatsapp, setWhatsapp] = useState(buyer.whatsapp || "");
  const [location, setLocation] = useState(buyer.location || "");
  const [notes, setNotes] = useState(buyer.notes || "");
  const [isActive, setIsActive] = useState(buyer.isActive);
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>(
    buyer.types.map((t) => t.id),
  );
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
    formData.append("id", buyer.id);
    formData.append("name", name);
    if (companyName) formData.append("companyName", companyName);
    if (phone) formData.append("phone", phone);
    if (whatsapp) formData.append("whatsapp", whatsapp);
    if (location) formData.append("location", location);
    if (notes) formData.append("notes", notes);
    formData.append("isActive", String(isActive));
    selectedTypeIds.forEach((id) => formData.append("buyerTypeIds", id));

    startTransition(async () => {
      const res = await updateBuyerAction(formData);
      if (res.ok) {
        toast.success(`Buyer "${res.data.name}" updated successfully.`);
        onClose();
      } else {
        toast.error(res.message);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Edit2 className="size-5 text-primary" />
          Edit Buyer Profile
        </DialogTitle>
        <DialogDescription>
          Update contact information and assigned buyer categories.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3 py-1">
        {/* Name & Company */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-buyer-name">Buyer Name *</Label>
            <Input
              id="edit-buyer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {fieldErrors.name && (
              <p className="text-destructive text-xs">{fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-buyer-company">Company / Shop</Label>
            <Input
              id="edit-buyer-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
        </div>

        {/* Phone & WhatsApp */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-buyer-phone">Primary Phone</Label>
            <Input
              id="edit-buyer-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-buyer-whatsapp">WhatsApp (Optional)</Label>
            <Input
              id="edit-buyer-whatsapp"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-buyer-location">Location / Yard</Label>
          <Input
            id="edit-buyer-location"
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

        {/* Active Status Toggle */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-xs font-semibold">Buyer Status</p>
            <p className="text-muted-foreground text-[11px]">
              Active buyers appear in sale recovery pickers.
            </p>
          </div>
          <Button
            type="button"
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => setIsActive(!isActive)}
            className="text-xs"
          >
            {isActive ? "Active" : "Archived"}
          </Button>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-buyer-notes">Notes (Optional)</Label>
          <Textarea
            id="edit-buyer-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !name.trim()}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditBuyerDialog({
  buyer,
  availableTypes,
  open,
  onOpenChange,
}: EditBuyerDialogProps) {
  if (!buyer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <EditBuyerForm
          key={buyer.id}
          buyer={buyer}
          availableTypes={availableTypes}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
