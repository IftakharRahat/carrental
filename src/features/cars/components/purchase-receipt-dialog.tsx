"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  Eye,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  Printer,
  RotateCcw,
  ShieldCheck,
  User,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatAed } from "@/lib/currency";
import type { CarDetailsFull } from "../domain/car-details-types";
import {
  generateReceiptWhatsAppMessage,
  generateWhatsAppUrl,
} from "../domain/receipt-types";

type PurchaseReceiptDialogProps = {
  car: CarDetailsFull;
  triggerButton?: boolean;
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isViewer?: boolean;
};

const DEFAULT_BUSINESS_NAME = "Car Scrap Business";
const DEFAULT_BUSINESS_PHONE = "+971 56 270 9960";
const DEFAULT_BUSINESS_ADDRESS = "Sharjah 10 Industrial Area, UAE";

export function PurchaseReceiptDialog({
  car,
  triggerButton = true,
  triggerText = "Receipt / Voucher",
  triggerVariant = "outline",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  isViewer = false,
}: PurchaseReceiptDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  // View & Edit mode: "PREVIEW" or "EDIT"
  const [mode, setMode] = useState<"PREVIEW" | "EDIT">("PREVIEW");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Editable Form Fields
  const [businessName, setBusinessName] = useState(DEFAULT_BUSINESS_NAME);
  const [businessPhone, setBusinessPhone] = useState(DEFAULT_BUSINESS_PHONE);
  const [businessAddress, setBusinessAddress] = useState(DEFAULT_BUSINESS_ADDRESS);
  const [voucherNumber, setVoucherNumber] = useState(`PV-${car.carNumber}`);
  const [receiptDate, setReceiptDate] = useState(
    car.purchaseDate ? car.purchaseDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
  );

  // Seller Details
  const [sellerName, setSellerName] = useState(car.seller.name);
  const [sellerPhone, setSellerPhone] = useState(car.seller.phone ?? "");
  const [sellerWhatsapp, setSellerWhatsapp] = useState(
    car.seller.whatsapp ?? car.seller.phone ?? "",
  );
  const [sellerEmiratesId, setSellerEmiratesId] = useState(car.seller.emiratesId ?? "");

  // Vehicle Details
  const [carBrand, setCarBrand] = useState(car.brand);
  const [carModel, setCarModel] = useState(car.model);
  const [carYear, setCarYear] = useState(car.year ? String(car.year) : "");
  const [vinChassis, setVinChassis] = useState(car.vinChassis ?? "");
  const [condition, setCondition] = useState(car.condition.replace(/_/g, " "));

  // Payment Details
  const [purchasePrice, setPurchasePrice] = useState<number | string>(car.purchasePrice);
  const [paymentMethod, setPaymentMethod] = useState(
    car.paymentMethod.replace(/_/g, " "),
  );
  const [itemDescription, setItemDescription] = useState(
    `Purchase of Vehicle (${car.carNumber}) - Full ownership and title transfer for scrap & recovery`,
  );

  // Legal Clauses & Signatures
  const [acknowledgementClause, setAcknowledgementClause] = useState(
    `The seller acknowledges receipt of full payment of ${formatAed(car.purchasePrice)} as stated above and hereby surrenders and transfers all vehicle rights, title, and possession to the buyer free from any legal claims or encumbrances.`,
  );
  const [sellerConfirmationClause, setSellerConfirmationClause] = useState(
    "I confirm that, to the best of my knowledge, there are no outstanding traffic fines, police cases, legal claims, or liabilities arising before the sale date. Any such pre-existing issue discovered later shall be the Seller’s responsibility.",
  );
  const [sellerSignerName, setSellerSignerName] = useState(car.seller.name);
  const [buyerSignerName, setBuyerSignerName] = useState(DEFAULT_BUSINESS_NAME);

  // Re-sync with car when opened or car changes
  useEffect(() => {
    if (open) {
      setVoucherNumber(`PV-${car.carNumber}`);
      setReceiptDate(
        car.purchaseDate ? car.purchaseDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      );
      setSellerName(car.seller.name);
      setSellerPhone(car.seller.phone ?? "");
      setSellerWhatsapp(car.seller.whatsapp ?? car.seller.phone ?? "");
      setSellerEmiratesId(car.seller.emiratesId ?? "");
      setCarBrand(car.brand);
      setCarModel(car.model);
      setCarYear(car.year ? String(car.year) : "");
      setVinChassis(car.vinChassis ?? "");
      setCondition(car.condition.replace(/_/g, " "));
      setPurchasePrice(car.purchasePrice);
      setPaymentMethod(car.paymentMethod.replace(/_/g, " "));
      setItemDescription(
        `Purchase of Vehicle (${car.carNumber}) - Full ownership and title transfer for scrap & recovery`,
      );
      setAcknowledgementClause(
        `The seller acknowledges receipt of full payment of ${formatAed(car.purchasePrice)} as stated above and hereby surrenders and transfers all vehicle rights, title, and possession to the buyer free from any legal claims or encumbrances.`,
      );
      setSellerSignerName(car.seller.name);
      setBuyerSignerName(businessName || DEFAULT_BUSINESS_NAME);
    }
  }, [open, car]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }
  };

  const handleResetToOriginal = () => {
    setBusinessName(DEFAULT_BUSINESS_NAME);
    setBusinessPhone(DEFAULT_BUSINESS_PHONE);
    setBusinessAddress(DEFAULT_BUSINESS_ADDRESS);
    setVoucherNumber(`PV-${car.carNumber}`);
    setReceiptDate(
      car.purchaseDate ? car.purchaseDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    );
    setSellerName(car.seller.name);
    setSellerPhone(car.seller.phone ?? "");
    setSellerWhatsapp(car.seller.whatsapp ?? car.seller.phone ?? "");
    setSellerEmiratesId(car.seller.emiratesId ?? "");
    setCarBrand(car.brand);
    setCarModel(car.model);
    setCarYear(car.year ? String(car.year) : "");
    setVinChassis(car.vinChassis ?? "");
    setCondition(car.condition.replace(/_/g, " "));
    setPurchasePrice(car.purchasePrice);
    setPaymentMethod(car.paymentMethod.replace(/_/g, " "));
    setItemDescription(
      `Purchase of Vehicle (${car.carNumber}) - Full ownership and title transfer for scrap & recovery`,
    );
    setAcknowledgementClause(
      `The seller acknowledges receipt of full payment of ${formatAed(car.purchasePrice)} as stated above and hereby surrenders and transfers all vehicle rights, title, and possession to the buyer free from any legal claims or encumbrances.`,
    );
    setSellerConfirmationClause(
      "I confirm that, to the best of my knowledge, there are no outstanding traffic fines, police cases, legal claims, or liabilities arising before the sale date. Any such pre-existing issue discovered later shall be the Seller’s responsibility.",
    );
    setSellerSignerName(car.seller.name);
    setBuyerSignerName(DEFAULT_BUSINESS_NAME);
    toast.info("Receipt fields reset to original car record");
  };

  // 1. Download PDF Action
  async function handleDownloadPdf() {
    const element = document.getElementById("printable-purchase-receipt");
    if (!element) {
      toast.error("Receipt element not found");
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const { toJpeg } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      // Fixed 760px width ensures receipt layout is never clipped regardless of screen size
      const TARGET_WIDTH = 760;

      const imgData = await toJpeg(element, {
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
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const printWidth = pdfWidth - margin * 2;

      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgHeight = (img.height * printWidth) / img.width;
      const finalHeight = Math.min(imgHeight, pdfHeight - margin * 2);

      pdf.addImage(imgData, "JPEG", margin, margin, printWidth, finalHeight, undefined, "FAST");

      const filename = `Payment_Voucher_${car.carNumber}_${sellerName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      pdf.save(filename);
      toast.success(`PDF downloaded: ${filename}`);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Could not generate PDF. Please use the Print Receipt button to save as PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  // 2. Share via WhatsApp Action
  function handleWhatsAppShare() {
    const numPrice = typeof purchasePrice === "number" ? purchasePrice : parseFloat(purchasePrice) || 0;
    const message = generateReceiptWhatsAppMessage({
      businessName,
      businessPhone,
      businessAddress,
      voucherNumber,
      receiptDate,
      sellerName,
      sellerPhone,
      sellerEmiratesId,
      carNumber: car.carNumber,
      carTitle: `${car.carNumber} · ${carBrand} ${carModel}${carYear ? ` (${carYear})` : ""}`,
      vinChassis,
      condition,
      purchasePrice: numPrice,
      paymentMethod,
    });

    const targetPhone = sellerWhatsapp || sellerPhone;
    const url = generateWhatsAppUrl(targetPhone, message);
    window.open(url, "_blank");
    toast.success("Opening WhatsApp with formatted Payment Voucher...");
  }

  // 3. Copy Text Message Action
  function handleCopyText() {
    const numPrice = typeof purchasePrice === "number" ? purchasePrice : parseFloat(purchasePrice) || 0;
    const message = generateReceiptWhatsAppMessage({
      businessName,
      businessPhone,
      businessAddress,
      voucherNumber,
      receiptDate,
      sellerName,
      sellerPhone,
      sellerEmiratesId,
      carNumber: car.carNumber,
      carTitle: `${car.carNumber} · ${carBrand} ${carModel}${carYear ? ` (${carYear})` : ""}`,
      vinChassis,
      condition,
      purchasePrice: numPrice,
      paymentMethod,
    });

    navigator.clipboard.writeText(message);
    setIsCopied(true);
    toast.success("Receipt voucher text copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2500);
  }

  // 4. Print Action (Clean 1-page A4 print)
  function handlePrint() {
    const element = document.getElementById("printable-purchase-receipt");
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

    const cleanTitle = `Payment_Voucher_${car.carNumber}_${sellerName.replace(/[^a-zA-Z0-9]/g, "_")}`;

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
            #printable-purchase-receipt {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
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
        console.error("Print fallback:", err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 350);
  }

  const formattedDisplayDate = (() => {
    try {
      return new Date(receiptDate).toLocaleDateString("en-AE", {
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return receiptDate;
    }
  })();

  const numPriceDisplay =
    typeof purchasePrice === "number"
      ? purchasePrice
      : parseFloat(purchasePrice) || 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {triggerButton && (
        <DialogTrigger
          render={
            <Button
              size="sm"
              variant={triggerVariant}
              className="gap-1.5 shadow-xs font-semibold"
              data-testid="open-purchase-receipt-btn"
            >
              <FileText className="size-4 text-primary" />
              {triggerText}
            </Button>
          }
        />
      )}

      <DialogContent className="w-[95vw] sm:max-w-4xl md:max-w-5xl max-h-[92vh] overflow-y-auto p-0 print:p-0 print:border-none print:shadow-none print:max-w-none">
        {/* Top Header Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b px-6 py-4 sm:px-8 bg-muted/40 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <FileText className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Customer / Seller Purchase Receipt
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Review, customize details, download official PDF, share via WhatsApp, or print voucher.
              </DialogDescription>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-1.5 rounded-xl border bg-background p-1 shadow-2xs shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMode("PREVIEW")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                mode === "PREVIEW"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Eye className="size-3.5" />
              1. Preview & Actions
            </button>
            <button
              type="button"
              onClick={() => setMode("EDIT")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                mode === "EDIT"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Edit3 className="size-3.5" />
              2. Customize / Edit Details
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8">
          {mode === "EDIT" ? (
            /* ================= CUSTOMIZE / EDIT MODE ================= */
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Customize Receipt & Voucher Details
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Make any adjustments before generating the PDF or sending to the seller.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetToOriginal}
                  className="gap-1.5 text-xs"
                >
                  <RotateCcw className="size-3.5" /> Reset to Original
                </Button>
              </div>

              {/* Section 1: Business Information */}
              <div className="space-y-3 rounded-xl border p-4 bg-muted/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Business Header
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Business Name</Label>
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Car Scrap Business"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Phone / WhatsApp</Label>
                    <Input
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      placeholder="+971 56 270 9960"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Yard / Business Address</Label>
                    <Input
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="Sharjah 10 Industrial Area, UAE"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Voucher Metadata & Seller Info */}
              <div className="space-y-3 rounded-xl border p-4 bg-muted/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Receipt Ref & Seller (Supplier / Customer)
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Voucher Ref Number</Label>
                    <Input
                      value={voucherNumber}
                      onChange={(e) => setVoucherNumber(e.target.value)}
                      placeholder="PV-CAR-0011"
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Receipt Date</Label>
                    <Input
                      type="date"
                      value={receiptDate}
                      onChange={(e) => setReceiptDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Seller Name *</Label>
                    <Input
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      placeholder="Seller Name"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Emirates ID</Label>
                    <Input
                      value={sellerEmiratesId}
                      onChange={(e) => setSellerEmiratesId(e.target.value)}
                      placeholder="784-1990-1234567-1"
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Seller Phone</Label>
                    <Input
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      placeholder="+971 50 123 4567"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Seller WhatsApp</Label>
                      {sellerPhone && (
                        <button
                          type="button"
                          onClick={() => {
                            setSellerWhatsapp(sellerPhone);
                            toast.info("Copied Phone to WhatsApp");
                          }}
                          className="text-primary hover:text-primary/80 flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          <Copy className="size-3" /> Same as phone
                        </button>
                      )}
                    </div>
                    <Input
                      value={sellerWhatsapp}
                      onChange={(e) => setSellerWhatsapp(e.target.value)}
                      placeholder="+971 50 123 4567"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Vehicle Acquisition Details */}
              <div className="space-y-3 rounded-xl border p-4 bg-muted/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Vehicle Acquisition Details
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Brand / Make</Label>
                    <Input
                      value={carBrand}
                      onChange={(e) => setCarBrand(e.target.value)}
                      placeholder="Toyota"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Model</Label>
                    <Input
                      value={carModel}
                      onChange={(e) => setCarModel(e.target.value)}
                      placeholder="Camry"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Year</Label>
                    <Input
                      value={carYear}
                      onChange={(e) => setCarYear(e.target.value)}
                      placeholder="2018"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">VIN / Chassis Number</Label>
                    <Input
                      value={vinChassis}
                      onChange={(e) => setVinChassis(e.target.value)}
                      placeholder="e.g. 4T1BF1FK5EU123456"
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Condition</Label>
                    <Input
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      placeholder="Accident / Scrap / Running"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Payment & Accounting */}
              <div className="space-y-3 rounded-xl border p-4 bg-muted/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Payment & Item Description
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Total Paid Amount (AED) *</Label>
                    <Input
                      type="number"
                      step="any"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      placeholder="1200"
                      className="text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Payment Method</Label>
                    <Input
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      placeholder="Cash / Bank Transfer / Cheque"
                      className="text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-medium">Item Description</Label>
                  <Input
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Full ownership and title transfer for scrap & recovery"
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Section 5: Legal Confirmation & Signer Names */}
              <div className="space-y-3 rounded-xl border p-4 bg-muted/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Legal Confirmation Statement & Signatures
                </h4>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Acknowledgement Clause</Label>
                  <Textarea
                    rows={2}
                    value={acknowledgementClause}
                    onChange={(e) => setAcknowledgementClause(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-medium">
                    Seller Confirmation (Traffic fines, police cases, liabilities)
                  </Label>
                  <Textarea
                    rows={3}
                    value={sellerConfirmationClause}
                    onChange={(e) => setSellerConfirmationClause(e.target.value)}
                    className="text-xs italic"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Seller Sign Label / Name</Label>
                    <Input
                      value={sellerSignerName}
                      onChange={(e) => setSellerSignerName(e.target.value)}
                      placeholder="Seller Name"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Buyer / Yard Sign Label</Label>
                    <Input
                      value={buyerSignerName}
                      onChange={(e) => setBuyerSignerName(e.target.value)}
                      placeholder="Car Scrap Business"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Buttons in Edit Mode */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode("PREVIEW")}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => setMode("PREVIEW")}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Eye className="size-4" />
                  View Updated Receipt & Voucher
                </Button>
              </div>
            </div>
          ) : (
            /* ================= LIVE PREVIEW MODE ================= */
            <div className="space-y-6">
              {/* Quick Action Bar above Receipt */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/30 p-3 print:hidden">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <span>
                    Official verified voucher ready for PDF export, WhatsApp sharing, or printing.
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMode("EDIT")}
                    className="gap-1.5 text-xs"
                  >
                    <Edit3 className="size-3.5" />
                    Customize / Edit
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyText}
                    className="gap-1.5 text-xs"
                  >
                    {isCopied ? (
                      <>
                        <Check className="size-3.5 text-emerald-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        Copy Text
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleWhatsAppShare}
                    className="gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    <MessageSquare className="size-3.5 text-emerald-600" />
                    Share WhatsApp
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="size-3.5" />
                        Download PDF
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handlePrint}
                    className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
                  >
                    <Printer className="size-3.5" />
                    Print Receipt
                  </Button>
                </div>
              </div>

              {/* Printable Receipt Container */}
              <div
                id="printable-purchase-receipt"
                className="bg-white text-slate-900 mx-auto w-full max-w-[760px] rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs print:border-none print:p-8 print:text-black font-sans box-border overflow-hidden"
                style={{ colorScheme: "light" }}
              >
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        CS
                      </div>
                      <div>
                        <h2 className="text-lg font-bold tracking-tight leading-tight">
                          {businessName}
                        </h2>
                        <p className="text-xs text-muted-foreground print:text-gray-600">
                          {businessAddress} · {businessPhone}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider print:border print:border-emerald-600">
                      Payment Voucher
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-mono font-semibold">
                      REF: {voucherNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">{formattedDisplayDate}</p>
                  </div>
                </div>

                {/* Seller / Supplier & Acquisition Summary */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-muted/30 p-3.5 rounded-lg border">
                  <div>
                    <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block mb-1">
                      Seller (Customer / Supplier):
                    </span>
                    <p className="font-bold text-sm text-foreground">{sellerName}</p>
                    {sellerPhone && (
                      <p className="text-muted-foreground print:text-gray-700">
                        Phone: {sellerPhone}
                      </p>
                    )}
                    <p className="text-muted-foreground print:text-gray-700">
                      Emirates ID:{" "}
                      {sellerEmiratesId ? (
                        <strong className="text-foreground font-mono print:text-black font-semibold">
                          {sellerEmiratesId}
                        </strong>
                      ) : (
                        <span className="font-mono text-muted-foreground/60">
                          ____________________
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block mb-1">
                      Acquisition Vehicle:
                    </span>
                    <p className="font-bold text-sm text-foreground">
                      {car.carNumber} · {carBrand} {carModel}
                    </p>
                    {carYear && (
                      <p className="text-muted-foreground print:text-gray-700">
                        Year: {carYear}
                      </p>
                    )}
                    {vinChassis && (
                      <p className="text-muted-foreground font-mono text-[11px] print:text-gray-700">
                        VIN: {vinChassis}
                      </p>
                    )}
                    <p className="text-muted-foreground print:text-gray-700">
                      Condition: {condition}
                    </p>
                  </div>
                </div>

                {/* Payment Breakdown Table */}
                <div className="space-y-2">
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/60 text-muted-foreground border-b uppercase font-semibold text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Item Description</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3 text-right">Amount (AED)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="py-3 px-3">
                            <p className="font-semibold text-foreground">
                              {itemDescription}
                            </p>
                          </td>
                          <td className="py-3 px-3 capitalize text-muted-foreground">
                            {paymentMethod}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-sm text-foreground">
                            {formatAed(numPriceDisplay)}
                          </td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-muted/20 border-t font-semibold">
                        <tr>
                          <td colSpan={2} className="py-2.5 px-3 text-right text-xs">
                            Total Paid to Seller:
                          </td>
                          <td className="py-2.5 px-3 text-right text-base font-bold text-primary print:text-black">
                            {formatAed(numPriceDisplay)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium pt-1">
                    <CheckCircle2 className="size-4" />
                    <span>Full payment disbursed and verified in finance ledger</span>
                  </div>
                </div>

                {/* Legal / Transfer Acknowledgement */}
                <div className="border-t pt-3 text-[11px] text-muted-foreground space-y-2.5 print:text-gray-700">
                  <p className="leading-relaxed">
                    <strong>Acknowledgement:</strong> {acknowledgementClause}
                  </p>

                  <div className="rounded-lg border border-slate-200 bg-muted/40 p-3 text-foreground dark:text-slate-200 print:bg-gray-50 print:border-gray-300 print:text-black">
                    <p className="font-semibold text-[11px] text-foreground mb-1">
                      The Seller acknowledges and confirms that:
                    </p>
                    <p className="italic text-[11px] leading-relaxed text-muted-foreground print:text-gray-800">
                      &ldquo;{sellerConfirmationClause}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t text-xs">
                  <div className="space-y-10">
                    <p className="font-bold text-foreground text-[11px] uppercase tracking-wider">
                      Seller sign:
                    </p>
                    <div className="border-t border-dashed pt-1.5 text-muted-foreground">
                      <p className="font-medium text-foreground">{sellerSignerName}</p>
                      <p className="text-[10px]">Date: ________________________</p>
                    </div>
                  </div>

                  <div className="space-y-10 text-right">
                    <p className="font-bold text-foreground text-[11px] uppercase tracking-wider">
                      Buyer / Yard Sign:
                    </p>
                    <div className="border-t border-dashed pt-1.5 text-muted-foreground">
                      <p className="font-medium text-foreground">{buyerSignerName}</p>
                      <p className="text-[10px]">Date: ________________________</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t print:hidden">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                >
                  Close
                </Button>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMode("EDIT")}
                    className="gap-1.5 text-xs"
                  >
                    <Edit3 className="size-3.5" />
                    Customize / Edit Details
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleWhatsAppShare}
                    className="gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    <MessageSquare className="size-3.5 text-emerald-600" />
                    Share WhatsApp
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="size-3.5" />
                        Download PDF
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handlePrint}
                    className="gap-1.5 text-xs shadow-xs"
                    data-testid="print-receipt-action-btn"
                  >
                    <Printer className="size-4" />
                    Print Receipt / Voucher
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
