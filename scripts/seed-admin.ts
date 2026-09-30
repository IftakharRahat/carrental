import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.js";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set in environment.");
  }

  const adapter = new PrismaNeon({ connectionString: databaseUrl });
  const db = new PrismaClient({ adapter });

  const passwordHash = await bcrypt.hash("admin123", 10);

  // Seed or update primary production admin: admin@carscrap.ae
  const admin = await db.userProfile.upsert({
    where: { email: "admin@carscrap.ae" },
    update: {
      passwordHash,
      role: "ADMIN",
      isActive: true,
      name: "Administrator",
    },
    create: {
      email: "admin@carscrap.ae",
      name: "Administrator",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Production Admin seeded successfully:", admin.email, "(Password: admin123)");
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
