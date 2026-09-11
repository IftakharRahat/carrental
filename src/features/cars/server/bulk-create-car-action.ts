"use server";

import { revalidatePath } from "next/cache";
import { formatCarNumber } from "@/features/cars/domain/car-number";
import {
  bulkCreateCarInputSchema,
  type BulkCreateCarInput,
} from "@/features/cars/domain/bulk-car-input";
import { requireActor } from "@/lib/auth/actor";
import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";

export type BulkCreateCarResult =
  | {
      ok: true;
      count: number;
      totalAmount: number;
      cars: Array<{ id: string; carNumber: string; brand: string; model: string; purchasePrice: number }>;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function bulkCreateCarsAction(
  input: BulkCreateCarInput,
): Promise<BulkCreateCarResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const parsed = bulkCreateCarInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check all car details and fix the errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = await requireActor("cars:write");
    const data = parsed.data;

    const result = await db.$transaction(
      async (tx) => {
        // 1. Verify seller
        const seller = await tx.seller.findFirst({
          where: { id: data.sellerId, isActive: true },
          select: { id: true, name: true },
        });
        if (!seller) {
          throw new Error("Selected seller not found or is inactive.");
        }

        // 2. Resolve source
        let finalSourceId = data.sourceId;
        if (finalSourceId) {
          const source = await tx.source.findFirst({
            where: { id: finalSourceId, isActive: true },
            select: { id: true, type: true },
          });
          if (!source || source.type !== data.sourceType) {
            throw new Error("Selected source does not match source channel.");
          }
        } else {
          const defaultNames: Record<string, string> = {
            WALK_IN: "Direct Walk-In",
            FACEBOOK: "Facebook",
            TIKTOK: "TikTok",
            INSTAGRAM: "Instagram",
            GARAGE_OWNER: "Garage Owner",
            MIDDLEMAN: "Middleman",
            REFERRAL: "Referral",
            AUCTION: "Auction",
          };
          const defaultName = defaultNames[data.sourceType] ?? data.sourceType;
          let source = await tx.source.findFirst({
            where: {
              type: data.sourceType,
              name: defaultName,
              isActive: true,
            },
            select: { id: true },
          });
          if (!source) {
            source = await tx.source.findFirst({
              where: { type: data.sourceType, isActive: true },
              select: { id: true },
            });
          }
          if (!source) {
            source = await tx.source.create({
              data: {
                name: defaultName,
                type: data.sourceType,
                isActive: true,
              },
              select: { id: true },
            });
          }
          finalSourceId = source.id;
        }

        const purchaseDate = new Date(`${data.purchaseDate}T00:00:00.000Z`);
        const createdCars: Array<{
          id: string;
          carNumber: string;
          brand: string;
          model: string;
          purchasePrice: number;
        }> = [];

        let totalAmount = 0;
        const totalItems = data.items.length;

        for (let i = 0; i < totalItems; i++) {
          const item = data.items[i];
          const priceNum = Number(item.purchasePrice);
          totalAmount += priceNum;

          const yearNum = item.year ? Number(item.year) : null;
          const idempotencyKey = crypto.randomUUID();

          const car = await tx.car.create({
            data: {
              idempotencyKey,
              purchaseDate,
              sellerId: data.sellerId,
              sourceId: finalSourceId,
              brand: item.brand,
              model: item.model,
              year: yearNum,
              condition: item.condition,
              conditionOther: item.conditionOther || null,
              purchasePrice: item.purchasePrice,
              paymentMethod: data.paymentMethod,
              vinChassis: item.vinChassis || null,
              notes: item.notes || (data.batchNotes ? `Bulk batch purchase (${i + 1}/${totalItems}) - ${data.batchNotes}` : `Bulk batch purchase (${i + 1}/${totalItems})`),
              createdById: actor.profileId,
              updatedById: actor.profileId,
            },
            select: { id: true, carNumber: true, brand: true, model: true },
          });

          const formattedNumber = formatCarNumber(car.carNumber);

          // Create Money-Out Transaction in Finance
          await tx.cashTransaction.create({
            data: {
              transactionDate: purchaseDate,
              direction: "OUT",
              category: "CAR_PURCHASE",
              amount: item.purchasePrice,
              paymentMethod: data.paymentMethod,
              referenceType: "CAR_PURCHASE",
              referenceId: car.id,
              carId: car.id,
              description: `Bulk Purchase [${i + 1}/${totalItems}]: ${formattedNumber} · ${item.brand} ${item.model} from ${seller.name}`,
              createdById: actor.profileId,
            },
          });

          // Audit Log
          await tx.auditLog.create({
            data: {
              actorId: actor.profileId,
              action: "CREATE",
              entityType: "CAR",
              entityId: car.id,
              after: {
                bulkPurchase: true,
                batchIndex: i + 1,
                batchTotal: totalItems,
                carNumber: formattedNumber,
                purchaseDate: data.purchaseDate,
                sellerId: data.sellerId,
                brand: item.brand,
                model: item.model,
                purchasePrice: item.purchasePrice,
              },
            },
          });

          createdCars.push({
            id: car.id,
            carNumber: formattedNumber,
            brand: car.brand,
            model: car.model,
            purchasePrice: priceNum,
          });
        }

        return {
          createdCars,
          totalAmount: Math.round(totalAmount * 100) / 100,
        };
      },
      { isolationLevel: "Serializable" },
    );

    revalidatePath("/");
    revalidatePath("/stock");
    revalidatePath("/cars");
    revalidatePath("/finance");

    return {
      ok: true,
      count: result.createdCars.length,
      totalAmount: result.totalAmount,
      cars: result.createdCars,
    };
  } catch (error) {
    console.error("Bulk car purchase failed:", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to record bulk car purchase. Please try again.",
    };
  }
}
