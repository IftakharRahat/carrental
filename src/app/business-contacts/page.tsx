import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionActor } from "@/lib/auth/actor";
import { BusinessContactsView } from "@/features/business-contacts/components/business-contacts-view";
import { getBusinessContactsListPageData } from "@/features/business-contacts/server/business-contact-service";

export const metadata: Metadata = {
  title: "Business Contacts | Car Scrap Business Management",
  description:
    "Directory of professional services, developers, legal, transport, and operational partners needed to run the business.",
};

export default async function BusinessContactsPage() {
  const actor = await getSessionActor();
  if (actor?.role === "VIEWER") {
    redirect("/dashboard");
  }

  const { contacts, kpis, availableCategories } = await getBusinessContactsListPageData();

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <BusinessContactsView
        initialContacts={contacts}
        initialKpis={kpis}
        availableCategories={availableCategories}
      />
    </div>
  );
}
