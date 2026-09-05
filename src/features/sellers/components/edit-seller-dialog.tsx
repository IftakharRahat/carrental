"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Edit3 } from "lucide-react";
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
import type { SellerRowData } from "../domain/seller-types";
import {
  checkPhoneDuplicateAction,
  updateSellerAction,
} from "../server/seller-actions";

export function EditSellerDialog({
  seller,
  open,
  onOpenChange,
}: {
  seller: SellerRowData | {
    id: string;
    name: string;
    phone: string | null;
    whatsapp: string | null;
    emiratesId: string | null;
    location: string | null;
    notes: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="size-5 text-primary" />
            Edit Seller
          </DialogTitle>
          <DialogDescription>
            Update profile details for {seller.name}.
          </DialogDescription>
        </DialogHeader>
        <EditSellerForm seller={seller} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditSellerForm({
  seller,
  onClose,
}: {
  seller: {
    id: string;
    name: string;
    phone: string | null;
    whatsapp: string | null;
    emiratesId: string | null;
    location: string | null;
    notes: string | null;
  };
  onClose: () => void;
}) {
  const [name, setName] = useState(seller.name);
  const [phone, setPhone] = useState(seller.phone || "");
  const [whatsapp, setWhatsapp] = useState(seller.whatsapp || "");
  const [emiratesId, setEmiratesId] = useState(seller.emiratesId || "");
  const [location, setLocation] = useState(seller.location || "");
  const [notes, setNotes] = useState(seller.notes || "");
  const [duplicateWarning, setDuplicateWarning] = useState<{
    name: string;
    phone: string;
  } | null>(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handlePhoneBlur() {
    if (!phone || phone.trim().length < 6) {
      setDuplicateWarning(null);
      return;
    }

    const check = await checkPhoneDuplicateAction(phone, seller.id);
    if (check.exists && check.existingSeller) {
      setDuplicateWarning({
        name: check.existingSeller.name,
        phone: check.existingSeller.phone,
      });
    } else {
      setDuplicateWarning(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    startTransition(async () => {
      const res = await updateSellerAction({
        id: seller.id,
        name,
        phone: phone || undefined,
        whatsapp: whatsapp || undefined,
        emiratesId: emiratesId || undefined,
        location: location || undefined,
        notes: notes || undefined,
        allowDuplicatePhone: allowDuplicate,
      });

      if (!res.ok) {
        if (res.duplicateWarning) {
          setDuplicateWarning(res.duplicateWarning);
          toast.warning(res.message);
          return;
        }

        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
        toast.error(res.message || "Failed to update seller");
        return;
      }

      toast.success("Seller updated successfully");
      onClose();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="editSellerName">Seller Name *</Label>
        <Input
          id="editSellerName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {fieldErrors.name && (
          <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>
        )}
      </div>

      {/* Phone with duplicate warning */}
      <div className="space-y-1.5">
        <Label htmlFor="editSellerPhone">Phone Number</Label>
        <Input
          id="editSellerPhone"
          value={phone}
          onBlur={handlePhoneBlur}
          onChange={(e) => {
            setPhone(e.target.value);
            if (duplicateWarning) {
              setDuplicateWarning(null);
              setAllowDuplicate(false);
            }
          }}
        />

        {duplicateWarning && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Duplicate Phone Warning:</span>
                <p className="mt-0.5">
                  Another seller (&quot;{duplicateWarning.name}&quot;) has this number.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-amber-500/20">
              <input
                type="checkbox"
                checked={allowDuplicate}
                onChange={(e) => setAllowDuplicate(e.target.checked)}
                className="size-3.5 rounded border-amber-600 accent-amber-600"
              />
              <span>Confirm and proceed with this number</span>
            </label>
          </div>
        )}
      </div>

      {/* WhatsApp & Emirates ID */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="editSellerWhatsapp">WhatsApp</Label>
          <Input
            id="editSellerWhatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editSellerEmiratesId">Emirates ID</Label>
          <Input
            id="editSellerEmiratesId"
            value={emiratesId}
            onChange={(e) => setEmiratesId(e.target.value)}
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="editSellerLocation">Location / Area</Label>
        <Input
          id="editSellerLocation"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="editSellerNotes">Notes</Label>
        <Textarea
          id="editSellerNotes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || (Boolean(duplicateWarning) && !allowDuplicate)}
        >
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
