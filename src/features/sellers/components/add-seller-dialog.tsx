"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus, UserPlus } from "lucide-react";
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
import {
  checkPhoneDuplicateAction,
  createSellerAction,
} from "../server/seller-actions";

type FormState = {
  name: string;
  phone: string;
  whatsapp: string;
  emiratesId: string;
  location: string;
  notes: string;
};

const initialFormState: FormState = {
  name: "",
  phone: "",
  whatsapp: "",
  emiratesId: "",
  location: "",
  notes: "",
};

export function AddSellerDialog({
  trigger,
  onCreated,
}: {
  trigger?: React.ReactElement;
  onCreated?: (sellerId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<{
    name: string;
    phone: string;
  } | null>(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handlePhoneBlur() {
    if (!form.phone || form.phone.trim().length < 6) {
      setDuplicateWarning(null);
      return;
    }

    const check = await checkPhoneDuplicateAction(form.phone);
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
      const res = await createSellerAction({
        name: form.name,
        phone: form.phone || undefined,
        whatsapp: form.whatsapp || undefined,
        emiratesId: form.emiratesId || undefined,
        location: form.location || undefined,
        notes: form.notes || undefined,
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
        toast.error(res.message || "Failed to create seller");
        return;
      }

      toast.success(`Seller "${res.data.name}" added successfully`);
      setOpen(false);
      setForm(initialFormState);
      setDuplicateWarning(null);
      setAllowDuplicate(false);
      router.refresh();
      if (onCreated) {
        onCreated(res.data.id);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger || (
            <Button size="sm" className="gap-2">
              <Plus className="size-4" />
              Add Seller
            </Button>
          )
        }
      />
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            Add New Seller
          </DialogTitle>
          <DialogDescription>
            Record vehicle owner / seller details. Note: Seller is distinct from Source (Section 10).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Seller Name */}
          <div className="space-y-1.5">
            <Label htmlFor="sellerName">Seller Name *</Label>
            <Input
              id="sellerName"
              placeholder="e.g. Mohammed Al-Falasi"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            {fieldErrors.name && (
              <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>
            )}
          </div>

          {/* Phone with duplicate warning check */}
          <div className="space-y-1.5">
            <Label htmlFor="sellerPhone">Phone Number (Primary)</Label>
            <Input
              id="sellerPhone"
              placeholder="+971 50 123 4567"
              value={form.phone}
              onBlur={handlePhoneBlur}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, phone: e.target.value }));
                if (duplicateWarning) {
                  setDuplicateWarning(null);
                  setAllowDuplicate(false);
                }
              }}
            />
            {fieldErrors.phone && (
              <p className="text-xs text-destructive">{fieldErrors.phone[0]}</p>
            )}

            {/* Section 10.2 Duplicate Phone Warning Banner */}
            {duplicateWarning && (
              <div
                className="rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-2"
                data-testid="duplicate-phone-warning"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Duplicate Phone Warning:</span>
                    <p className="mt-0.5">
                      This number is already registered to seller{" "}
                      <strong>&quot;{duplicateWarning.name}&quot;</strong>.
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
                  <span>Confirm and create seller anyway</span>
                </label>
              </div>
            )}
          </div>

          {/* WhatsApp & Emirates ID */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sellerWhatsapp">WhatsApp</Label>
              <Input
                id="sellerWhatsapp"
                placeholder="+971 50 123 4567"
                value={form.whatsapp}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, whatsapp: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sellerEmiratesId">Emirates ID</Label>
              <Input
                id="sellerEmiratesId"
                placeholder="784-1990-1234567-1"
                value={form.emiratesId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, emiratesId: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="sellerLocation">Location / Area</Label>
            <Input
              id="sellerLocation"
              placeholder="e.g. Dubai Marina, Sharjah, Abu Dhabi"
              value={form.location}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, location: e.target.value }))
              }
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="sellerNotes">Notes / Relationship</Label>
            <Textarea
              id="sellerNotes"
              placeholder="e.g. Regular individual seller, prefers cash deals"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || (Boolean(duplicateWarning) && !allowDuplicate)}
            >
              {isPending ? "Adding..." : "Add Seller"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
