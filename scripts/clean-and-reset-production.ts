import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.js";

const STANDARD_BUYER_TYPES = [
  "Whole Car / Body",
  "Engine",
  "Scrap",
  "Copper",
  "Parts",
  "Other",
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set in environment.");
  }

  const adapter = new PrismaNeon({ connectionString: databaseUrl });
  const db = new PrismaClient({ adapter });

  console.log("🚀 Starting database & storage purge for clean production launch...\n");

  // 1. Cloudinary Clean Up
  try {
    if (process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)) {
      cloudinary.config();
      console.log("☁️  Checking Cloudinary for test uploads in 'cars/'...");
      const cloudRes = await cloudinary.api.resources({
        type: "upload",
        prefix: "cars",
        max_results: 100,
      });

      if (cloudRes.resources && cloudRes.resources.length > 0) {
        const publicIds = cloudRes.resources.map((r: { public_id: string }) => r.public_id);
        console.log(`🗑️  Deleting ${publicIds.length} Cloudinary test resource(s):`, publicIds);
        await cloudinary.api.delete_resources(publicIds);
        console.log("✅ Cloudinary test uploads deleted successfully.");
      } else {
        console.log("✅ No test images found in Cloudinary.");
      }
    }
  } catch (cloudErr) {
    console.warn("⚠️  Warning during Cloudinary cleanup:", cloudErr);
  }

  // 2. Wipe operational & transactional test data in safe dependency order
  console.log("\n🧹 Deleting test data across tables...");

  const auditDeleted = await db.auditLog.deleteMany({});
  console.log(`- Audit Logs: deleted ${auditDeleted.count}`);

  const snapshotsDeleted = await db.monthlySnapshot.deleteMany({});
  console.log(`- Monthly Snapshots: deleted ${snapshotsDeleted.count}`);

  const attachmentsDeleted = await db.attachment.deleteMany({});
  console.log(`- Attachments: deleted ${attachmentsDeleted.count}`);

  const recoveryTxDeleted = await db.recoveryTransaction.deleteMany({});
  console.log(`- Recovery Transactions: deleted ${recoveryTxDeleted.count}`);

  const recoveryItemsDeleted = await db.recoveryItem.deleteMany({});
  console.log(`- Recovery Items: deleted ${recoveryItemsDeleted.count}`);

  const carExpensesDeleted = await db.carExpense.deleteMany({});
  console.log(`- Car Expenses: deleted ${carExpensesDeleted.count}`);

  const cashTxDeleted = await db.cashTransaction.deleteMany({});
  console.log(`- Cash Transactions: deleted ${cashTxDeleted.count}`);

  const carsDeleted = await db.car.deleteMany({});
  console.log(`- Cars: deleted ${carsDeleted.count}`);

  const quotationsDeleted = await db.quotation.deleteMany({});
  console.log(`- Quotations: deleted ${quotationsDeleted.count}`);

  const businessExpensesDeleted = await db.businessExpense.deleteMany({});
  console.log(`- Business Expenses: deleted ${businessExpensesDeleted.count}`);

  const buyerTypeAssignmentsDeleted = await db.buyerTypeAssignment.deleteMany({});
  console.log(`- Buyer Type Assignments: deleted ${buyerTypeAssignmentsDeleted.count}`);

  const buyersDeleted = await db.buyer.deleteMany({});
  console.log(`- Buyers: deleted ${buyersDeleted.count}`);

  const sellersDeleted = await db.seller.deleteMany({});
  console.log(`- Sellers: deleted ${sellersDeleted.count}`);

  const sourcesDeleted = await db.source.deleteMany({});
  console.log(`- Sources: deleted ${sourcesDeleted.count}`);

  const businessContactsDeleted = await db.businessContact.deleteMany({});
  console.log(`- Business Contacts: deleted ${businessContactsDeleted.count}`);

  const customBrandsDeleted = await db.customBrand.deleteMany({});
  console.log(`- Custom Brands: deleted ${customBrandsDeleted.count}`);

  const customExpenseCatsDeleted = await db.customExpenseCategory.deleteMany({});
  console.log(`- Custom Expense Categories: deleted ${customExpenseCatsDeleted.count}`);

  const customCashCatsDeleted = await db.customCashCategory.deleteMany({});
  console.log(`- Custom Cash Categories: deleted ${customCashCatsDeleted.count}`);

  // 3. User profiles: remove test users, ensure primary production admin
  const testUsersDeleted = await db.userProfile.deleteMany({
    where: {
      email: { not: "admin@carscrap.ae" },
    },
  });
  console.log(`- Test Users: deleted ${testUsersDeleted.count} (preserved admin@carscrap.ae)`);

  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await db.userProfile.upsert({
    where: { email: "admin@carscrap.ae" },
    update: {
      name: "Administrator",
      role: "ADMIN",
      isActive: true,
      passwordHash,
    },
    create: {
      email: "admin@carscrap.ae",
      name: "Administrator",
      role: "ADMIN",
      isActive: true,
      passwordHash,
    },
  });
  console.log(`✅ Production Admin verified: ${admin.email} (ID: ${admin.id})`);

  // 4. Ensure standard Buyer Types
  console.log("\n📦 Ensuring standard buyer types...");
  for (const name of STANDARD_BUYER_TYPES) {
    await db.buyerType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("✅ Standard buyer types are ready.");

  // 5. Reset Sequences to 1 for fresh production start
  console.log("\n🔢 Resetting database sequences...");
  await db.$executeRawUnsafe(`ALTER SEQUENCE cars_car_number_seq RESTART WITH 1;`);
  await db.$executeRawUnsafe(`ALTER SEQUENCE quotations_quotation_number_seq RESTART WITH 1;`);
  console.log("✅ cars_car_number_seq reset to 1");
  console.log("✅ quotations_quotation_number_seq reset to 1");

  // 6. Verify final counts
  console.log("\n================ PRODUCTION DATABASE STATUS ================");
  const finalCounts = {
    "Cars (Stock)": await db.car.count(),
    "Car Expenses": await db.carExpense.count(),
    "Recovery Items": await db.recoveryItem.count(),
    "Sales / Recovery Transactions": await db.recoveryTransaction.count(),
    "Business Expenses": await db.businessExpense.count(),
    "Cash Transactions": await db.cashTransaction.count(),
    "Attachments": await db.attachment.count(),
    "Monthly Snapshots": await db.monthlySnapshot.count(),
    "Quotations": await db.quotation.count(),
    "Audit Logs": await db.auditLog.count(),
    "Sellers": await db.seller.count(),
    "Sources": await db.source.count(),
    "Buyers": await db.buyer.count(),
    "Business Contacts": await db.businessContact.count(),
    "Custom Brands": await db.customBrand.count(),
    "Custom Cash Categories": await db.customCashCategory.count(),
    "Buyer Types (Standard)": await db.buyerType.count(),
    "Active Users": await db.userProfile.count(),
  };

  console.table(finalCounts);
  console.log("🎉 Database is completely fresh, clean, and ready for production!");
}

main().catch((err) => {
  console.error("Purge error:", err);
  process.exit(1);
});
