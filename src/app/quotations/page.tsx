import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionActor } from "@/lib/auth/actor";
import { QuotationsView } from "@/features/quotations/components/quotations-view";
import { getQuotations } from "@/features/quotations/server/quotation-service";

export const metadata: Metadata = {
  title: "Vehicle Purchase Offers (Quotations) | Car Scrap Business",
  description:
    "Generate, preview, and send professional vehicle purchase offer PDFs to WhatsApp customers.",
};

export default async function QuotationsPage() {
  const actor = await getSessionActor();
  if (actor?.role === "VIEWER") {
    redirect("/dashboard");
  }

  const quotations = await getQuotations();

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <QuotationsView initialQuotations={quotations} />
    </div>
  );
}
