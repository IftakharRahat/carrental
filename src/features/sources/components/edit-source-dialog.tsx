"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit3 } from "lucide-react";
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
import {
  SOURCE_CATEGORIES,
  SOURCE_CATEGORY_LABELS,
  SOURCE_TYPE_METADATA,
  SOURCE_TYPES,
  type SourceCategory,
  type SourceRowData,
  type SourceType,
} from "../domain/source-types";
import { updateSourceAction } from "../server/source-actions";

export function EditSourceDialog({
  source,
  open,
  onOpenChange,
}: {
  source: SourceRowData | {
    id: string;
    name: string;
    type: SourceType;
    category: SourceCategory;
    phone: string | null;
    whatsapp: string | null;
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
            Edit Source
          </DialogTitle>
          <DialogDescription>
            Update details for {source.name}.
          </DialogDescription>
        </DialogHeader>
        <EditSourceForm source={source} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditSourceForm({
  source,
  onClose,
}: {
  source: {
    id: string;
    name: string;
    type: SourceType;
    category: SourceCategory;
    phone: string | null;
    whatsapp: string | null;
    location: string | null;
    notes: string | null;
  };
  onClose: () => void;
}) {
  const [name, setName] = useState(source.name);
  const [category, setCategory] = useState<SourceCategory>(source.category);
  const [type, setType] = useState<SourceType>(source.type);
  const [phone, setPhone] = useState(source.phone || "");
  const [whatsapp, setWhatsapp] = useState(source.whatsapp || "");
  const [location, setLocation] = useState(source.location || "");
  const [notes, setNotes] = useState(source.notes || "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCategoryChange(newCat: SourceCategory) {
    const available = SOURCE_TYPES.filter(
      (t) => SOURCE_TYPE_METADATA[t].category === newCat,
    );
    setCategory(newCat);
    setType(available[0] || type);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    startTransition(async () => {
      const res = await updateSourceAction({
        id: source.id,
        name,
        type,
        phone: phone || undefined,
        whatsapp: whatsapp || undefined,
        location: location || undefined,
        notes: notes || undefined,
      });

      if (!res.ok) {
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
        toast.error(res.message || "Failed to update source");
        return;
      }

      toast.success("Source updated successfully");
      onClose();
      router.refresh();
    });
  }

  const typesForCategory = SOURCE_TYPES.filter(
    (t) => SOURCE_TYPE_METADATA[t].category === category,
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {/* Category selector */}
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
                category === cat
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {SOURCE_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Specific Type */}
      <div className="space-y-1.5">
        <Label htmlFor="editSourceType">Specific Type *</Label>
        <select
          id="editSourceType"
          value={type}
          onChange={(e) => setType(e.target.value as SourceType)}
          className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          {typesForCategory.map((t) => (
            <option key={t} value={t}>
              {SOURCE_TYPE_METADATA[t].label}
            </option>
          ))}
        </select>
        {fieldErrors.type && (
          <p className="text-xs text-destructive">{fieldErrors.type[0]}</p>
        )}
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="editSourceName">Source / Channel Name *</Label>
        <Input
          id="editSourceName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {fieldErrors.name && (
          <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>
        )}
      </div>

      {/* Phone & WhatsApp */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="editSourcePhone">Phone Number</Label>
          <Input
            id="editSourcePhone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editSourceWhatsapp">WhatsApp</Label>
          <Input
            id="editSourceWhatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="editSourceLocation">Location / Area</Label>
        <Input
          id="editSourceLocation"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="editSourceNotes">Notes</Label>
        <Textarea
          id="editSourceNotes"
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
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
