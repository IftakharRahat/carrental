-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'VIEWER');

-- CreateEnum
CREATE TYPE "CarStatus" AS ENUM ('IN_STOCK', 'PARTIALLY_RECOVERED', 'COMPLETED', 'VOIDED');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'VOIDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'OTHER');

-- CreateEnum
CREATE TYPE "CarCondition" AS ENUM ('SCRAP', 'ACCIDENT_DAMAGED', 'ENGINE_ISSUE', 'GEARBOX_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "CarExpenseCategory" AS ENUM ('TRANSPORT', 'LABOUR', 'PARTS', 'REPAIR', 'RTA_DOCUMENTATION', 'OTHER');

-- CreateEnum
CREATE TYPE "BusinessExpenseCategory" AS ENUM ('RENT', 'UTILITIES', 'FUEL', 'SALARY', 'OFFICE', 'MARKETING', 'MAINTENANCE', 'PROFESSIONAL_FEES', 'OTHER');

-- CreateEnum
CREATE TYPE "RecoveryMode" AS ENUM ('WHOLE_CAR', 'ITEM');

-- CreateEnum
CREATE TYPE "RecoveryItemType" AS ENUM ('ENGINE', 'BODY', 'GEARBOX', 'COPPER', 'PARTS', 'OTHER');

-- CreateEnum
CREATE TYPE "RecoveryItemStatus" AS ENUM ('PENDING', 'SOLD', 'CLOSED');

-- CreateEnum
CREATE TYPE "CashDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "CashCategory" AS ENUM ('CAR_PURCHASE', 'CAR_EXPENSE', 'BUSINESS_EXPENSE', 'COMMISSION', 'WHOLE_CAR_SALE', 'ITEM_SALE', 'CAPITAL_INJECTION', 'OTHER_INCOME', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('PHOTO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'VOID', 'COMPLETE', 'RESTORE');

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "auth_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sellers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "emirates_id" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "company_name" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "buyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_type_assignments" (
    "buyer_id" UUID NOT NULL,
    "buyer_type_id" UUID NOT NULL,

    CONSTRAINT "buyer_type_assignments_pkey" PRIMARY KEY ("buyer_id","buyer_type_id")
);

