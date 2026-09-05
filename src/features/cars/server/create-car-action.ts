"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createCarInputSchema,
  isFutureBusinessDate,
} from "@/features/cars/domain/car-input";
import {
  PrismaCarRepository,
  PurchaseReferenceError,
} from "@/features/cars/repositories/prisma-car-repository";
import {
  cleanupCarPhotos,
  PhotoValidationError,
  uploadCarPhotos,
} from "@/features/cars/server/photo-storage";
import {
  AuthenticationError,
  AuthorizationError,
  requireActor,
  ServiceConfigurationError,
} from "@/lib/auth/actor";

export type CreateCarActionResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
      duplicateVin?: { carNumber: string; carLabel: string };
    };

const repository = new PrismaCarRepository();

export async function createCarAction(
  formData: FormData,
): Promise<CreateCarActionResult> {
  const parsed = createCarInputSchema.safeParse({
    purchaseDate: readString(formData, "purchaseDate"),
    sellerId: readString(formData, "sellerId"),
    sourceType: readString(formData, "sourceType"),
    sourceId: readString(formData, "sourceId"),
    brand: readString(formData, "brand"),
    model: readString(formData, "model"),
    year: readString(formData, "year"),
    condition: readString(formData, "condition"),
    conditionOther: readString(formData, "conditionOther"),
    purchasePrice: readString(formData, "purchasePrice"),
    paymentMethod: readString(formData, "paymentMethod"),
    vinChassis: readString(formData, "vinChassis"),
    notes: readString(formData, "notes"),
    idempotencyKey: readString(formData, "idempotencyKey"),
    allowFutureDate: readBoolean(formData, "allowFutureDate"),
    confirmDuplicateVin: readBoolean(formData, "confirmDuplicateVin"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const mainPhotoIndex = Number(readString(formData, "mainPhotoIndex") || 0);
  const photos = formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);

  let uploadedPhotos: Awaited<ReturnType<typeof uploadCarPhotos>> = [];
  let destination: string | null = null;

  try {
    const actor = await requireActor("cars:write");
    const timeZone = process.env.APP_TIMEZONE ?? "Asia/Dubai";

    if (isFutureBusinessDate(parsed.data.purchaseDate, new Date(), timeZone)) {
      if (!parsed.data.allowFutureDate || actor.role !== "ADMIN") {
        return {
          ok: false,
          message: "Future purchase dates require an explicit Admin override.",
          fieldErrors: {
            purchaseDate: ["Purchase date cannot be in the future."],
          },
        };
      }
    }

    if (parsed.data.vinChassis) {
      const duplicate = await repository.findDuplicateVin(parsed.data.vinChassis);
      if (duplicate && (!parsed.data.confirmDuplicateVin || actor.role !== "ADMIN")) {
        return {
          ok: false,
          message:
            actor.role === "ADMIN"
              ? "This VIN/chassis already exists. Confirm the override to continue."
              : "This VIN/chassis already exists. Ask an Admin to review it.",
          fieldErrors: { vinChassis: ["Possible duplicate VIN/chassis."] },
          duplicateVin: {
            carNumber: duplicate.carNumber,
            carLabel: `${duplicate.brand} ${duplicate.model}`,
          },
        };
      }
    }

    uploadedPhotos = await uploadCarPhotos(photos, mainPhotoIndex);
    const created = await repository.createWithPurchaseLedger(
      parsed.data,
      actor.profileId,
      uploadedPhotos,
    );

    if (created.wasExisting) await cleanupCarPhotos(uploadedPhotos);
    destination = `/cars/${created.carNumber}?created=1`;
  } catch (error) {
    await cleanupCarPhotos(uploadedPhotos);

    if (
      error instanceof PhotoValidationError ||
      error instanceof PurchaseReferenceError ||
      error instanceof AuthenticationError ||
      error instanceof AuthorizationError ||
      error instanceof ServiceConfigurationError
    ) {
      return { ok: false, message: error.message };
    }
    console.error("Failed to create car purchase", error);
    return { ok: false, message: "Unable to save the car. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/stock");
  revalidatePath("/cars");
  redirect(destination);
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "true" || value === "on" || value === "1";
}
