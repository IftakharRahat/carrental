"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ReferenceOption = {
  id: string;
  name: string;
  detail: string | null;
};

type ReferencePickerProps = {
  options: readonly ReferenceOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  emptyText: string;
  addLabel: string;
  onAdd: () => void;
  disabled?: boolean;
};

export function ReferencePicker({
  options,
  value,
  onChange,
  placeholder,
  emptyText,
  addLabel,
  onAdd,
  disabled = false,
}: ReferencePickerProps) {
  const selected = options.find((option) => option.id === value);
  const [query, setQuery] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized || selected?.name === query) return options.slice(0, 8);

    return options
      .filter((option) =>
        `${option.name} ${option.detail ?? ""}`
          .toLocaleLowerCase()
          .includes(normalized),
      )
      .slice(0, 8);
  }, [options, query, selected?.name]);

  function select(option: ReferenceOption) {
    onChange(option.id);
    setQuery(option.name);
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange("");
            setOpen(true);
          }}
          className="pr-24 pl-9"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onAdd}
          className="absolute top-1/2 right-1 -translate-y-1/2"
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {open && !disabled && (
        <div
          role="listbox"
          className="bg-popover text-popover-foreground absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border p-1 shadow-lg"
        >
          {filtered.length > 0 ? (
            filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={option.id === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(option)}
                className={cn(
                  "hover:bg-accent flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm",
                  option.id === value && "bg-accent",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {option.name}
                  </span>
                  {option.detail && (
                    <span className="text-muted-foreground block truncate text-xs">
                      {option.detail}
                    </span>
                  )}
                </span>
                {option.id === value && <Check className="size-4" />}
              </button>
            ))
          ) : (
            <p className="text-muted-foreground px-3 py-4 text-center text-sm">
              {emptyText}
            </p>
          )}
          <div className="mt-1 border-t pt-1">
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={onAdd}
              className="text-primary hover:bg-accent flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium"
            >
              <Plus className="size-4" />
              {addLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