-- CreateTable
CREATE TABLE "cars" (
    "id" UUID NOT NULL,
    "car_number" SERIAL NOT NULL,
    "idempotency_key" UUID NOT NULL,
    "purchase_date" DATE NOT NULL,
    "seller_id" UUID NOT NULL,
    "source_id" UUID,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "condition" "CarCondition" NOT NULL,
    "condition_other" TEXT,
    "purchase_price" DECIMAL(14,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "vin_chassis" TEXT,
    "status" "CarStatus" NOT NULL DEFAULT 'IN_STOCK',
    "completion_date" DATE,
    "main_photo_url" TEXT,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_expenses" (
    "id" UUID NOT NULL,
    "idempotency_key" UUID NOT NULL,
    "car_id" UUID NOT NULL,
    "expense_date" DATE NOT NULL,
    "category" "CarExpenseCategory" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "void_reason" TEXT,
    "voided_by_id" TEXT,
    "voided_at" TIMESTAMPTZ(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "car_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_items" (
    "id" UUID NOT NULL,
    "car_id" UUID NOT NULL,
    "type" "RecoveryItemType" NOT NULL,
    "label" TEXT,
    "status" "RecoveryItemStatus" NOT NULL DEFAULT 'PENDING',
    "closed_notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "recovery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_transactions" (
    "id" UUID NOT NULL,
    "idempotency_key" UUID NOT NULL,
    "car_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "mode" "RecoveryMode" NOT NULL,
    "item_type" "RecoveryItemType",
    "item_label" TEXT,
    "sale_date" DATE NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "void_reason" TEXT,
    "voided_by_id" TEXT,
    "voided_at" TIMESTAMPTZ(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "recovery_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_expenses" (
    "id" UUID NOT NULL,
    "idempotency_key" UUID NOT NULL,
    "expense_date" DATE NOT NULL,
    "category" "BusinessExpenseCategory" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "void_reason" TEXT,
    "voided_by_id" TEXT,
    "voided_at" TIMESTAMPTZ(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "business_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_transactions" (
    "id" UUID NOT NULL,
    "transaction_date" DATE NOT NULL,
    "direction" "CashDirection" NOT NULL,
    "category" "CashCategory" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "reference_type" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "car_id" UUID,
    "description" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "void_reason" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cash_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "car_id" UUID NOT NULL,
    "kind" "AttachmentKind" NOT NULL,
    "pathname" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_snapshots" (
    "id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "closing_stock_cars" INTEGER NOT NULL,
    "closing_stock_value" DECIMAL(14,2) NOT NULL,
    "closing_cash" DECIMAL(14,2) NOT NULL,
    "realized_car_profit" DECIMAL(14,2) NOT NULL,
    "net_business_profit" DECIMAL(14,2) NOT NULL,
    "generated_by_id" TEXT NOT NULL,
    "generated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "reason" TEXT,
    "before" JSONB,
    "after" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_auth_user_id_key" ON "user_profiles"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");

-- CreateIndex
CREATE INDEX "sellers_name_idx" ON "sellers"("name");

-- CreateIndex
CREATE INDEX "sellers_phone_idx" ON "sellers"("phone");

-- CreateIndex
CREATE INDEX "sources_type_idx" ON "sources"("type");

-- CreateIndex
CREATE INDEX "sources_name_idx" ON "sources"("name");

-- CreateIndex
CREATE INDEX "buyers_name_idx" ON "buyers"("name");

-- CreateIndex
CREATE INDEX "buyers_phone_idx" ON "buyers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_types_name_key" ON "buyer_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cars_car_number_key" ON "cars"("car_number");

-- CreateIndex
CREATE UNIQUE INDEX "cars_idempotency_key_key" ON "cars"("idempotency_key");

-- CreateIndex
CREATE INDEX "cars_status_purchase_date_idx" ON "cars"("status", "purchase_date");

-- CreateIndex
CREATE INDEX "cars_brand_model_idx" ON "cars"("brand", "model");

-- CreateIndex
CREATE INDEX "cars_vin_chassis_idx" ON "cars"("vin_chassis");

-- CreateIndex
CREATE INDEX "cars_seller_id_idx" ON "cars"("seller_id");

-- CreateIndex
CREATE INDEX "cars_source_id_idx" ON "cars"("source_id");

-- CreateIndex
CREATE UNIQUE INDEX "car_expenses_idempotency_key_key" ON "car_expenses"("idempotency_key");

-- CreateIndex
CREATE INDEX "car_expenses_car_id_expense_date_idx" ON "car_expenses"("car_id", "expense_date");

-- CreateIndex
CREATE INDEX "car_expenses_expense_date_status_idx" ON "car_expenses"("expense_date", "status");

-- CreateIndex
CREATE INDEX "recovery_items_car_id_status_idx" ON "recovery_items"("car_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "recovery_transactions_idempotency_key_key" ON "recovery_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "recovery_transactions_car_id_sale_date_idx" ON "recovery_transactions"("car_id", "sale_date");

-- CreateIndex
CREATE INDEX "recovery_transactions_buyer_id_sale_date_idx" ON "recovery_transactions"("buyer_id", "sale_date");

-- CreateIndex
CREATE INDEX "recovery_transactions_sale_date_status_idx" ON "recovery_transactions"("sale_date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "business_expenses_idempotency_key_key" ON "business_expenses"("idempotency_key");

-- CreateIndex
CREATE INDEX "business_expenses_expense_date_status_idx" ON "business_expenses"("expense_date", "status");

-- CreateIndex
CREATE INDEX "cash_transactions_transaction_date_status_idx" ON "cash_transactions"("transaction_date", "status");

-- CreateIndex
CREATE INDEX "cash_transactions_car_id_idx" ON "cash_transactions"("car_id");

-- CreateIndex
CREATE UNIQUE INDEX "cash_transactions_reference_type_reference_id_key" ON "cash_transactions"("reference_type", "reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_pathname_key" ON "attachments"("pathname");

-- CreateIndex
CREATE INDEX "attachments_car_id_kind_idx" ON "attachments"("car_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_snapshots_year_month_key" ON "monthly_snapshots"("year", "month");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- AddForeignKey
ALTER TABLE "buyer_type_assignments" ADD CONSTRAINT "buyer_type_assignments_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_type_assignments" ADD CONSTRAINT "buyer_type_assignments_buyer_type_id_fkey" FOREIGN KEY ("buyer_type_id") REFERENCES "buyer_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_expenses" ADD CONSTRAINT "car_expenses_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_items" ADD CONSTRAINT "recovery_items_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_transactions" ADD CONSTRAINT "recovery_transactions_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_transactions" ADD CONSTRAINT "recovery_transactions_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Business integrity constraints not expressible in the Prisma schema.
ALTER TABLE "cars"
  ADD CONSTRAINT "cars_purchase_price_positive" CHECK ("purchase_price" > 0),
  ADD CONSTRAINT "cars_year_sensible" CHECK ("year" IS NULL OR "year" BETWEEN 1900 AND 2100),
  ADD CONSTRAINT "cars_other_condition_described" CHECK ("condition" <> 'OTHER' OR NULLIF(BTRIM("condition_other"), '') IS NOT NULL),
  ADD CONSTRAINT "cars_completion_state_consistent" CHECK (
    ("status" = 'COMPLETED' AND "completion_date" IS NOT NULL)
    OR ("status" <> 'COMPLETED' AND "completion_date" IS NULL)
  );

ALTER TABLE "car_expenses"
  ADD CONSTRAINT "car_expenses_amount_positive" CHECK ("amount" > 0),
  ADD CONSTRAINT "car_expenses_void_reason_required" CHECK ("status" <> 'VOIDED' OR NULLIF(BTRIM("void_reason"), '') IS NOT NULL);

ALTER TABLE "recovery_transactions"
  ADD CONSTRAINT "recovery_transactions_amount_positive" CHECK ("amount" > 0),
  ADD CONSTRAINT "recovery_transactions_mode_consistent" CHECK (
    ("mode" = 'WHOLE_CAR' AND "item_type" IS NULL)
    OR ("mode" = 'ITEM' AND "item_type" IS NOT NULL)
  ),
  ADD CONSTRAINT "recovery_transactions_void_reason_required" CHECK ("status" <> 'VOIDED' OR NULLIF(BTRIM("void_reason"), '') IS NOT NULL);

ALTER TABLE "business_expenses"
  ADD CONSTRAINT "business_expenses_amount_positive" CHECK ("amount" > 0),
  ADD CONSTRAINT "business_expenses_void_reason_required" CHECK ("status" <> 'VOIDED' OR NULLIF(BTRIM("void_reason"), '') IS NOT NULL);

ALTER TABLE "cash_transactions"
  ADD CONSTRAINT "cash_transactions_amount_positive" CHECK ("amount" > 0),
  ADD CONSTRAINT "cash_transactions_void_reason_required" CHECK ("status" <> 'VOIDED' OR NULLIF(BTRIM("void_reason"), '') IS NOT NULL);

ALTER TABLE "attachments"
  ADD CONSTRAINT "attachments_size_positive" CHECK ("size_bytes" > 0);

ALTER TABLE "monthly_snapshots"
  ADD CONSTRAINT "monthly_snapshots_month_valid" CHECK ("month" BETWEEN 1 AND 12),
  ADD CONSTRAINT "monthly_snapshots_stock_count_nonnegative" CHECK ("closing_stock_cars" >= 0);

-- Canonical per-car totals. Active cars intentionally expose no realized profit.
CREATE VIEW "car_financial_summary" AS
SELECT
  c."id" AS "car_id",
  c."car_number",
  c."status",
  c."purchase_price",
  COALESCE(e."total_expenses", 0::numeric) AS "total_car_expenses",
  c."purchase_price" + COALESCE(e."total_expenses", 0::numeric) AS "total_investment",
  COALESCE(r."total_recovery", 0::numeric) AS "total_recovery",
  CASE
    WHEN c."status" = 'COMPLETED'
      THEN COALESCE(r."total_recovery", 0::numeric)
           - c."purchase_price"
           - COALESCE(e."total_expenses", 0::numeric)
    ELSE NULL
  END AS "realized_car_profit"
FROM "cars" c
LEFT JOIN LATERAL (
  SELECT SUM(ce."amount") AS "total_expenses"
  FROM "car_expenses" ce
  WHERE ce."car_id" = c."id" AND ce."status" = 'ACTIVE'
) e ON true
LEFT JOIN LATERAL (
  SELECT SUM(rt."amount") AS "total_recovery"
  FROM "recovery_transactions" rt
  WHERE rt."car_id" = c."id" AND rt."status" = 'ACTIVE'
) r ON true
WHERE c."status" <> 'VOIDED';

CREATE VIEW "current_stock_report" AS
SELECT
  cfs.*,
  c."purchase_date",
  c."brand",
  c."model",
  c."year",
  c."condition"
FROM "car_financial_summary" cfs
JOIN "cars" c ON c."id" = cfs."car_id"
WHERE cfs."status" IN ('IN_STOCK', 'PARTIALLY_RECOVERED');

CREATE VIEW "cash_balance_report" AS
SELECT
  COALESCE(SUM(
    CASE
      WHEN "direction" = 'IN' THEN "amount"
      WHEN "direction" = 'OUT' THEN -"amount"
    END
  ), 0::numeric) AS "net_cash_movement"
FROM "cash_transactions"
WHERE "status" = 'ACTIVE';

