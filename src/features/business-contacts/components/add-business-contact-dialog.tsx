"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  Copy,
  Mail,
  MapPin,
  Phone,
  Plus,
  Star,
  Target,
  User,
} from "lucide-react";
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
  BUSINESS_CONTACT_CATEGORIES,
  type BusinessContactRowData,
} from "../domain/business-contact-types";
import {
  createBusinessContactAction,
  updateBusinessContactAction,
} from "../server/business-contact-actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: BusinessContactRowData | null;
  onSuccess?: () => void;
};

export function AddBusinessContactDialog({
  open,
  onOpenChange,
  contact,
  onSuccess,
}: Props) {
  const isEditing = Boolean(contact);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(contact?.name ?? "");
  const [businessName, setBusinessName] = useState(contact?.businessName ?? "");
  const [category, setCategory] = useState(contact?.category ?? "Web & IT");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(
    contact?.category ? !BUSINESS_CONTACT_CATEGORIES.includes(contact.category as any) : false,
  );
  const [purpose, setPurpose] = useState(contact?.purpose ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(contact?.whatsapp ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [location, setLocation] = useState(contact?.location ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [isImportant, setIsImportant] = useState(contact?.isImportant ?? false);

  // Sync state when contact prop changes
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && contact) {
      setName(contact.name);
      setBusinessName(contact.businessName ?? "");
      const isKnown = BUSINESS_CONTACT_CATEGORIES.includes(contact.category as any);
      if (isKnown) {
        setCategory(contact.category);
        setIsCustomCategory(false);
      } else {
        setCategory("Other");
        setCustomCategory(contact.category);
        setIsCustomCategory(true);
      }
      setPurpose(contact.purpose ?? "");
      setPhone(contact.phone ?? "");
      setWhatsapp(contact.whatsapp ?? "");
      setEmail(contact.email ?? "");
      setLocation(contact.location ?? "");
      setNotes(contact.notes ?? "");
      setIsImportant(contact.isImportant);
    } else if (nextOpen && !contact) {
      setName("");
      setBusinessName("");
      setCategory("Web & IT");
      setIsCustomCategory(false);
      setCustomCategory("");
      setPurpose("");
      setPhone("");
      setWhatsapp("");
      setEmail("");
      setLocation("");
      setNotes("");
      setIsImportant(false);
    }
    onOpenChange(nextOpen);
  };

  const effectiveCategory = isCustomCategory ? customCategory.trim() : category;

  function copyPhoneToWhatsApp() {
    if (phone) {
      setWhatsapp(phone);
      toast.info("Copied Phone Number to WhatsApp");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Contact name is required");
      return;
    }

    if (!effectiveCategory) {
      toast.error("Please specify a category");
      return;
    }

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        businessName: businessName.trim() || null,
        category: effectiveCategory,
        purpose: purpose.trim() || null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        location: location.trim() || null,
        notes: notes.trim() || null,
        isImportant,
      };

      if (isEditing && contact) {
        const res = await updateBusinessContactAction({
          ...payload,
          id: contact.id,
        });

        if (!res.ok) {
          toast.error(res.message || "Failed to update business contact");
          return;
        }

        toast.success(`Business contact "${res.data.name}" updated successfully`);
      } else {
        const res = await createBusinessContactAction(payload);

        if (!res.ok) {
          toast.error(res.message || "Failed to save business contact");
          return;
        }

        toast.success(`Business contact "${res.data.name}" added successfully`);
      }

      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Briefcase className="size-4" />
            </div>
            {isEditing ? "Edit Business Contact" : "Add Business Contact"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update details for this business associate, vendor, or professional."
              : "Save info for professionals, developers, suppliers, or services needed to run your business."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Important / Favorite toggle banner */}
          <div
            onClick={() => setIsImportant(!isImportant)}
            className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
              isImportant
                ? "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200 shadow-xs"
                : "border-border/60 bg-muted/30 hover:bg-muted/60 text-muted-foreground"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star
                className={`size-5 transition-transform ${
                  isImportant
                    ? "fill-amber-500 text-amber-500 scale-110"
                    : "text-muted-foreground"
                }`}
              />
              <div>
                <p className="text-xs font-semibold">
                  {isImportant ? "Marked as Important / Favorite" : "Mark as Important"}
                </p>
                <p className="text-[11px] opacity-80">
                  Highlighted in the contacts directory and filterable with 1-click
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                isImportant
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isImportant ? "FAVORITE" : "OFF"}
            </span>
          </div>

          {/* Name & Business Name */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name" className="text-xs font-semibold">
                Contact Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
                <Input
                  id="contact-name"
                  placeholder="e.g. Rahat"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-business" className="text-xs font-semibold">
                Business / Company Name
              </Label>
              <div className="relative">
                <Building2 className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
                <Input
                  id="contact-business"
                  placeholder="e.g. ABC Web Solutions"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="contact-category" className="text-xs font-semibold">
              Category <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select
                id="contact-category"
                value={isCustomCategory ? "CUSTOM" : category}
                onChange={(e) => {
                  if (e.target.value === "CUSTOM") {
                    setIsCustomCategory(true);
                  } else {
                    setIsCustomCategory(false);
                    setCategory(e.target.value);
                  }
                }}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2"
              >
                {BUSINESS_CONTACT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="CUSTOM">+ Other (Custom Category)...</option>
              </select>

              {isCustomCategory && (
                <Input
                  placeholder="Type custom category..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="text-sm"
                  autoFocus
                />
              )}
            </div>
          </div>

          {/* Purpose */}
          <div className="space-y-1.5">
            <Label htmlFor="contact-purpose" className="text-xs font-semibold">
              Purpose / Service Description
            </Label>
            <div className="relative">
              <Target className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
              <Input
                id="contact-purpose"
                placeholder="e.g. webpage handling website development"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </div>

          {/* Phone & WhatsApp */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact-phone" className="text-xs font-semibold">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
                <Input
                  id="contact-phone"
                  placeholder="+971 50 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="contact-whatsapp" className="text-xs font-semibold">
                  WhatsApp Number
                </Label>
                {phone && (
                  <button
                    type="button"
                    onClick={copyPhoneToWhatsApp}
                    className="text-primary hover:text-primary/80 flex items-center gap-1 text-[11px] font-medium transition-colors"
                  >
                    <Copy className="size-3" /> Same as phone
                  </button>
                )}
              </div>
              <div className="relative">
                <Phone className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
                <Input
                  id="contact-whatsapp"
                  placeholder="+971 50 123 4567"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Location & Email */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact-location" className="text-xs font-semibold">
                Location / City
              </Label>
              <div className="relative">
                <MapPin className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
                <Input
                  id="contact-location"
                  placeholder="e.g. Dhaka or Dubai"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-email" className="text-xs font-semibold">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="e.g. contact@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="contact-notes" className="text-xs font-semibold">
              Notes & Special Information
            </Label>
            <Textarea
              id="contact-notes"
              placeholder="e.g. Website developer from Dhaka, handles portal maintenance and server updates..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="gap-1.5">
              {isEditing ? (
                "Save Changes"
              ) : (
                <>
                  <Plus className="size-4" />
                  Add Contact
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
