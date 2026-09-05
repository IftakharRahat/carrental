import { beforeEach, describe, expect, it, vi } from "vitest";

import { PrismaStockRepository } from "./prisma-stock-repository";

// Mock server-only to avoid environment restriction in vitest
vi.mock("server-only", () => ({}));

// Mock config-state
vi.mock("@/lib/config-state", () => ({
  isDatabaseConfigured: vi.fn(() => true),
}));

// Mock db
const mockFindMany = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    car: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

describe("PrismaStockRepository", () => {
  let repository: PrismaStockRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaStockRepository();
  });

  it("returns empty result if database is not configured", async () => {
    const { isDatabaseConfigured } = await import("@/lib/config-state");
    vi.mocked(isDatabaseConfigured).mockReturnValueOnce(false);

    const result = await repository.getStock();
    expect(result.items).toEqual([]);
    expect(result.summary).toEqual({
      activeCarsCount: 0,
      stockValue: 0,
      recoveredFromActiveStock: 0,
    });
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("queries cars with default status filter (excluding COMPLETED) and calculates aggregates correctly", async () => {
    mockFindMany.mockResolvedValueOnce([
      {
        id: "car-1",
        carNumber: 1,
        brand: "Toyota",
        model: "Corolla",
        year: 2017,
        condition: "SCRAP",
        conditionOther: null,
        status: "IN_STOCK",
        purchaseDate: new Date("2026-08-20T00:00:00Z"),
        completionDate: null,
        purchasePrice: "8000.00",
        vinChassis: "TOY123456",
        notes: "Good scrap",
        mainPhotoUrl: "https://example.com/photo1.jpg",
        expenses: [{ amount: "500.00" }, { amount: "200.00" }],
        recoveries: [{ amount: "1000.00" }],
        recoveryItems: [
          { id: "item-1", status: "PENDING" },
          { id: "item-2", status: "SOLD" },
        ],
      },
      {
        id: "car-2",
        carNumber: 2,
        brand: "Honda",
        model: "Civic",
        year: 2019,
        condition: "ACCIDENT_DAMAGED",
        conditionOther: null,
        status: "PARTIALLY_RECOVERED",
        purchaseDate: new Date("2026-08-25T00:00:00Z"),
        completionDate: null,
        purchasePrice: "12000.00",
        vinChassis: null,
        notes: null,
        mainPhotoUrl: null,
        expenses: [{ amount: "1000.00" }],
        recoveries: [{ amount: "4000.00" }],
        recoveryItems: [], // whole-car sale (N/A)
      },
    ]);

    const result = await repository.getStock();

    // Verify query parameters passed to prisma
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ["IN_STOCK", "PARTIALLY_RECOVERED"] },
        }),
      }),
    );

    // Verify mapped items
    expect(result.items).toHaveLength(2);

    const [first, second] = result.items;
    expect(first.carNumber).toBe("CAR-0001");
    expect(first.purchasePrice).toBe(8000);
    expect(first.totalExpenses).toBe(700);
    expect(first.totalInvestment).toBe(8700);
    expect(first.recovery).toBe(1000);
    expect(first.pendingItemsCount).toBe(1);
    expect(first.totalItemsCount).toBe(2);

    expect(second.carNumber).toBe("CAR-0002");
    expect(second.pendingItemsCount).toBeNull(); // N/A
    expect(second.totalItemsCount).toBeNull();

    // Verify summary calculation
    expect(result.summary.activeCarsCount).toBe(2);
    expect(result.summary.stockValue).toBe(8700 + 13000); // 21700
    expect(result.summary.recoveredFromActiveStock).toBe(1000 + 4000); // 5000
  });

  it("applies search, condition, brand, and date filters to prisma query", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    await repository.getStock({
      search: "CAR-0005",
      condition: "SCRAP",
      brand: "Nissan",
      includeCompleted: true,
      purchaseDateFrom: "2026-08-01",
      purchaseDateTo: "2026-08-31",
    });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ["IN_STOCK", "PARTIALLY_RECOVERED", "COMPLETED"] },
          condition: "SCRAP",
          brand: { equals: "Nissan", mode: "insensitive" },
          purchaseDate: {
            gte: new Date("2026-08-01T00:00:00.000Z"),
            lte: new Date("2026-08-31T23:59:59.999Z"),
          },
          OR: expect.arrayContaining([
            { carNumber: 5 },
            { brand: { contains: "CAR-0005", mode: "insensitive" } },
          ]),
        }),
      }),
    );
  });
});
