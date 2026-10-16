import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.js";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set in environment.");
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@carscrap.ae").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error(
      "ADMIN_PASSWORD is not set in environment. " +
      "Add ADMIN_PASSWORD to your .env file before running the seed script."
    );
  }

  if (adminPassword.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters long.");
  }

  const adapter = new PrismaNeon({ connectionString: databaseUrl });
  const db = new PrismaClient({ adapter });

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // Seed or update primary production admin
  const admin = await db.userProfile.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: "ADMIN",
      isActive: true,
      name: "Administrator",
    },
    create: {
      email: adminEmail,
      name: "Administrator",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Admin seeded/updated successfully:", admin.email);
  console.log("   (Password was read from ADMIN_PASSWORD env variable)");
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
