import { z } from "zod";

const positiveAedAmount = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid AED amount")
  .refine((value) => Number(value) > 0, "Amount must be greater than zero");

export const createCarInputSchema = z
  .object({
    purchaseDate: z.string().date(),
    sellerId: z.string().uuid(),
    sourceId: z.string().uuid().optional(),
    brand: z.string().trim().min(1).max(80),
    model: z.string().trim().min(1).max(80),
    year: z.number().int().min(1900).max(2100).optional(),
    condition: z.enum([
      "SCRAP",
      "ACCIDENT_DAMAGED",
      "ENGINE_ISSUE",
      "GEARBOX_ISSUE",
      "OTHER",
    ]),
    conditionOther: z.string().trim().max(200).optional(),
    purchasePrice: positiveAedAmount,
    paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
    vinChassis: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(2000).optional(),
    idempotencyKey: z.string().uuid(),
  })
  .refine(
    (input) => input.condition !== "OTHER" || Boolean(input.conditionOther),
    {
      message: "Describe the condition when Other is selected",
      path: ["conditionOther"],
    },
  );

export type CreateCarInput = z.infer<typeof createCarInputSchema>;
