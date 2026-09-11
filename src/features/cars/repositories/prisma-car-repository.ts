import "server-only";

import { formatCarNumber } from "@/features/cars/domain/car-number";
import type { CreateCarInput } from "@/features/cars/domain/car-input";
import type {
  CarRepository,
  CreatedCar,
  DuplicateVinCar,
  PurchaseAttachment,
} from "@/features/cars/repositories/car-repository";
import { db } from "@/lib/db";

export class PurchaseReferenceError extends Error {}

export class PrismaCarRepository implements CarRepository {
  async findDuplicateVin(vinChassis: string): Promise<DuplicateVinCar | null> {
    const car = await db.car.findFirst({
      where: {
        vinChassis: { equals: vinChassis, mode: "insensitive" },
        status: { not: "VOIDED" },
      },
      select: { id: true, carNumber: true, brand: true, model: true },
    });

    return car ? { ...car, carNumber: formatCarNumber(car.carNumber) } : null;
  }

  async createWithPurchaseLedger(
    input: CreateCarInput,
    actorId: string,
    attachments: readonly PurchaseAttachment[],
  ): Promise<CreatedCar> {
    const result = await db.$transaction(
      async (tx) => {
        const existing = await tx.car.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          select: { id: true, carNumber: true },
        });
        if (existing) return { ...existing, wasExisting: true };

        const seller = await tx.seller.findFirst({
          where: { id: input.sellerId, isActive: true },
          select: { id: true },
        });
        if (!seller)
          throw new PurchaseReferenceError("Select an active seller.");

        let finalSourceId = input.sourceId;
        if (finalSourceId) {
          const source = await tx.source.findFirst({
            where: { id: finalSourceId, isActive: true },
            select: { id: true, type: true },
          });
          if (!source || source.type !== input.sourceType) {
            throw new PurchaseReferenceError(
              "The selected source does not match the source type.",
            );
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
          const defaultName = defaultNames[input.sourceType] ?? input.sourceType;
          let source = await tx.source.findFirst({
            where: {
              type: input.sourceType,
              name: defaultName,
              isActive: true,
            },
            select: { id: true },
          });
          if (!source) {
            source = await tx.source.findFirst({
              where: { type: input.sourceType, isActive: true },
              select: { id: true },
            });
          }
          if (!source) {
            source = await tx.source.create({
              data: {
                name: defaultName,
                type: input.sourceType,
                isActive: true,
              },
              select: { id: true },
            });
          }
          finalSourceId = source.id;
        }

        const mainPhoto = attachments.find((attachment) => attachment.isMain);
        const car = await tx.car.create({
          data: {
            idempotencyKey: input.idempotencyKey,
            purchaseDate: new Date(`${input.purchaseDate}T00:00:00.000Z`),
            sellerId: input.sellerId,
            sourceId: finalSourceId,
            brand: input.brand,
            model: input.model,
            year: input.year,
            condition: input.condition,
            conditionOther: input.conditionOther,
            purchasePrice: input.purchasePrice,
            paymentMethod: input.paymentMethod,
            vinChassis: input.vinChassis,
            mainPhotoUrl: mainPhoto?.url,
            notes: input.notes,
            createdById: actorId,
            updatedById: actorId,
          },
          select: { id: true, carNumber: true },
        });

        await tx.cashTransaction.create({
          data: {
            transactionDate: new Date(`${input.purchaseDate}T00:00:00.000Z`),
            direction: "OUT",
            category: "CAR_PURCHASE",
            amount: input.purchasePrice,
            paymentMethod: input.paymentMethod,
            referenceType: "CAR_PURCHASE",
            referenceId: car.id,
            carId: car.id,
            description: `Purchase of ${formatCarNumber(car.carNumber)} · ${input.brand} ${input.model}`,
            createdById: actorId,
          },
        });

        if (attachments.length > 0) {
          await tx.attachment.createMany({
            data: attachments.map((attachment) => ({
              carId: car.id,
              kind: "PHOTO" as const,
              pathname: attachment.pathname,
              contentType: attachment.contentType,
              sizeBytes: attachment.sizeBytes,
              isMain: attachment.isMain,
              uploadedById: actorId,
            })),
          });
        }

        await tx.auditLog.create({
          data: {
            actorId,
            action: "CREATE",
            entityType: "CAR",
            entityId: car.id,
            after: {
              carNumber: formatCarNumber(car.carNumber),
              purchaseDate: input.purchaseDate,
              sellerId: input.sellerId,
              sourceId: finalSourceId,
              brand: input.brand,
              model: input.model,
              year: input.year ?? null,
              condition: input.condition,
              purchasePrice: input.purchasePrice,
              paymentMethod: input.paymentMethod,
              vinChassis: input.vinChassis ?? null,
            },
          },
        });

        return { ...car, wasExisting: false };
      },
      { isolationLevel: "Serializable" },
    );

    return { ...result, carNumber: formatCarNumber(result.carNumber) };
  }
}
