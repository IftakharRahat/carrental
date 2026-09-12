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
        className={`bg-white text-slate-900 mx-auto w-full max-w-[760px] rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-lg print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full print:m-0 font-sans box-border overflow-hidden ${className}`}
        style={{ colorScheme: "light" }}
      >
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b-2 border-slate-200 pb-4 gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-lg shadow-sm shrink-0">
                <CarFront className="size-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 leading-tight truncate">
                  {data.businessName || "USED GARAGE UAE"}
                </h1>
                <p className="text-[11px] font-semibold text-emerald-700 tracking-wide uppercase">
                  Automotive Scrap & Vehicle Recovery
                </p>
              </div>
            </div>

            <div className="mt-2.5 space-y-0.5 text-xs text-slate-600">
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

          <div className="text-left sm:text-right flex flex-col justify-between shrink-0 min-w-[160px]">
            <div className="inline-flex sm:self-end items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase shadow-xs">
              <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
              OFFICIAL OFFER
            </div>
            <div className="mt-2.5 space-y-0.5 text-xs">
              <p className="text-slate-500 font-medium text-[11px]">Quotation Date:</p>
              <p className="font-bold text-slate-900 text-sm">{formattedDate}</p>
              {data.quotationNumberFormatted && (
                <p className="font-mono text-[11px] font-semibold text-slate-500">
                  Ref: {data.quotationNumberFormatted}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Big Document Title Banner */}
        <div className="my-3.5 rounded-xl bg-slate-900 py-2.5 px-4 text-center shadow-xs">
          <h2 className="text-sm sm:text-base font-black tracking-wider text-white uppercase">
            VEHICLE PURCHASE OFFER
          </h2>
        </div>

        {/* Customer & Vehicle Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Customer Details */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 min-w-0">
            <div className="border-b border-slate-200 pb-1 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Customer Details
              </h3>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Verified Seller
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500 shrink-0">Name:</span>
                <span className="font-bold text-slate-900 text-right truncate">{data.customerName}</span>
              </div>
              {data.customerWhatsapp && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">WhatsApp:</span>
                  <span className="font-mono font-bold text-slate-900 text-right">
                    {data.customerWhatsapp}
                  </span>
                </div>
              )}
              {data.customerLocation && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Location:</span>
                  <span className="font-semibold text-slate-800 text-right">{data.customerLocation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 min-w-0">
            <div className="border-b border-slate-200 pb-1 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Vehicle Details
              </h3>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                Target Unit
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
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
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-right shrink-0">
                  {data.condition}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer-Provided Information (WhatsApp condition) */}
        {data.customerNotes && (
          <div className="mt-3.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="size-3.5 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Customer-Provided Information
              </h3>
            </div>
            <p className="text-[11px] font-semibold text-amber-800 mb-0.5">
              According to {firstName}:
            </p>
            <p className="text-xs font-medium text-slate-800 italic leading-relaxed pl-3 border-l-2 border-amber-400">
              &ldquo;{data.customerNotes}&rdquo;
            </p>
          </div>
        )}

        {/* Price Details & Offer Box */}
        <div className="mt-3.5 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3.5 text-center">
          {data.askingPrice != null && data.askingPrice > 0 && (
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1 border border-slate-200 text-xs shadow-xs">
              <span className="text-slate-500 font-medium">Customer Asking Price:</span>
              <span className="font-bold text-slate-700 line-through">
                AED {data.askingPrice.toLocaleString("en-US")}
              </span>
            </div>
          )}

          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-800">
              <Sparkles className="size-3.5 text-emerald-600" />
              OUR BEST MARKET-BASED OFFER
            </span>
            <div className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-emerald-700">
              AED {data.offerPrice.toLocaleString("en-US")}
            </div>
            <p className="mt-0.5 text-[11px] font-medium text-slate-600">
              Cash on vehicle collection / Immediate transfer on inspection
            </p>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mt-3.5 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1 text-left">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Terms & Conditions
          </h4>
          <p className="text-[11px] leading-relaxed text-slate-600 font-normal">
            {data.terms ||
              "This offer is based on the vehicle information. If the actual condition, damage, mechanical issues or missing parts differ from the information provided, the offer price may be revised."}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 border-t border-slate-200 pt-3 text-center space-y-0.5">
          <p className="text-xs font-bold text-slate-800">
            Thank you for contacting {data.businessName || "USED GARAGE UAE"}.
          </p>
          <p className="text-xs font-semibold text-emerald-700">
            📞 {data.businessPhone}
          </p>
          <p className="text-[10px] text-slate-400 pt-1">
            Generated via Car Scrap Business Management System &bull; Confidential &bull; Valid for 7 days
          </p>
        </div>
      </div>
    );
  },
);
