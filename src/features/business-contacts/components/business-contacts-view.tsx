"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  ExternalLink,
  Filter,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Star,
  Tag,
  Target,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  BUSINESS_CONTACT_CATEGORIES,
  type BusinessContactRowData,
  type BusinessContactsKpis,
} from "../domain/business-contact-types";
import {
  deleteBusinessContactAction,
  toggleBusinessContactImportantAction,
} from "../server/business-contact-actions";
import { AddBusinessContactDialog } from "./add-business-contact-dialog";

export function BusinessContactsView({
  initialContacts,
  initialKpis,
  availableCategories,
}: {
  initialContacts: BusinessContactRowData[];
  initialKpis: BusinessContactsKpis;
  availableCategories: string[];
}) {
  const router = useRouter();
  const [contacts, setContacts] = useState<BusinessContactRowData[]>(initialContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyImportant, setOnlyImportant] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<BusinessContactRowData | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sync state if initialContacts changes
  useMemo(() => {
    setContacts(initialContacts);
  }, [initialContacts]);

  // Dynamic KPI counts based on live contacts state
  const totalContactsCount = contacts.length;
  const importantContactsCount = useMemo(
    () => contacts.filter((c) => c.isImportant).length,
    [contacts],
  );

  // Filtered contacts based on search, important toggle, and category
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Important filter
      if (onlyImportant && !contact.isImportant) {
        return false;
      }

      // Category filter
      if (selectedCategory !== "ALL" && contact.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = contact.name.toLowerCase().includes(q);
        const matchesBusiness = contact.businessName?.toLowerCase().includes(q);
        const matchesPurpose = contact.purpose?.toLowerCase().includes(q);
        const matchesPhone = contact.phone?.toLowerCase().includes(q);
        const matchesWhatsapp = contact.whatsapp?.toLowerCase().includes(q);
        const matchesLocation = contact.location?.toLowerCase().includes(q);
        const matchesNotes = contact.notes?.toLowerCase().includes(q);
        const matchesCategory = contact.category.toLowerCase().includes(q);

        return (
          matchesName ||
          matchesBusiness ||
          matchesPurpose ||
          matchesPhone ||
          matchesWhatsapp ||
          matchesLocation ||
          matchesNotes ||
          matchesCategory
        );
      }

      return true;
    });
  }, [contacts, onlyImportant, selectedCategory, searchQuery]);

  // Optimistic Toggle Important / Star
  function handleToggleImportant(contactId: string, currentStatus: boolean, contactName: string) {
    // Optimistically update local state
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, isImportant: !currentStatus } : c)),
    );

    startTransition(async () => {
      const res = await toggleBusinessContactImportantAction(contactId);
      if (!res.ok) {
        // Revert on failure
        setContacts((prev) =>
          prev.map((c) => (c.id === contactId ? { ...c, isImportant: currentStatus } : c)),
        );
        toast.error(res.message || "Failed to update status");
        return;
      }

      const nextStatus = !currentStatus;
      toast.success(
        nextStatus
          ? `⭐ Added "${contactName}" to Important list`
          : `Removed "${contactName}" from Important list`,
      );
      router.refresh();
    });
  }

  // Delete contact
  function handleDeleteContact(contact: BusinessContactRowData) {
    if (
      !confirm(
        `Are you sure you want to delete "${contact.name}" (${contact.businessName || contact.category})?`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteBusinessContactAction(contact.id);
      if (!res.ok) {
        toast.error(res.message || "Failed to delete contact");
        return;
      }

      toast.success(`Contact "${contact.name}" removed`);
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
      router.refresh();
    });
  }

  // Category options
  const categoryOptions = useMemo(() => {
    const set = new Set<string>([...BUSINESS_CONTACT_CATEGORIES, ...availableCategories]);
    return Array.from(set).filter(Boolean);
  }, [availableCategories]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Briefcase className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Business Contacts</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage essential professionals, developers, suppliers, and service providers needed to run your operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAddOpen(true)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <Plus className="size-4" />
            Add Business Contact
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Total Business Contacts
            </CardTitle>
            <Users className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContactsCount}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              Active service providers & contacts
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/[0.03] shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-amber-700 dark:text-amber-300 text-xs font-medium uppercase tracking-wider">
              Important / Favorites
            </CardTitle>
            <Star className="size-4 fill-amber-500 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {importantContactsCount}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Quick-access priority contacts
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Service Categories
            </CardTitle>
            <Tag className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableCategories.length || 1}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              IT, Legal, Transport, Repair & more
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
            <Input
              placeholder="Search by name, business, purpose, phone, Dhaka, Dubai..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          {/* Important List Toggle Button (User requested: "Ay page a important list button thakbe search option r sathe filter hishebe") */}
          <Button
            type="button"
            variant={onlyImportant ? "default" : "outline"}
            onClick={() => setOnlyImportant(!onlyImportant)}
            className={`gap-2 text-xs font-medium transition-all ${
              onlyImportant
                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs border-amber-500"
                : "border-border hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
            }`}
          >
            <Star
              className={`size-4 ${onlyImportant ? "fill-white text-white" : "fill-amber-500 text-amber-500"}`}
            />
            <span>Important List</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                onlyImportant ? "bg-white text-amber-600" : "bg-muted text-muted-foreground"
              }`}
            >
              {importantContactsCount}
            </span>
          </Button>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="text-muted-foreground size-4" />
            <select
              aria-label="Filter contacts by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring h-9 rounded-md border px-3 py-1 text-xs shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2"
            >
              <option value="ALL">All Categories ({contacts.length})</option>
              {categoryOptions.map((cat) => {
                const catCount = contacts.filter((c) => c.category === cat).length;
                return (
                  <option key={cat} value={cat}>
                    {cat} {catCount > 0 ? `(${catCount})` : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Quick Filter Pill Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase mr-1">
            Quick Filter:
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("ALL");
              setOnlyImportant(false);
            }}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedCategory === "ALL" && !onlyImportant
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            All ({contacts.length})
          </button>
          <button
            type="button"
            onClick={() => setOnlyImportant(true)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              onlyImportant
                ? "bg-amber-500 text-white"
                : "bg-muted hover:bg-amber-500/10 hover:text-amber-600 text-muted-foreground"
            }`}
          >
            <Star className={`size-3 ${onlyImportant ? "fill-white" : "fill-amber-500 text-amber-500"}`} />
            Important ({importantContactsCount})
          </button>
          {categoryOptions.slice(0, 5).map((cat) => {
            const count = contacts.filter((c) => c.category === cat).length;
            if (count === 0) return null;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(isSelected ? "ALL" : cat);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-emerald-600 text-white"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Contacts Cards Grid */}
      {filteredContacts.length === 0 ? (
        <div className="bg-card flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center shadow-xs">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
            <Briefcase className="size-7" />
          </div>
          <h3 className="text-base font-semibold">No business contacts found</h3>
          <p className="text-muted-foreground mt-1 max-w-md text-sm">
            {searchQuery || onlyImportant || selectedCategory !== "ALL"
              ? "No contacts match the current search filters. Try clearing your filters or search terms."
              : "Save contact details for your developers, lawyers, mechanics, towing services, and business partners."}
          </p>
          <div className="mt-5 flex gap-2">
            {(searchQuery || onlyImportant || selectedCategory !== "ALL") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setOnlyImportant(false);
                  setSelectedCategory("ALL");
                }}
              >
                Clear Filters
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="size-4" />
              Add First Contact
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => (
            <Card
              key={contact.id}
              className={`relative flex flex-col justify-between overflow-hidden border transition-all hover:shadow-md ${
                contact.isImportant
                  ? "border-amber-500/40 bg-card shadow-xs ring-1 ring-amber-500/20"
                  : "border-border/60 bg-card shadow-xs hover:border-border"
              }`}
            >
              {/* Card Header */}
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-bold text-foreground">
                        {contact.name}
                      </h3>
                      {contact.isImportant && (
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.2 text-[10px] font-bold">
                          IMPORTANT
                        </span>
                      )}
                    </div>

                    {contact.businessName ? (
                      <p className="flex items-center gap-1.5 truncate text-xs font-semibold text-primary mt-0.5">
                        <Building2 className="size-3.5 shrink-0" />
                        {contact.businessName}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-xs mt-0.5">Individual Professional</p>
                    )}
                  </div>

                  {/* Star Toggle & More Menu */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title={contact.isImportant ? "Remove from Important" : "Mark as Important"}
                      onClick={() =>
                        handleToggleImportant(contact.id, contact.isImportant, contact.name)
                      }
                      disabled={isPending}
                      className={`flex size-8 items-center justify-center rounded-lg transition-transform active:scale-95 ${
                        contact.isImportant
                          ? "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25"
                          : "text-muted-foreground/50 hover:text-amber-500 hover:bg-amber-500/10"
                      }`}
                    >
                      <Star
                        className={`size-4.5 transition-all ${
                          contact.isImportant ? "fill-amber-500 text-amber-500" : ""
                        }`}
                      />
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-hidden cursor-pointer"
                        aria-label={`Actions for ${contact.name}`}
                      >
                        <MoreVertical className="size-4 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditingContact(contact)}
                          className="gap-2"
                        >
                          <Briefcase className="size-4" /> Edit Contact
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleToggleImportant(
                              contact.id,
                              contact.isImportant,
                              contact.name,
                            )
                          }
                          className="gap-2"
                        >
                          <Star className="size-4 text-amber-500" />
                          {contact.isImportant ? "Remove Important" : "Mark as Important"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteContact(contact)}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4" /> Delete Contact
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="mt-2.5 flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    {contact.category}
                  </Badge>
                  {contact.location && (
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <MapPin className="size-3 text-muted-foreground/70" />
                      {contact.location}
                    </span>
                  )}
                </div>

                {/* Purpose Highlight (Requested: "Purpose: webpage handling website development") */}
                {contact.purpose && (
                  <div className="bg-muted/50 border-border/60 mt-3 rounded-lg border p-2.5 text-xs">
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-semibold">
                      <Target className="size-3 text-emerald-600" /> Purpose:
                    </span>
                    <p className="text-foreground/90 font-medium mt-0.5 leading-relaxed">
                      {contact.purpose}
                    </p>
                  </div>
                )}

                {/* Notes (Requested: "Notes: Website developer from Dhaka") */}
                {contact.notes && (
                  <p className="text-muted-foreground mt-2 line-clamp-2 text-xs italic">
                    &ldquo;{contact.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Card Footer: Quick Actions */}
              <div className="bg-muted/20 border-border/50 flex items-center justify-between border-t p-3 text-xs">
                <div className="flex items-center gap-2">
                  {contact.phone ? (
                    <a
                      href={`tel:${contact.phone}`}
                      className="hover:bg-primary/10 hover:text-primary flex items-center gap-1 rounded-md px-2 py-1 font-mono font-medium text-foreground transition-colors"
                      title="Click to call"
                    >
                      <Phone className="size-3.5 text-emerald-600" />
                      {contact.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground/60 text-[11px]">No phone</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {contact.whatsapp && (
                    <a
                      href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors"
                      title="Open WhatsApp chat"
                    >
                      <MessageSquare className="size-3.5" />
                      WhatsApp
                    </a>
                  )}

                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-md p-1.5 transition-colors"
                      title={`Send email to ${contact.email}`}
                    >
                      <Mail className="size-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialogs */}
      <AddBusinessContactDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={() => router.refresh()}
      />

      {editingContact && (
        <AddBusinessContactDialog
          open={Boolean(editingContact)}
          onOpenChange={(open) => {
            if (!open) setEditingContact(null);
          }}
          contact={editingContact}
          onSuccess={() => {
            setEditingContact(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
