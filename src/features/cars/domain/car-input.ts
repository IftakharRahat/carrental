import { z } from "zod";

export const sourceTypeValues = [
  "GARAGE_OWNER",
  "MIDDLEMAN",
  "REFERRAL",
  "FACEBOOK",
  "TIKTOK",
  "INSTAGRAM",
  "WALK_IN",
] as const;

export type SourceType = (typeof sourceTypeValues)[number];

export const peopleSourceTypes: ReadonlySet<SourceType> = new Set([
  "GARAGE_OWNER",
  "MIDDLEMAN",
  "REFERRAL",
]);

const positiveAedAmount = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid AED amount")
  .refine((value) => Number(value) > 0, "Amount must be greater than zero");

const optionalTrimmedString = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => value || undefined)
    .optional();

const optionalUuid = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .pipe(z.string().uuid().optional());

const optionalYear = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
);

export const createCarInputSchema = z
  .object({
    purchaseDate: z.string().date(),
    sellerId: z.string().uuid(),
    sourceType: z.enum(sourceTypeValues),
    sourceId: optionalUuid,
    brand: z.string().trim().min(1).max(80),
    model: z.string().trim().min(1).max(80),
    year: optionalYear,
    condition: z.enum([
      "SCRAP",
      "ACCIDENT_DAMAGED",
      "ENGINE_ISSUE",
      "GEARBOX_ISSUE",
      "OTHER",
    ]),
    conditionOther: optionalTrimmedString(200),
    purchasePrice: positiveAedAmount,
    paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
    vinChassis: optionalTrimmedString(100),
    notes: optionalTrimmedString(2000),
    idempotencyKey: z.string().uuid(),
    allowFutureDate: z.boolean().default(false),
    confirmDuplicateVin: z.boolean().default(false),
  })
  .refine(
    (input) => input.condition !== "OTHER" || Boolean(input.conditionOther),
    {
      message: "Describe the condition when Other is selected",
      path: ["conditionOther"],
    },
  )
  .refine(
    (input) =>
      !peopleSourceTypes.has(input.sourceType) || Boolean(input.sourceId),
    {
      message: "Select a source name for this source type",
      path: ["sourceId"],
    },
  );

export type CreateCarInput = z.infer<typeof createCarInputSchema>;

export function getBusinessDate(
  date: Date = new Date(),
  timeZone = "Asia/Dubai",
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function isFutureBusinessDate(
  value: string,
  date: Date = new Date(),
  timeZone = "Asia/Dubai",
): boolean {
  return value > getBusinessDate(date, timeZone);
}
