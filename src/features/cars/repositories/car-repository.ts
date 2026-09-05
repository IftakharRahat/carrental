import type { CreateCarInput } from "@/features/cars/domain/car-input";

export type CreatedCar = {
  id: string;
  carNumber: string;
};

export interface CarRepository {
  createWithPurchaseLedger(
    input: CreateCarInput,
    actorId: string,
  ): Promise<CreatedCar>;
}
