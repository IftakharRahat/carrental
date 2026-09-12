"use client";

import { useState } from "react";
import { CheckCircle2, FileText, Printer, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatAed } from "@/lib/currency";
import type { CarDetailsFull } from "../domain/car-details-types";

type PurchaseReceiptDialogProps = {
  car: CarDetailsFull;
  triggerButton?: boolean;
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isViewer?: boolean;
};

export function PurchaseReceiptDialog({
  car,
  triggerButton = true,
  triggerText = "Print / View Receipt",
  triggerVariant = "outline",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  isViewer = false,
}: PurchaseReceiptDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }
  };

  const handlePrint = () => {
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

    const cleanTitle = `Payment_Voucher_${car.carNumber}_${car.seller.name.replace(/[^a-zA-Z0-9]/g, "_")}`;

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
              margin: 10mm 12mm;
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
  };

  const formattedDate = new Date(car.purchaseDate).toLocaleDateString("en-AE", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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

      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto print:max-w-none print:m-0 print:p-0 print:border-none print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="size-5 text-primary" />
            Customer / Seller Purchase Receipt
          </DialogTitle>
        </DialogHeader>

        {/* Printable Receipt Container */}
        <div
          id="printable-purchase-receipt"
          className="bg-background text-foreground rounded-xl border p-6 space-y-6 print:border-none print:p-8 print:text-black"
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
                    Car Scrap Business
                  </h2>
                  <p className="text-xs text-muted-foreground print:text-gray-600">
                    Vehicle Recovery & Dismantling Yard · United Arab Emirates
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider print:border print:border-emerald-600">
                Payment Voucher
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                REF: PV-{car.carNumber}
              </p>
              <p className="text-xs text-muted-foreground">{formattedDate}</p>
            </div>
          </div>

          {/* Seller / Supplier & Acquisition Summary */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-muted/30 p-3.5 rounded-lg border">
            <div>
              <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block mb-1">
                Seller (Customer / Supplier):
              </span>
              <p className="font-bold text-sm text-foreground">{car.seller.name}</p>
              {car.seller.phone && (
                <p className="text-muted-foreground print:text-gray-700">
                  Phone: {car.seller.phone}
                </p>
              )}
              {car.source && !isViewer && (
                <p className="text-muted-foreground print:text-gray-700">
                  Channel: {car.source.name} ({car.source.type})
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block mb-1">
                Acquisition Vehicle:
              </span>
              <p className="font-bold text-sm text-foreground">
                {car.carNumber} · {car.brand} {car.model}
              </p>
              {car.year && (
                <p className="text-muted-foreground print:text-gray-700">
                  Year: {car.year}
                </p>
              )}
              {car.vinChassis && (
                <p className="text-muted-foreground font-mono text-[11px] print:text-gray-700">
                  VIN: {car.vinChassis}
                </p>
              )}
              <p className="text-muted-foreground print:text-gray-700">
                Condition: {car.condition.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          {/* Payment Breakdown */}
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
                        Purchase of Vehicle ({car.carNumber})
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        Full ownership and title transfer for scrap & recovery
                      </p>
                    </td>
                    <td className="py-3 px-3 capitalize text-muted-foreground">
                      {car.paymentMethod.toLowerCase().replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-sm text-foreground">
                      {formatAed(car.purchasePrice)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-muted/20 border-t font-semibold">
                  <tr>
                    <td colSpan={2} className="py-2.5 px-3 text-right text-xs">
                      Total Paid to Seller:
                    </td>
                    <td className="py-2.5 px-3 text-right text-base font-bold text-primary print:text-black">
                      {formatAed(car.purchasePrice)}
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
              <strong>Acknowledgement:</strong> The seller acknowledges receipt of
              full payment of {formatAed(car.purchasePrice)} as stated above and
              hereby surrenders and transfers all vehicle rights, title, and
              possession to the buyer free from any legal claims or encumbrances.
            </p>

            <div className="rounded-lg border border-slate-200 bg-muted/40 p-3 text-foreground dark:text-slate-200 print:bg-gray-50 print:border-gray-300 print:text-black">
              <p className="font-semibold text-[11px] text-foreground mb-1">
                The Seller acknowledges and confirms that:
              </p>
              <p className="italic text-[11px] leading-relaxed text-muted-foreground print:text-gray-800">
                &ldquo;I confirm that, to the best of my knowledge, there are no outstanding traffic fines, police cases, legal claims, or liabilities arising before the sale date. Any such pre-existing issue discovered later shall be the Seller’s responsibility.&rdquo;
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
                <p className="font-medium text-foreground">{car.seller.name}</p>
                <p className="text-[10px]">Date: ________________________</p>
              </div>
            </div>

            <div className="space-y-10 text-right">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider">
                Buyer / Yard Sign:
              </p>
              <div className="border-t border-dashed pt-1.5 text-muted-foreground">
                <p className="font-medium text-foreground">Car Scrap Business</p>
                <p className="text-[10px]">Date: ________________________</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="print:hidden gap-2 sm:gap-0 mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 shadow-xs"
            data-testid="print-receipt-action-btn"
          >
            <Printer className="size-4" />
            Print Receipt / Voucher
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
