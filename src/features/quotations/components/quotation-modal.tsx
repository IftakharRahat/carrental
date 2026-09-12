"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  FileDown,
  FileText,
  Loader2,
  MessageSquare,
  Printer,
  Save,
  Share2,
  Sparkles,
  User,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
  DEFAULT_BUSINESS_ADDRESS,
  DEFAULT_BUSINESS_NAME,
  DEFAULT_BUSINESS_PHONE,
  DEFAULT_TERMS,
  generateQuotationWhatsAppMessage,
  generateWhatsAppUrl,
  type QuotationInput,
} from "../domain/quotation-types";
import { saveQuotationAction } from "../server/quotation-actions";
import { VehicleOfferDocument } from "./vehicle-offer-document";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<QuotationInput> | null;
  onSaved?: () => void;
};

export function QuotationModal({
  open,
  onOpenChange,
  initialData,
  onSaved,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Tab mode: "FORM" or "PREVIEW"
  const [mode, setMode] = useState<"FORM" | "PREVIEW">("FORM");

  // Form Fields
  const [businessName, setBusinessName] = useState(
    initialData?.businessName ?? DEFAULT_BUSINESS_NAME,
  );
  const [businessPhone, setBusinessPhone] = useState(
    initialData?.businessPhone ?? DEFAULT_BUSINESS_PHONE,
  );
  const [businessAddress, setBusinessAddress] = useState(
    initialData?.businessAddress ?? DEFAULT_BUSINESS_ADDRESS,
  );
  const [quotationDate, setQuotationDate] = useState(
    initialData?.quotationDate ?? new Date().toISOString().split("T")[0],
  );
  const [customerName, setCustomerName] = useState(initialData?.customerName ?? "");
  const [customerWhatsapp, setCustomerWhatsapp] = useState(
    initialData?.customerWhatsapp ?? "",
  );
  const [customerLocation, setCustomerLocation] = useState(
    initialData?.customerLocation ?? "",
  );
  const [vehicleModel, setVehicleModel] = useState(
    initialData?.vehicleModel ?? "",
  );
  const [modelYear, setModelYear] = useState<number | string>(
    initialData?.modelYear ?? new Date().getFullYear(),
  );
  const [condition, setCondition] = useState(
    initialData?.condition ?? "Accident / Damaged",
  );
  const [customerNotes, setCustomerNotes] = useState(
    initialData?.customerNotes ?? "",
  );
  const [askingPrice, setAskingPrice] = useState<number | string>(
    initialData?.askingPrice ?? "",
  );
  const [offerPrice, setOfferPrice] = useState<number | string>(
    initialData?.offerPrice ?? "",
  );
  const [terms, setTerms] = useState(initialData?.terms ?? DEFAULT_TERMS);

  const documentRef = useRef<HTMLDivElement>(null);

  // Reset or load initial values when opened
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && !initialData) {
      setMode("FORM");
    }
    onOpenChange(nextOpen);
  };

  // Pre-fill user's exact demo request for quick testing
  function prefillSampleDemo() {
    setBusinessName("USED GARAGE UAE");
    setBusinessPhone("+971 56 270 9960");
    setBusinessAddress("Sharjah 10 Industrial Area");
    setQuotationDate(new Date().toISOString().split("T")[0]);
    setCustomerName("Ahmed Mohammed");
    setCustomerWhatsapp("+971 50 123 4567");
    setCustomerLocation("Sharjah, UAE");
    setVehicleModel("Nissan Patrol");
    setModelYear(2018);
    setCondition("Accident / Damaged");
    setCustomerNotes(
      "Front-end damaged, engine is running, airbags are deployed, and the vehicle has been standing for approximately 2 months.",
    );
    setAskingPrice(18000);
    setOfferPrice(12500);
    setTerms(DEFAULT_TERMS);
    toast.success("Loaded Ahmed Mohammed's Nissan Patrol sample data");
  }

  // Construct current data payload
  const currentQuotationData: QuotationInput = {
    businessName: businessName.trim() || DEFAULT_BUSINESS_NAME,
    businessPhone: businessPhone.trim() || DEFAULT_BUSINESS_PHONE,
    businessAddress: businessAddress.trim() || DEFAULT_BUSINESS_ADDRESS,
    quotationDate,
    customerName: customerName.trim(),
    customerWhatsapp: customerWhatsapp.trim() || null,
    customerLocation: customerLocation.trim() || null,
    vehicleModel: vehicleModel.trim(),
    modelYear: modelYear ? Number(modelYear) : null,
    condition: condition.trim() || "Accident / Damaged",
    customerNotes: customerNotes.trim() || null,
    askingPrice: askingPrice ? Number(askingPrice) : null,
    offerPrice: offerPrice ? Number(offerPrice) : 0,
    terms: terms.trim() || DEFAULT_TERMS,
    status: "OFFERED",
  };

  // Validate for preview
  function handleGoToPreview(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Please enter the customer name");
      return;
    }
    if (!vehicleModel.trim()) {
      toast.error("Please enter the vehicle make & model");
      return;
    }
    if (!offerPrice || Number(offerPrice) <= 0) {
      toast.error("Please enter your Best Offer Price (AED)");
      return;
    }
    setMode("PREVIEW");
  }

  // 1. Generate & Download PDF Action
  async function handleGeneratePdf() {
    setIsGeneratingPdf(true);
    try {
      const { toJpeg } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      const element = document.getElementById("printable-quotation-offer");
      if (!element) {
        throw new Error("Could not find quotation document element");
      }

      toast.info("Generating professional PDF...");

      // Standard fixed document width (760px) ensures right side is NEVER truncated regardless of screen or modal width
      const TARGET_WIDTH = 760;

      // Convert HTML element to crisp high-res JPEG with native compression (~200KB vs 7MB raw PNG)
      const dataUrl = await toJpeg(element, {
        quality: 0.90,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: TARGET_WIDTH,
        style: {
          width: `${TARGET_WIDTH}px`,
          maxWidth: `${TARGET_WIDTH}px`,
          minWidth: `${TARGET_WIDTH}px`,
          margin: "0",
          boxShadow: "none",
        },
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();

      // Get natural dimensions of generated image
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Fit neatly within A4 with balanced margins
      const marginMm = 8;
      const targetWidth = pdfWidth - marginMm * 2;
      const maxHeight = pdfPageHeight - marginMm * 2;

      let renderWidth = targetWidth;
      let renderHeight = (img.height * targetWidth) / img.width;

      // If document is taller than available height, scale proportionally to fit 1 page
      if (renderHeight > maxHeight) {
        renderWidth = (renderWidth * maxHeight) / renderHeight;
        renderHeight = maxHeight;
      }

      // Center horizontally and vertically on page
      const xPos = (pdfWidth - renderWidth) / 2;
      const yPos = Math.max(marginMm, (pdfPageHeight - renderHeight) / 2);

      pdf.addImage(dataUrl, "JPEG", xPos, yPos, renderWidth, renderHeight, undefined, "FAST");

      const cleanCustomer = customerName.replace(/[^a-zA-Z0-9]/g, "_") || "Customer";
      const cleanVehicle = vehicleModel.replace(/[^a-zA-Z0-9]/g, "_") || "Vehicle";
      const filename = `Vehicle_Purchase_Offer_${cleanCustomer}_${cleanVehicle}.pdf`;

      pdf.save(filename);
      toast.success(`PDF downloaded: ${filename}`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Could not generate PDF. You can also use the Print button to Save as PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  // 2. WhatsApp Share Action
  function handleWhatsAppShare() {
    const message = generateQuotationWhatsAppMessage({
      ...currentQuotationData,
      quotationDate,
    });
    const url = generateWhatsAppUrl(customerWhatsapp, message);
    window.open(url, "_blank");
    toast.success("Opening WhatsApp with formatted Vehicle Purchase Offer...");
  }

  // 3. Print Action (Isolated clean 1-page print)
  function handlePrint() {
    const element = document.getElementById("printable-quotation-offer");
    if (!element) {
      window.print();
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.zIndex = "-9999";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const styleTags = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
      .map((tag) => tag.outerHTML)
      .join("\n");

    const cleanTitle = `${businessName || "Quotation"} - ${customerName || "Customer"} Offer`;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${cleanTitle}</title>
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              width: 100% !important;
              height: auto !important;
            }
            #printable-quotation-offer {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
          </style>
        </head>
        <body>
          <div style="width: 100%; display: flex; justify-content: center; padding: 0;">
            ${element.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Iframe print error:", err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 400);
  }

  // 4. Save to Database Action
  function handleSaveToDatabase() {
    startTransition(async () => {
      const res = await saveQuotationAction(currentQuotationData);
      if (!res.ok) {
        toast.error(res.message || "Failed to save quotation");
        return;
      }
      toast.success(`Quotation ${res.data.quotationNumberFormatted} saved to database!`);
      onSaved?.();
      router.refresh();
    });
  }

  // 5. Copy Text Message Action
  function handleCopyText() {
    const message = generateQuotationWhatsAppMessage({
      ...currentQuotationData,
      quotationDate,
    });
    navigator.clipboard.writeText(message);
    setIsCopied(true);
    toast.success("Offer text copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2500);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl md:max-w-5xl max-h-[92vh] overflow-y-auto p-0 print:p-0 print:border-none print:shadow-none print:max-w-none">
        {/* Top Header Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b px-6 py-4 sm:px-8 bg-muted/40 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <FileText className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Vehicle Purchase Offer Generator
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Create market-based offers and generate professional PDF quotations for WhatsApp customers.
              </DialogDescription>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-1.5 rounded-xl border bg-background p-1 shadow-2xs shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMode("FORM")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                mode === "FORM"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Edit3 className="size-3.5" />
              1. Edit Details
            </button>
            <button
              type="button"
              onClick={() => handleGoToPreview()}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                mode === "PREVIEW"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Eye className="size-3.5" />
              2. Live Preview & PDF
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8">
          {mode === "FORM" ? (
            /* ================= FORM INPUT MODE ================= */
            <form onSubmit={handleGoToPreview} className="space-y-6">
              {/* Quick Fill Helper */}
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="size-4 text-emerald-600" />
                  <span>
                    Want to test quickly? Load the Ahmed Mohammed (Nissan Patrol) sample offer.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={prefillSampleDemo}
                  className="h-8 text-xs font-semibold border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                >
                  ⚡ Fill Sample Offer
                </Button>
              </div>

              {/* Section: Customer Details */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <User className="size-3.5" /> Customer Details
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="q-cust-name" className="text-xs font-semibold">
                      Customer Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="q-cust-name"
                      placeholder="e.g. Ahmed Mohammed"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="q-cust-whatsapp" className="text-xs font-semibold">
                      Customer WhatsApp
                    </Label>
                    <Input
                      id="q-cust-whatsapp"
                      placeholder="e.g. +971 50 123 4567"
                      value={customerWhatsapp}
                      onChange={(e) => setCustomerWhatsapp(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="q-cust-location" className="text-xs font-semibold">
                      Customer Location
                    </Label>
                    <Input
                      id="q-cust-location"
                      placeholder="e.g. Sharjah, UAE"
                      value={customerLocation}
                      onChange={(e) => setCustomerLocation(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Section: Vehicle Details */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Wrench className="size-3.5" /> Vehicle Details & WhatsApp Condition
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="q-veh-model" className="text-xs font-semibold">
                      Vehicle (Make & Model) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="q-veh-model"
                      placeholder="e.g. Nissan Patrol"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="q-veh-year" className="text-xs font-semibold">
                      Model Year
                    </Label>
                    <Input
                      id="q-veh-year"
                      type="number"
                      placeholder="e.g. 2018"
                      value={modelYear}
                      onChange={(e) => setModelYear(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="q-veh-cond" className="text-xs font-semibold">
                      Vehicle Condition <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="q-veh-cond"
                      placeholder="e.g. Accident / Damaged"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Customer-provided condition from WhatsApp */}
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="q-cust-notes" className="text-xs font-semibold">
                    Condition Details (What Customer Said on WhatsApp)
                  </Label>
                  <Textarea
                    id="q-cust-notes"
                    placeholder="e.g. Front-end damaged, engine is running, airbags are deployed, and the vehicle has been standing for approximately 2 months."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={3}
                  />
                  <p className="text-muted-foreground text-[11px]">
                    This will appear in the quotation under &ldquo;Customer-Provided information&rdquo;.
                  </p>
                </div>
              </div>

              {/* Section: Price Details */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  💰 Price & Offer
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="q-asking-price" className="text-xs font-semibold text-muted-foreground">
                      Customer Asking Price (AED)
                    </Label>
                    <Input
                      id="q-asking-price"
                      type="number"
                      placeholder="e.g. 18000"
                      value={askingPrice}
                      onChange={(e) => setAskingPrice(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-3">
                    <Label htmlFor="q-offer-price" className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      OUR BEST MARKET-BASED OFFER (AED) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="q-offer-price"
                      type="number"
                      placeholder="e.g. 12500"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      className="text-lg font-black text-emerald-600 dark:text-emerald-400"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Collapsible/Accordion: Business Header & Terms Customization */}
              <details className="rounded-xl border p-3 text-xs">
                <summary className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
                  ⚙️ Customize Business Header & Terms & Conditions
                </summary>
                <div className="mt-3 space-y-3 pt-2">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <Label className="text-[11px]">Scrap Business Name</Label>
                      <Input
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Call / WhatsApp</Label>
                      <Input
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Location</Label>
                      <Input
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px]">Terms & Conditions</Label>
                    <Textarea
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                      rows={2}
                      className="text-xs"
                    />
                  </div>
                </div>
              </details>

              <DialogFooter className="border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  <Eye className="size-4" />
                  View Live Quotation Preview &rarr;
                </Button>
              </DialogFooter>
            </form>
          ) : (
            /* ================= LIVE PREVIEW & EXPORT MODE ================= */
            <div className="space-y-6">
              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border bg-muted/40 p-3.5 print:hidden shadow-xs">
                <div className="flex items-center gap-2">
                  {/* 1. ✏️ Edit Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMode("FORM")}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <Edit3 className="size-4 text-primary" />
                    ✏️ Edit
                  </Button>

                  {/* 2. 📄 Generate PDF Button */}
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGeneratePdf}
                    disabled={isGeneratingPdf}
                    className="gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileDown className="size-4" />
                        📄 Generate PDF
                      </>
                    )}
                  </Button>
                </div>

                {/* Sharing Options: WhatsApp, Print, Save, Copy */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* WhatsApp Button */}
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleWhatsAppShare}
                    className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <MessageSquare className="size-4" />
                    WhatsApp
                  </Button>

                  {/* Print Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <Printer className="size-4 text-slate-700" />
                    Print
                  </Button>

                  {/* Copy WhatsApp Text */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyText}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    {isCopied ? (
                      <>
                        <Check className="size-3.5 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" /> Copy Text
                      </>
                    )}
                  </Button>

                  {/* Save to History / Database */}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleSaveToDatabase}
                    disabled={isPending}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <Save className="size-3.5" />
                    Save Offer
                  </Button>
                </div>
              </div>

              {/* Exact Paper-Style A4 Document Preview */}
              <div className="bg-slate-100 dark:bg-slate-900/60 p-4 sm:p-8 rounded-2xl border flex justify-center">
                <VehicleOfferDocument
                  ref={documentRef}
                  data={currentQuotationData}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-3 print:hidden">
                <button
                  type="button"
                  onClick={() => setMode("FORM")}
                  className="text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  &larr; Back to edit details
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-medium">
                    ✓ Offer is ready to generate as PDF or send via WhatsApp
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
