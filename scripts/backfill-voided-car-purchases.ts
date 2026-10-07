/**
 * One-time backfill: voids CAR_PURCHASE cash transactions that belong to cars
 * already marked VOIDED (cancelled) before the purchase-refund fix shipped.
 *
 * Usage:
 *   npx tsx scripts/backfill-voided-car-purchases.ts          # dry run
 *   npx tsx scripts/backfill-voided-car-purchases.ts --apply  # write changes
 */
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set in environment.");
  }

  const apply = process.argv.includes("--apply");
  const adapter = new PrismaNeon({ connectionString: databaseUrl });
  const db = new PrismaClient({ adapter });

  const voidedCars = await db.car.findMany({
    where: { status: "VOIDED" },
    select: { id: true, carNumber: true, brand: true, model: true },
  });

  if (voidedCars.length === 0) {
    console.log("No voided cars found. Nothing to do.");
    return;
  }

  const staleTxs = await db.cashTransaction.findMany({
    where: {
      referenceType: "CAR_PURCHASE",
      referenceId: { in: voidedCars.map((c) => c.id) },
      status: "ACTIVE",
    },
    select: { id: true, referenceId: true, amount: true, description: true },
  });

  if (staleTxs.length === 0) {
    console.log("All voided cars already have their purchase cash-out voided.");
    return;
  }

  let total = 0;
  for (const t of staleTxs) {
    total += Number(t.amount);
    console.log(`- ${t.description} (AED ${Number(t.amount).toFixed(2)})`);
  }
  console.log(
    `${staleTxs.length} purchase transaction(s), AED ${total.toFixed(2)} to return to Available Cash.`,
  );

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to write changes.");
    return;
  }

  const result = await db.cashTransaction.updateMany({
    where: { id: { in: staleTxs.map((t) => t.id) } },
    data: {
      status: "VOIDED",
      voidReason: "Car purchase cancelled (car voided) - backfill",
    },
  });

  console.log(`✅ Voided ${result.count} purchase transaction(s).`);
}

main().catch((err) => {
  console.error("Backfill error:", err);
  process.exit(1);
});
