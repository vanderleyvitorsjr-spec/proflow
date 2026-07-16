-- Create enums for assets
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assetstatus') THEN
    CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'IN_MAINTENANCE', 'LOST', 'SOLD', 'DISCARDED', 'INACTIVE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assetcondition') THEN
    CREATE TYPE "AssetCondition" AS ENUM ('NEW', 'EXCELLENT', 'GOOD', 'REGULAR', 'POOR', 'DAMAGED');
  END IF;
END$$;

-- Create table categorias_patrimoniais
CREATE TABLE IF NOT EXISTS "categorias_patrimoniais" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "color" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "categorias_patrimoniais_pkey" PRIMARY KEY ("id")
);

-- Foreign key to empresas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categorias_patrimoniais_companyId_fkey'
  ) THEN
    ALTER TABLE "categorias_patrimoniais"
      ADD CONSTRAINT "categorias_patrimoniais_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "empresas"("id");
  END IF;
END$$;

-- Indexes for categorias_patrimoniais
CREATE UNIQUE INDEX IF NOT EXISTS "categorias_patrimoniais_companyId_name_key" ON "categorias_patrimoniais" ("companyId", "name") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "categorias_patrimoniais_companyId_idx" ON "categorias_patrimoniais" ("companyId");
CREATE INDEX IF NOT EXISTS "categorias_patrimoniais_deletedAt_idx" ON "categorias_patrimoniais" ("companyId", "deletedAt");

-- Create table patrimonios
CREATE TABLE IF NOT EXISTS "patrimonios" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "categoryId" TEXT,
  "responsibleUserId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "assetCode" TEXT NOT NULL,
  "serialNumber" TEXT,
  "manufacturer" TEXT,
  "model" TEXT,
  "purchaseDate" TIMESTAMP(3),
  "purchaseValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "currentValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "residualValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "estimatedUsefulLifeMonths" INTEGER,
  "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
  "condition" "AssetCondition" NOT NULL DEFAULT 'GOOD',
  "location" TEXT,
  "supplierId" TEXT,
  "invoiceNumber" TEXT,
  "warrantyUntil" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "patrimonios_pkey" PRIMARY KEY ("id")
);

-- Foreign key to empresas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'patrimonios_companyId_fkey'
  ) THEN
    ALTER TABLE "patrimonios"
      ADD CONSTRAINT "patrimonios_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "empresas"("id");
  END IF;
END$$;

-- Indexes for patrimonios
CREATE UNIQUE INDEX IF NOT EXISTS "patrimonios_companyId_assetCode_key" ON "patrimonios" ("companyId", "assetCode") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "patrimonios_companyId_idx" ON "patrimonios" ("companyId");
CREATE INDEX IF NOT EXISTS "patrimonios_companyId_status_idx" ON "patrimonios" ("companyId", "status");
CREATE INDEX IF NOT EXISTS "patrimonios_companyId_categoryId_idx" ON "patrimonios" ("companyId", "categoryId");
CREATE INDEX IF NOT EXISTS "patrimonios_companyId_responsibleUserId_idx" ON "patrimonios" ("companyId", "responsibleUserId");
CREATE INDEX IF NOT EXISTS "patrimonios_companyId_deletedAt_idx" ON "patrimonios" ("companyId", "deletedAt");
