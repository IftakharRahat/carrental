import { z } from "zod";

export const BUSINESS_CONTACT_CATEGORIES = [
  "Web & IT",
  "Legal & PRO",
  "Accounting & Tax",
  "Transport & Towing",
  "Workshop & Repair",
  "Scrap & Parts",
  "Government & Municipal",
  "General & Utilities",
  "Other",
] as const;

export type BusinessContactCategory = (typeof BUSINESS_CONTACT_CATEGORIES)[number] | (string & {});

export const createBusinessContactSchema = z.object({
  name: z.string().trim().min(1, "Contact name is required"),
  businessName: z.string().trim().optional().nullable(),
  category: z.string().trim().min(1, "Category is required"),
  purpose: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  whatsapp: z.string().trim().optional().nullable(),
  email: z.string().trim().email("Please enter a valid email").optional().nullable().or(z.literal("")),
  location: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  isImportant: z.boolean().default(false),
});

export type CreateBusinessContactInput = z.infer<typeof createBusinessContactSchema>;

export const updateBusinessContactSchema = createBusinessContactSchema.extend({
  id: z.string().uuid("Invalid contact ID"),
});

export type UpdateBusinessContactInput = z.infer<typeof updateBusinessContactSchema>;

export type BusinessContactRowData = {
  id: string;
  name: string;
  businessName: string | null;
  category: string;
  purpose: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  notes: string | null;
  isImportant: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BusinessContactsKpis = {
  totalContacts: number;
  importantCount: number;
  categoriesCount: number;
};
