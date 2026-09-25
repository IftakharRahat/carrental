"use client";

import React from "react";
import {
  AlertTriangle,
  CarFront,
  CheckCircle2,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { formatQuotationDate, type QuotationInput } from "../domain/quotation-types";
import { numberToAedWords } from "@/lib/currency";

type Props = {
  data: QuotationInput & {
    quotationNumberFormatted?: string;
  };
  className?: string;
};

export const VehicleOfferDocument = React.forwardRef<HTMLDivElement, Props>(
  function VehicleOfferDocument({ data, className = "" }, ref) {
    const formattedDate = formatQuotationDate(data.quotationDate);
    const firstName = data.customerName.trim().split(" ")[0] || data.customerName;

    return (
      <div
        ref={ref}
        id="printable-quotation-offer"
        className={`bg-white text-slate-900 mx-auto w-full max-w-[760px] min-h-[1060px] flex flex-col justify-between rounded-xl border border-slate-200 p-7 shadow-lg print:border-none print:shadow-none print:p-6 print:max-w-none print:w-full print:m-0 font-sans box-border ${className}`}
        style={{ colorScheme: "light" }}
      >
        {/* Main Body Content */}
        <div className="space-y-3.5 flex-1">
          {/* Document Header */}
          <div className="flex flex-row items-start justify-between border-b-2 border-slate-300 pb-3 gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-slate-900 text-white font-black text-lg shadow-xs shrink-0">
                  <CarFront className="size-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-tight truncate">
                    {data.businessName || "USED GARAGE UAE"}
                  </h1>
                  <p className="text-[11px] font-semibold text-emerald-700 tracking-wide uppercase">
                    Automotive Scrap, Salvage & Vehicle Recovery
                  </p>
                </div>
              </div>

              <div className="mt-2 space-y-0.5 text-xs text-slate-600">
                <p className="flex items-center gap-1.5 font-medium">
                  <Phone className="size-3.5 text-emerald-600 shrink-0" />
                  <span>Call / WhatsApp:</span>
                  <strong className="text-slate-800">{data.businessPhone}</strong>
                </p>
                <p className="flex items-center gap-1.5 font-medium">
                  <MapPin className="size-3.5 text-emerald-600 shrink-0" />
                  <span>{data.businessAddress}</span>
                </p>
              </div>
            </div>

            <div className="text-right flex flex-col justify-between shrink-0 min-w-[160px]">
              <div className="inline-flex self-end items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase shadow-xs">
                <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
                OFFICIAL OFFER
              </div>
              <div className="mt-2 space-y-0.5 text-xs">
                <p className="text-slate-500 font-medium text-[11px]">Quotation Date:</p>
                <p className="font-bold text-slate-900 text-sm">{formattedDate}</p>
                {data.quotationNumberFormatted && (
                  <p className="font-mono text-[11px] font-semibold text-emerald-700">
                    Ref: {data.quotationNumberFormatted}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Big Document Title Banner */}
          <div className="rounded-lg bg-slate-900 py-2 px-4 text-center shadow-xs">
            <h2 className="text-sm font-black tracking-wider text-white uppercase">
              FORMAL VEHICLE PURCHASE OFFER & VALUATION CERTIFICATE
            </h2>
          </div>

          {/* Customer & Vehicle Details Grid */}
          <div className="grid grid-cols-2 gap-3.5 text-xs">
            {/* Customer Details */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-1.5 min-w-0">
              <div className="border-b border-slate-200 pb-1 flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  Customer / Vehicle Owner
                </h3>
                <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Verified Contact
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Name:</span>
                  <span className="font-bold text-slate-900 text-right truncate">{data.customerName}</span>
                </div>
                {data.customerWhatsapp && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 shrink-0">WhatsApp / Phone:</span>
                    <span className="font-mono font-bold text-slate-900 text-right">
                      {data.customerWhatsapp}
                    </span>
                  </div>
                )}
                {data.customerLocation && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 shrink-0">Vehicle Location:</span>
                    <span className="font-semibold text-slate-800 text-right">{data.customerLocation}</span>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Valuation Purpose:</span>
                  <span className="font-medium text-slate-700 text-right">Scrap Salvage / Direct Buy</span>
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-1.5 min-w-0">
              <div className="border-b border-slate-200 pb-1 flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  Target Vehicle Specification
                </h3>
                <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  Target Unit
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Vehicle:</span>
                  <span className="font-bold text-slate-900 text-right truncate">{data.vehicleModel}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Model Year:</span>
                  <span className="font-bold text-slate-900 text-right">{data.modelYear || "N/A"}</span>
                </div>
                <div className="flex justify-between gap-2 items-center">
                  <span className="text-slate-500 shrink-0">Condition:</span>
                  <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-right shrink-0">
                    {data.condition}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Inspection Type:</span>
                  <span className="font-medium text-slate-700 text-right">On-Site & Rapid Clearance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer-Provided Information (WhatsApp condition) */}
          {data.customerNotes && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="size-3.5 text-amber-600" />
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                  Customer-Provided Vehicle Information
                </h3>
              </div>
              <p className="text-[10px] font-semibold text-amber-800 mb-0.5">
                According to {firstName}:
              </p>
              <p className="text-xs font-medium text-slate-800 italic leading-relaxed pl-2.5 border-l-2 border-amber-400">
                &ldquo;{data.customerNotes}&rdquo;
              </p>
            </div>
          )}

          {/* Price Details & Offer Box */}
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/90 p-3.5 text-center">
            {data.askingPrice != null && data.askingPrice > 0 && (
              <div className="mb-1.5 inline-flex items-center gap-2 rounded-lg bg-white px-2.5 py-0.5 border border-slate-200 text-xs shadow-2xs">
                <span className="text-slate-500 font-medium">Customer Asking Price:</span>
                <span className="font-bold text-slate-700 line-through">
                  AED {data.askingPrice.toLocaleString("en-US")}
                </span>
              </div>
            )}

            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-800">
                <Sparkles className="size-3.5 text-emerald-600" />
                OUR GUARANTEED PURCHASE OFFER
              </span>
              <div className="mt-0.5 text-2xl font-black tracking-tight text-emerald-700">
                AED {data.offerPrice.toLocaleString("en-US")}
              </div>
              <p className="text-xs font-bold text-slate-800 italic mt-0.5">
                {numberToAedWords(data.offerPrice)}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-600">
                Immediate cash on handover or instant wire transfer upon inspection
              </p>
            </div>
          </div>

          {/* Offer Package & Yard Acquisition Inclusions */}
          <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <span className="font-bold text-emerald-700 block text-[10px] uppercase">
                ✓ Free Towing
              </span>
              <span className="text-[10px] text-slate-500">
                Anywhere across UAE
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <span className="font-bold text-emerald-700 block text-[10px] uppercase">
                ✓ Instant Cash
              </span>
              <span className="text-[10px] text-slate-500">
                Paid on collection
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <span className="font-bold text-emerald-700 block text-[10px] uppercase">
                ✓ RTA Clearance
              </span>
              <span className="text-[10px] text-slate-500">
                Scrap certificate assist
              </span>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1 text-left">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
              Terms & Valuation Conditions
            </h4>
            <p className="text-[10px] leading-relaxed text-slate-600 font-normal">
              {data.terms ||
                "This offer is based on the declared vehicle condition and photos. If mechanical state, catalytic converter status, major body damage, or missing components differ during physical yard intake, the price may be adjusted with the customer's prior agreement. Valid for 7 days."}
            </p>
          </div>
        </div>

        {/* Bottom Section: Official Endorsement & Footer Closing (Anchored at page bottom) */}
        <div className="space-y-3.5 pt-3">
          {/* Signatures & Official Stamp Seal Block (3 Columns) */}
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-200 text-xs">
            <div className="space-y-10">
              <p className="font-bold text-slate-900 text-[10px] uppercase tracking-wider">
                Yard Evaluator:
              </p>
              <div className="border-t border-dashed border-slate-400 pt-1.5 text-slate-600">
                <p className="font-bold text-slate-900 text-xs">{data.businessName || "USED GARAGE UAE"}</p>
                <p className="text-[10px] text-slate-500">Signature: ______________________</p>
                <p className="text-[10px] text-slate-500">Date: __________________________</p>
              </div>
            </div>

            {/* Official Stamp Box */}
            <div className="flex flex-col items-center justify-center p-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 text-center min-h-[85px]">
              <div className="size-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 mb-1">
                <ShieldCheck className="size-3.5 text-emerald-600" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                OFFICIAL STAMP / SEAL
              </p>
              <p className="text-[8px] text-slate-400">
                Car Scrap & Recovery UAE
              </p>
              <p className="text-[8px] text-emerald-700 font-bold mt-0.5">
                Authorized Offer
              </p>
            </div>

            <div className="space-y-10 text-right">
              <p className="font-bold text-slate-900 text-[10px] uppercase tracking-wider">
                Seller Acceptance:
              </p>
              <div className="border-t border-dashed border-slate-400 pt-1.5 text-slate-600">
                <p className="font-bold text-slate-900 text-xs">{data.customerName}</p>
                <p className="text-[10px] text-slate-500">Signature: ______________________</p>
                <p className="text-[10px] text-slate-500">Date: __________________________</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-2 text-center space-y-0.5">
            <p className="text-xs font-bold text-slate-800">
              {data.thankYouNote?.trim() || `Thank you for contacting ${data.businessName || "USED GARAGE UAE"}.`}
            </p>
            <p className="text-[11px] font-semibold text-emerald-700">
              Hotline & WhatsApp: {data.businessPhone}
            </p>
            <p className="text-[9px] text-slate-400">
              Generated via Car Scrap Business Management System &bull; Confidential &bull; Valid for 7 days
            </p>
          </div>
        </div>
      </div>
    );
  },
);
