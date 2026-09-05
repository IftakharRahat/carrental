import type { CreateCarInput } from "@/features/cars/domain/car-input";

export type CreatedCar = {
  id: string;
  carNumber: string;
  wasExisting: boolean;
};

export type PurchaseAttachment = {
  pathname: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  isMain: boolean;
};

export type DuplicateVinCar = {
  id: string;
  carNumber: string;
  brand: string;
  model: string;
};

export interface CarRepository {
  findDuplicateVin(vinChassis: string): Promise<DuplicateVinCar | null>;
  createWithPurchaseLedger(
    input: CreateCarInput,
    actorId: string,
    attachments: readonly PurchaseAttachment[],
  ): Promise<CreatedCar>;
}
