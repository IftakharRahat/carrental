"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CarFront,
  CheckCircle2,
  Clock,
  Eye,
  FileDown,
  FileText,
  MapPin,
  MessageSquare,
  MoreVertical,
  Phone,
  Plus,
  Printer,
  Search,
  Share2,
  Sparkles,
  Tag,
  Trash2,
  User,
  XCircle,
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
  formatQuotationDate,
  generateQuotationWhatsAppMessage,
  generateWhatsAppUrl,
  type QuotationData,
} from "../domain/quotation-types";
import {
  deleteQuotationAction,
  updateQuotationStatusAction,
} from "../server/quotation-actions";
import { QuotationModal } from "./quotation-modal";

export function QuotationsView({
  initialQuotations,
}: {
  initialQuotations: QuotationData[];
}) {
  const router = useRouter();
  const [quotations, setQuotations] = useState<QuotationData[]>(initialQuotations);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationData | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sync with props
  useMemo(() => {
    setQuotations(initialQuotations);
  }, [initialQuotations]);

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (statusFilter !== "ALL" && q.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = q.customerName.toLowerCase().includes(query);
        const matchesVehicle = q.vehicleModel.toLowerCase().includes(query);
        const matchesPhone = q.customerWhatsapp?.toLowerCase().includes(query);
        const matchesRef = q.quotationNumberFormatted.toLowerCase().includes(query);
        const matchesLocation = q.customerLocation?.toLowerCase().includes(query);
        return matchesName || matchesVehicle || matchesPhone || matchesRef || matchesLocation;
      }
      return true;
    });
  }, [quotations, statusFilter, searchQuery]);

  function handleStatusChange(
    id: string,
    status: "OFFERED" | "ACCEPTED" | "REJECTED" | "EXPIRED",
  ) {
    startTransition(async () => {
      const res = await updateQuotationStatusAction(id, status);
      if (!res.ok) {
        toast.error("Failed to update status");
        return;
      }
      setQuotations((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status } : q)),
      );
      toast.success(`Status updated to ${status}`);
      router.refresh();
    });
  }

  function handleDelete(id: string, refNum: string) {
    if (!confirm(`Are you sure you want to delete quotation ${refNum}?`)) {
      return;
    }
    startTransition(async () => {
      const res = await deleteQuotationAction(id);
      if (!res.ok) {
        toast.error("Failed to delete quotation");
        return;
      }
      setQuotations((prev) => prev.filter((q) => q.id !== id));
      toast.success(`Quotation ${refNum} deleted`);
      router.refresh();
    });
  }

  function handleQuickWhatsApp(q: QuotationData) {
    const msg = generateQuotationWhatsAppMessage(q);
    const url = generateWhatsAppUrl(q.customerWhatsapp, msg);
    window.open(url, "_blank");
  }

  function handleNativeShare(q: QuotationData) {
    const msg = generateQuotationWhatsAppMessage(q);
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      navigator.share({
        title: `Offer ${q.quotationNumberFormatted} - ${q.vehicleModel}`,
        text: msg,
      }).catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        navigator.clipboard.writeText(msg);
        toast.success("Offer details copied to clipboard!");
      });
    } else {
      navigator.clipboard.writeText(msg);
      toast.success("Offer details copied to clipboard!");
    }
  }

  const totalOfferedValue = useMemo(
    () => quotations.reduce((acc, q) => acc + q.offerPrice, 0),
    [quotations],
  );

  const acceptedCount = useMemo(
    () => quotations.filter((q) => q.status === "ACCEPTED").length,
    [quotations],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <FileText className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Vehicle Purchase Offers (Quotations)
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Generate, preview, share via WhatsApp, and print professional vehicle purchase offer PDFs.
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedQuotation(null);
            setIsModalOpen(true);
          }}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold"
        >
          <Plus className="size-4" />
          Create New Quotation
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Total Quotations
            </CardTitle>
            <FileText className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotations.length}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              Recorded vehicle purchase offers
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/[0.03] shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-emerald-700 dark:text-emerald-300 text-xs font-medium uppercase tracking-wider">
              Total Offer Value
            </CardTitle>
            <Sparkles className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              AED {totalOfferedValue.toLocaleString("en-US")}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Aggregate purchase offers made
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Deals Accepted
            </CardTitle>
            <CheckCircle2 className="text-emerald-600 size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptedCount}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              Vehicles successfully purchased
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
            <Input
              placeholder="Search by customer name, vehicle, WhatsApp, ref number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1.5">
            {["ALL", "OFFERED", "ACCEPTED", "REJECTED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {st === "ALL" ? `All (${quotations.length})` : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quotations List */}
      {filteredQuotations.length === 0 ? (
        <div className="bg-card flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center shadow-xs">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
            <FileText className="size-7" />
          </div>
          <h3 className="text-base font-semibold">No quotations found</h3>
          <p className="text-muted-foreground mt-1 max-w-md text-sm">
            {searchQuery || statusFilter !== "ALL"
              ? "No quotations match the active filters."
              : "Generate and send vehicle purchase offer PDFs to WhatsApp customers whenever negotiating a vehicle."}
          </p>
          <div className="mt-5">
            <Button
              onClick={() => {
                setSelectedQuotation(null);
                setIsModalOpen(true);
              }}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <Plus className="size-4" />
              Create First Quotation
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredQuotations.map((q) => (
            <Card
              key={q.id}
              className="flex flex-col justify-between overflow-hidden border border-border/70 hover:shadow-md transition-all bg-card shadow-xs"
            >
              <div className="p-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] font-bold text-primary">
                      {q.quotationNumberFormatted}
                    </span>
                    <h3 className="text-sm font-bold text-foreground mt-0.5 truncate">
                      {q.customerName}
                    </h3>
                  </div>

                  <Badge
                    variant={
                      q.status === "ACCEPTED"
                        ? "default"
                        : q.status === "REJECTED"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-[9px] font-bold shrink-0"
                  >
                    {q.status}
                  </Badge>
                </div>

                {/* Vehicle & Condition */}
                <div className="mt-2 rounded-md bg-muted/40 p-2 space-y-0.5 text-[11px]">
                  <div className="flex items-center gap-1 font-bold text-foreground">
                    <CarFront className="size-3 text-primary shrink-0" />
                    <span className="truncate">
                      {q.vehicleModel} {q.modelYear ? `(${q.modelYear})` : ""}
                    </span>
                  </div>
                  <p className="text-rose-700 dark:text-rose-400 font-semibold text-[10px]">
                    Condition: {q.condition}
                  </p>
                </div>

                {/* Offer Price Highlight */}
                <div className="mt-2 flex items-baseline justify-between border-t pt-2">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Our Best Offer:
                  </span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    AED {q.offerPrice.toLocaleString("en-US")}
                  </span>
                </div>

                {q.askingPrice != null && q.askingPrice > 0 && (
                  <div className="flex items-baseline justify-between text-[10px] text-muted-foreground">
                    <span>Customer Asking:</span>
                    <span className="line-through">
                      AED {q.askingPrice.toLocaleString("en-US")}
                    </span>
                  </div>
                )}

                {/* WhatsApp Condition Notes */}
                {q.customerNotes && (
                  <p className="mt-1.5 line-clamp-2 text-[10px] italic text-muted-foreground border-l-2 border-amber-400 pl-1.5">
                    &ldquo;{q.customerNotes}&rdquo;
                  </p>
                )}
              </div>

              {/* Card Footer: Action Buttons */}
              <div className="bg-muted/20 border-border/50 flex items-center justify-between border-t px-2.5 py-2 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedQuotation(q);
                    setIsModalOpen(true);
                  }}
                  className="gap-1 text-[11px] font-semibold h-7 px-2"
                >
                  <Eye className="size-3 text-primary" />
                  Preview & PDF
                </Button>

                <div className="flex items-center gap-1">
                  {q.customerWhatsapp && (
                    <Button
                      size="sm"
                      onClick={() => handleQuickWhatsApp(q)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-[11px] h-7 px-2"
                      title="WhatsApp message"
                    >
                      <MessageSquare className="size-3" />
                      WhatsApp
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleNativeShare(q)}
                    className="gap-1 text-[11px] h-7 px-2"
                    title="Share offer details"
                  >
                    <Share2 className="size-3 text-slate-600" />
                    Share
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-hidden cursor-pointer"
                      aria-label="More options"
                    >
                      <MoreVertical className="size-3.5 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleNativeShare(q)}
                        className="gap-2"
                      >
                        <Share2 className="size-4" /> Share Offer Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(q.id, "ACCEPTED")}
                        className="gap-2 text-emerald-600"
                      >
                        <CheckCircle2 className="size-4" /> Mark as Accepted
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(q.id, "REJECTED")}
                        className="gap-2 text-rose-600"
                      >
                        <XCircle className="size-4" /> Mark as Rejected
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(q.id, "OFFERED")}
                        className="gap-2"
                      >
                        <Clock className="size-4" /> Mark as Offered
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(q.id, q.quotationNumberFormatted)}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" /> Delete Quotation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal instance */}
      <QuotationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={
          selectedQuotation
            ? {
                ...selectedQuotation,
              }
            : null
        }
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
