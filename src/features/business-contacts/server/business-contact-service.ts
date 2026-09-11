import { db } from "@/lib/db";
import type {
  BusinessContactRowData,
  BusinessContactsKpis,
} from "../domain/business-contact-types";

export async function getBusinessContactsListPageData(): Promise<{
  contacts: BusinessContactRowData[];
  kpis: BusinessContactsKpis;
  availableCategories: string[];
}> {
  // Check if any business contacts exist. If table is empty, auto-seed the initial contact requested by user
  const count = await db.businessContact.count();
  if (count === 0) {
    try {
      await db.businessContact.create({
        data: {
          name: "rahat",
          businessName: "ABC Web Solutions",
          category: "Web & IT",
          purpose: "webpage handling website development",
          location: "Dhaka",
          notes: "Website developer from Dhaka",
          isImportant: true,
          isActive: true,
        },
      });
    } catch {
      // Ignored if race condition
    }
  }

  const contacts = await db.businessContact.findMany({
    where: { isActive: true },
    orderBy: [
      { isImportant: "desc" },
      { createdAt: "desc" },
    ],
  });

  const formattedContacts: BusinessContactRowData[] = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    businessName: c.businessName,
    category: c.category,
    purpose: c.purpose,
    phone: c.phone,
    whatsapp: c.whatsapp,
    email: c.email,
    location: c.location,
    notes: c.notes,
    isImportant: c.isImportant,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  const importantCount = formattedContacts.filter((c) => c.isImportant).length;
  const uniqueCategories = Array.from(new Set(formattedContacts.map((c) => c.category).filter(Boolean)));

  const kpis: BusinessContactsKpis = {
    totalContacts: formattedContacts.length,
    importantCount,
    categoriesCount: uniqueCategories.length,
  };

  return {
    contacts: formattedContacts,
    kpis,
    availableCategories: uniqueCategories,
  };
}
