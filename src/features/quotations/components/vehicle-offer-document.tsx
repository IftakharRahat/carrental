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
        className={`bg-white text-slate-900 mx-auto w-full max-w-[760px] rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-lg print:border-none print:shadow-none print:p-8 print:max-w-none print:w-full print:m-0 font-sans ${className}`}
        style={{ colorScheme: "light" }}
      >
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b-2 border-slate-900/10 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-lg shadow-sm">
                <CarFront className="size-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                  {data.businessName || "USED GARAGE UAE"}
                </h1>
                <p className="text-xs font-semibold text-emerald-700 tracking-wide uppercase">
                  Automotive Scrap & Vehicle Recovery
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <p className="flex items-center gap-1.5 font-medium">
                <Phone className="size-3.5 text-emerald-600" />
                <span>Call / WhatsApp:</span>
                <strong className="text-slate-800">{data.businessPhone}</strong>
              </p>
              <p className="flex items-center gap-1.5 font-medium">
                <MapPin className="size-3.5 text-emerald-600" />
                <span>{data.businessAddress}</span>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right flex flex-col justify-between">
            <div className="inline-flex sm:self-end items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1 text-[11px] font-bold tracking-wider text-white uppercase shadow-xs">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              OFFICIAL OFFER
            </div>
            <div className="mt-3 space-y-0.5 text-xs">
              <p className="text-slate-500 font-medium">Quotation Date:</p>
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
        <div className="mt-6 mb-6 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-3 px-5 text-center shadow-xs">
          <h2 className="text-base sm:text-lg font-black tracking-wider text-white uppercase">
            VEHICLE PURCHASE OFFER
          </h2>
        </div>

        {/* Customer & Vehicle Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Customer Details */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2.5">
            <div className="border-b border-slate-200/80 pb-1.5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Customer Details
              </h3>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Verified Seller
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="font-bold text-slate-900">{data.customerName}</span>
              </div>
              {data.customerWhatsapp && (
                <div className="flex justify-between">
                  <span className="text-slate-500">WhatsApp:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {data.customerWhatsapp}
                  </span>
                </div>
              )}
              {data.customerLocation && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-semibold text-slate-800">{data.customerLocation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2.5">
            <div className="border-b border-slate-200/80 pb-1.5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Vehicle Details
              </h3>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                Target Unit
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle:</span>
                <span className="font-bold text-slate-900">{data.vehicleModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Model Year:</span>
                <span className="font-bold text-slate-900">{data.modelYear || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Condition:</span>
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                  {data.condition}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer-Provided Information (WhatsApp condition) */}
        {data.customerNotes && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/50 p-4.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="size-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Customer-Provided Information
              </h3>
            </div>
            <p className="text-[11px] font-semibold text-amber-800 mb-1">
              According to {firstName}:
            </p>
            <p className="text-xs font-medium text-slate-800 italic leading-relaxed pl-3 border-l-2 border-amber-400">
              &ldquo;{data.customerNotes}&rdquo;
            </p>
          </div>
        )}

        {/* Price Details & Offer Box */}
        <div className="mt-6 rounded-2xl border-2 border-emerald-600/30 bg-emerald-50/40 p-5 text-center">
          {data.askingPrice != null && data.askingPrice > 0 && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-white/80 px-4 py-1.5 border border-slate-200 text-xs shadow-2xs">
              <span className="text-slate-500 font-medium">Customer Asking Price:</span>
              <span className="font-bold text-slate-700 line-through">
                AED {data.askingPrice.toLocaleString("en-US")}
              </span>
            </div>
          )}

          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-800">
              <Sparkles className="size-4 text-emerald-600" />
              OUR BEST MARKET-BASED OFFER
            </span>
            <div className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-emerald-700">
              AED {data.offerPrice.toLocaleString("en-US")}
            </div>
            <p className="mt-1 text-[11px] font-medium text-slate-600">
              Cash on vehicle collection / Immediate transfer on inspection
            </p>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1.5 text-left">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Terms & Conditions
          </h4>
          <p className="text-[11px] leading-relaxed text-slate-600 font-normal">
            {data.terms ||
              "This offer is based on the vehicle information. If the actual condition, damage, mechanical issues or missing parts differ from the information provided, the offer price may be revised."}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-slate-200 pt-5 text-center space-y-1">
          <p className="text-xs font-bold text-slate-800">
            Thank you for contacting {data.businessName || "USED GARAGE UAE"}.
          </p>
          <p className="text-xs font-semibold text-emerald-700">
            📞 {data.businessPhone}
          </p>
          <p className="text-[10px] text-slate-400 pt-2">
            Generated via Car Scrap Business Management System &bull; Confidential &bull; Valid for 7 days
          </p>
        </div>
      </div>
    );
  },
);
