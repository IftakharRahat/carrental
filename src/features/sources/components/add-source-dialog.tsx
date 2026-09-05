"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import {
  SOURCE_CATEGORIES,
  SOURCE_CATEGORY_LABELS,
  SOURCE_TYPE_METADATA,
  SOURCE_TYPES,
  type SourceCategory,
  type SourceType,
} from "../domain/source-types";
import { createSourceAction } from "../server/source-actions";

type FormState = {
  name: string;
  category: SourceCategory;
  type: SourceType;
  phone: string;
  whatsapp: string;
  location: string;
  notes: string;
};

const initialFormState: FormState = {
  name: "",
  category: "PEOPLE",
  type: "GARAGE_OWNER",
  phone: "",
  whatsapp: "",
  location: "",
  notes: "",
};

export function AddSourceDialog({
  trigger,
  onCreated,
}: {
  trigger?: React.ReactElement;
  onCreated?: (sourceId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCategoryChange(newCat: SourceCategory) {
    // Pick default type in this category
    const availableTypes = SOURCE_TYPES.filter(
      (t) => SOURCE_TYPE_METADATA[t].category === newCat,
    );
    setForm((prev) => ({
      ...prev,
      category: newCat,
      type: availableTypes[0] || prev.type,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    startTransition(async () => {
      const res = await createSourceAction({
        name: form.name,
        type: form.type,
        phone: form.phone || undefined,
        whatsapp: form.whatsapp || undefined,
        location: form.location || undefined,
        notes: form.notes || undefined,
      });

      if (!res.ok) {
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
        toast.error(res.message || "Failed to create source");
        return;
      }

      toast.success(`Source "${res.data.name}" added successfully`);
      setOpen(false);
      setForm(initialFormState);
      router.refresh();
      if (onCreated) {
        onCreated(res.data.id);
      }
    });
  }

  const typesForCategory = SOURCE_TYPES.filter(
    (t) => SOURCE_TYPE_METADATA[t].category === form.category,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger || (
            <Button size="sm" className="gap-2">
              <Plus className="size-4" />
              Add Source
            </Button>
          )
        }
      />
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            Add New Source
          </DialogTitle>
          <DialogDescription>
            Record where deals or car opportunities originate (Section 9.1).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Category Selector Tabs */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Source Category
            </Label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-lg border">
              {SOURCE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                    form.category === cat
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {SOURCE_CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Specific Source Type Dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="sourceType">Specific Type *</Label>
            <select
              id="sourceType"
              value={form.type}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, type: e.target.value as SourceType }))
              }
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              {typesForCategory.map((type) => (
                <option key={type} value={type}>
                  {SOURCE_TYPE_METADATA[type].label}
                </option>
              ))}
            </select>
            {fieldErrors.type && (
              <p className="text-xs text-destructive">{fieldErrors.type[0]}</p>
            )}
          </div>

          {/* Source Name */}
          <div className="space-y-1.5">
            <Label htmlFor="sourceName">
              Source / Channel Name *
            </Label>
            <Input
              id="sourceName"
              placeholder="e.g. Ahmed Middleman or TikTok Ads"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            {fieldErrors.name && (
              <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>
            )}
          </div>

          {/* Phone & WhatsApp */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sourcePhone">Phone Number</Label>
              <Input
                id="sourcePhone"
                placeholder="+971 50 123 4567"
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sourceWhatsapp">WhatsApp</Label>
              <Input
                id="sourceWhatsapp"
                placeholder="+971 50 123 4567"
                value={form.whatsapp}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, whatsapp: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="sourceLocation">Location / Area</Label>
            <Input
              id="sourceLocation"
              placeholder="e.g. Sajaa, Sharjah or Dubai"
              value={form.location}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, location: e.target.value }))
              }
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="sourceNotes">Notes</Label>
            <Textarea
              id="sourceNotes"
              placeholder="e.g. Contact agreement, commission structure, deals history..."
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
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Source"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
