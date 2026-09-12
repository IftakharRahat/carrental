"use client";

import { useState, useTransition } from "react";
import { Copy } from "lucide-react";
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
import type { SourceType } from "@/features/cars/domain/car-input";
import {
  createSellerAction,
  createSourceAction,
} from "@/features/cars/server/contact-actions";
import type {
  SellerOption,
  SourceOption,
} from "@/features/cars/server/reference-data";

type DialogStateProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ContactFields = {
  name: string;
  phone: string;
  whatsapp: string;
  location: string;
  notes: string;
};

const emptyContact: ContactFields = {
  name: "",
  phone: "",
  whatsapp: "",
  location: "",
  notes: "",
};

export function AddSellerDialog({
  open,
  onOpenChange,
  onCreated,
}: DialogStateProps & { onCreated: (seller: SellerOption) => void }) {
  const [fields, setFields] = useState({ ...emptyContact, emiratesId: "" });
  const [message, setMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function update(name: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  function save() {
    setMessage(undefined);
    startTransition(async () => {
      const result = await createSellerAction(fields);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      onCreated(result.data);
      setFields({ ...emptyContact, emiratesId: "" });
      onOpenChange(false);
    });
  }

  return (
    <ContactDialog
      title="Add new seller"
      description="Save the actual owner or person selling this car."
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setMessage(undefined);
        onOpenChange(nextOpen);
      }}
      fields={fields}
      onUpdate={update}
      onSave={save}
      isPending={isPending}
      message={message}
      extraField={
        <Field label="Emirates ID" htmlFor="seller-emirates-id">
          <Input
            id="seller-emirates-id"
            value={fields.emiratesId}
            onChange={(event) => update("emiratesId", event.target.value)}
          />
        </Field>
      }
    />
  );
}

export function AddSourceDialog({
  open,
  onOpenChange,
  defaultType,
  onCreated,
}: DialogStateProps & {
  defaultType: SourceType;
  onCreated: (source: SourceOption) => void;
}) {
  const [fields, setFields] = useState<ContactFields>(emptyContact);
  const [message, setMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function update(name: keyof ContactFields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  function save() {
    setMessage(undefined);
    startTransition(async () => {
      const result = await createSourceAction({ ...fields, type: defaultType });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      onCreated(result.data);
      setFields(emptyContact);
      onOpenChange(false);
    });
  }

  return (
    <ContactDialog
      title="Add new source"
      description="Save this source once, then reuse it for future purchases."
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setMessage(undefined);
        onOpenChange(nextOpen);
      }}
      fields={fields}
      onUpdate={update}
      onSave={save}
      isPending={isPending}
      message={message}
      extraField={
        <Field label="Source type" htmlFor="source-type-display">
          <Input
            id="source-type-display"
            value={sourceTypeLabels[defaultType]}
            disabled
          />
        </Field>
      }
    />
  );
}

function ContactDialog<TFields extends ContactFields>({
  title,
  description,
  open,
  onOpenChange,
  fields,
  onUpdate,
  onSave,
  isPending,
  message,
  extraField,
}: DialogStateProps & {
  title: string;
  description: string;
  fields: TFields;
  onUpdate: (name: keyof TFields, value: string) => void;
  onSave: () => void;
  isPending: boolean;
  message?: string;
  extraField: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field
            label="Name *"
            htmlFor={`${title}-name`}
            className="sm:col-span-2"
          >
            <Input
              id={`${title}-name`}
              autoFocus
              value={fields.name}
              onChange={(event) => onUpdate("name", event.target.value)}
            />
          </Field>
          <Field label="Phone" htmlFor={`${title}-phone`}>
            <Input
              id={`${title}-phone`}
              inputMode="tel"
              value={fields.phone}
              onChange={(event) => onUpdate("phone", event.target.value)}
            />
          </Field>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${title}-whatsapp`}>WhatsApp</Label>
              {fields.phone && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdate("whatsapp", fields.phone);
                    toast.info("Copied Phone Number to WhatsApp");
                  }}
                  className="text-primary hover:text-primary/80 flex items-center gap-1 text-[11px] font-medium transition-colors"
                >
                  <Copy className="size-3" /> Same as phone
                </button>
              )}
            </div>
            <Input
              id={`${title}-whatsapp`}
              inputMode="tel"
              value={fields.whatsapp}
              onChange={(event) => onUpdate("whatsapp", event.target.value)}
            />
          </div>
          {extraField}
          <Field label="Location" htmlFor={`${title}-location`}>
            <Input
              id={`${title}-location`}
              value={fields.location}
              onChange={(event) => onUpdate("location", event.target.value)}
            />
          </Field>
          <Field
            label="Notes"
            htmlFor={`${title}-notes`}
            className="sm:col-span-2"
          >
            <Textarea
              id={`${title}-notes`}
              value={fields.notes}
              onChange={(event) => onUpdate("notes", event.target.value)}
            />
          </Field>
        </div>
        {message && <p className="text-destructive text-sm">{message}</p>}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending || fields.name.trim().length < 2}
            onClick={onSave}
          >
            {isPending ? "Saving…" : "Save and select"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className ? `grid gap-2 ${className}` : "grid gap-2"}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

const sourceTypeLabels: Record<SourceType, string> = {
  GARAGE_OWNER: "Garage Owner",
  MIDDLEMAN: "Middleman",
  REFERRAL: "Referral",
  AUCTION: "Auction",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  WALK_IN: "Walk-in",
};
