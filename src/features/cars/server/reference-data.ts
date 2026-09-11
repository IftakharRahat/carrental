import "server-only";

import { isAuthConfigured, isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";

export type SellerOption = {
  id: string;
  name: string;
  detail: string | null;
};

export type SourceOption = SellerOption & {
  type: string;
};

export const defaultBrands: string[] = [
  "Toyota",
  "Nissan",
  "BMW",
  "Mercedes-Benz",
  "Honda",
  "Ford",
  "Hyundai",
  "Kia",
  "Lexus",
  "Audi",
  "Chevrolet",
  "Mitsubishi",
  "Volkswagen",
  "Mazda",
  "Land Rover",
  "Porsche",
  "Suzuki",
  "Jeep",
  "Volvo",
  "Renault",
  "Peugeot",
  "GMC",
  "Dodge",
  "Infiniti",
  "Subaru",
  "Cadillac",
  "Jaguar",
  "MG",
  "BYD",
  "Chery",
  "Geely",
  "Haval",
  "Changan",
  "Jetour",
];

export type BuyCarReferenceData = {
  sellers: SellerOption[];
  sources: SourceOption[];
  brands: string[];
};

export async function getBuyCarReferenceData(): Promise<BuyCarReferenceData> {
  const authenticationUnavailable = !isAuthConfigured();

  if (!isDatabaseConfigured() || authenticationUnavailable) {
    return { sellers: [], sources: [], brands: defaultBrands };
  }

  const [sellers, sources, distinctCars, customBrands] = await Promise.all([
    db.seller.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true },
    }),
    db.source.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true, type: true },
    }),
    db.car.findMany({
      select: { brand: true },
      distinct: ["brand"],
    }),
    db.customBrand?.findMany
      ? db.customBrand.findMany({
          select: { name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const existingCarBrands = distinctCars
    .map((c) => c.brand.trim())
    .filter(Boolean);
  const savedCustomBrands = customBrands
    .map((b) => b.name.trim())
    .filter(Boolean);
  const brands = Array.from(
    new Set([...defaultBrands, ...savedCustomBrands, ...existingCarBrands]),
  );

  return {
    sellers: sellers.map(({ id, name, phone }) => ({
      id,
      name,
      detail: phone,
    })),
    sources: sources.map(({ id, name, phone, type }) => ({
      id,
      name,
      detail: phone,
      type,
    })),
    brands,
  };
}
