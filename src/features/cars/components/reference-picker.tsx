"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Plus, Search, UserCheck, X } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find((option) => option.id === value),
    [options, value],
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return options.slice(0, 8);

    return options
      .filter((option) =>
        `${option.name} ${option.detail ?? ""}`
          .toLocaleLowerCase()
          .includes(normalized),
      )
      .slice(0, 8);
  }, [options, query]);

  function select(option: ReferenceOption) {
    onChange(option.id);
    setQuery("");
    setOpen(false);
  }

  function clearSelection() {
    onChange("");
    setQuery("");
    setOpen(false);
  }

  function openSearch() {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div ref={containerRef} className="relative">
      {selected && !open ? (
        <div className="border-input bg-muted/40 hover:bg-muted/60 flex items-center justify-between rounded-lg border px-3 py-2 transition-colors">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
              <UserCheck className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-foreground truncate text-sm leading-tight font-medium">
                {selected.name}
              </p>
              {selected.detail && (
                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                  {selected.detail}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={openSearch}
              className="h-7 text-xs font-normal"
            >
              Change
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={clearSelection}
              className="text-muted-foreground hover:text-destructive size-7 p-0"
              title="Remove selection"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            ref={inputRef}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            autoComplete="off"
            disabled={disabled}
            placeholder={placeholder}
            value={query}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOpen(false);
              }
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            className="pr-20 pl-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-14 -translate-y-1/2 p-1"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setOpen(false);
              onAdd();
            }}
            className="absolute top-1/2 right-1 -translate-y-1/2"
          >
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      )}

      {open && !disabled && (
        <div
          role="listbox"
          className="bg-popover text-popover-foreground border-border absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border p-1.5 shadow-xl"
        >
          {filtered.length > 0 ? (
            <div className="space-y-0.5">
              {filtered.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={option.id === value}
                  onClick={() => select(option)}
                  className={cn(
                    "hover:bg-accent flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    option.id === value && "bg-accent/80 font-medium",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-foreground block truncate font-medium">
                      {option.name}
                    </span>
                    {option.detail && (
                      <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                        {option.detail}
                      </span>
                    )}
                  </div>
                  {option.id === value && (
                    <Check className="text-primary size-4 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground px-3 py-4 text-center text-sm">
              {emptyText}
            </p>
          )}
          <div className="border-border/60 mt-1 border-t pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAdd();
              }}
              className="text-primary hover:bg-primary/10 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors"
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
