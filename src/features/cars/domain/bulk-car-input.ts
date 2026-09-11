import { z } from "zod";
import {
  peopleSourceTypes,
  sourceTypeValues,
} from "./car-input";

export const bulkCarItemSchema = z.object({
  brand: z.string().trim().min(1, "Brand is required"),
  model: z.string().trim().min(1, "Model is required"),
  year: z
    .string()
    .trim()
    .refine(
      (val) =>
        !val ||
        (/^\d{4}$/.test(val) &&
          Number(val) >= 1900 &&
          Number(val) <= new Date().getFullYear() + 1),
      "Enter a valid 4-digit year",
    )
    .optional()
    .or(z.literal("")),
  condition: z.enum([
    "SCRAP",
    "ACCIDENT_DAMAGED",
    "ENGINE_ISSUE",
    "GEARBOX_ISSUE",
    "OTHER",
  ]),
  conditionOther: z.string().trim().optional().or(z.literal("")),
  purchasePrice: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid AED amount")
    .refine((val) => Number(val) > 0, "Amount must be greater than zero"),
  vinChassis: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type BulkCarItem = z.infer<typeof bulkCarItemSchema>;

export const bulkCreateCarInputSchema = z
  .object({
    purchaseDate: z.string().date("Enter a valid purchase date"),
    sellerId: z.string().trim().min(1, "Select a seller"),
    sourceType: z.enum(sourceTypeValues),
    sourceId: z.string().trim().optional().or(z.literal("")),
    paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
    batchNotes: z.string().trim().optional().or(z.literal("")),
    items: z
      .array(bulkCarItemSchema)
      .min(2, "Bulk purchase requires at least 2 vehicles"),
  })
  .refine(
    (values) =>
      !peopleSourceTypes.has(values.sourceType) || Boolean(values.sourceId),
    {
      path: ["sourceId"],
      message: "Select a source name for this channel",
    },
  );

export type BulkCreateCarInput = z.infer<typeof bulkCreateCarInputSchema>;

export function calculateBulkSummary(
  items: Array<{ purchasePrice?: string | number }>,
): {
  totalCarsCount: number;
  totalInvestment: number;
  averagePricePerCar: number;
} {
  const totalCarsCount = items.length;
  const totalInvestment = items.reduce((sum, item) => {
    const val = Number(item.purchasePrice) || 0;
    return sum + val;
  }, 0);
  const averagePricePerCar =
    totalCarsCount > 0 ? Math.round(totalInvestment / totalCarsCount) : 0;

  return {
    totalCarsCount,
    totalInvestment: Math.round(totalInvestment * 100) / 100,
    averagePricePerCar,
  };
}
