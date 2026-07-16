-- Ensure enums exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transactiontype') THEN
    CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'INVESTMENT');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expenseclassification') THEN
    CREATE TYPE "ExpenseClassification" AS ENUM ('FIXED', 'VARIABLE', 'NOT_APPLICABLE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'accounttype') THEN
    CREATE TYPE "AccountType" AS ENUM ('CASH', 'CHECKING_ACCOUNT', 'DIGITAL_ACCOUNT', 'CREDIT_CARD', 'RESERVE', 'INVESTMENT', 'OTHER');
  END IF;
END$$;

-- Create table categorias_financeiras if missing
CREATE TABLE IF NOT EXISTS "categorias_financeiras" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "transactionType" "TransactionType" NOT NULL,
    "expenseClassification" "ExpenseClassification" NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "categorias_financeiras_pkey" PRIMARY KEY ("id")
);

-- Add foreign key to empresa for categorias_financeiras
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categorias_financeiras_companyId_fkey'
  ) THEN
    ALTER TABLE "categorias_financeiras"
      ADD CONSTRAINT "categorias_financeiras_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "empresas"("id");
  END IF;
END$$;

-- Create unique constraint for categories by company, name and type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categorias_financeiras_companyId_name_transactionType_key'
  ) THEN
    ALTER TABLE "categorias_financeiras"
      ADD CONSTRAINT "categorias_financeiras_companyId_name_transactionType_key"
      UNIQUE ("companyId", "name", "transactionType");
  END IF;
END$$;

-- Create indexes for categorias_financeiras
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'categorias_financeiras_companyId_transactionType_idx'
  ) THEN
    CREATE INDEX "categorias_financeiras_companyId_transactionType_idx" ON "categorias_financeiras" ("companyId", "transactionType");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'categorias_financeiras_companyId_expenseClassification_idx'
  ) THEN
    CREATE INDEX "categorias_financeiras_companyId_expenseClassification_idx" ON "categorias_financeiras" ("companyId", "expenseClassification");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'categorias_financeiras_companyId_isDefault_idx'
  ) THEN
    CREATE INDEX "categorias_financeiras_companyId_isDefault_idx" ON "categorias_financeiras" ("companyId", "isDefault");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'categorias_financeiras_companyId_deletedAt_idx'
  ) THEN
    CREATE INDEX "categorias_financeiras_companyId_deletedAt_idx" ON "categorias_financeiras" ("companyId", "deletedAt");
  END IF;
END$$;

-- Create table contas_financeiras if missing
CREATE TABLE IF NOT EXISTS "contas_financeiras" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "bankName" TEXT,
    "initialBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "initialBalanceDate" TIMESTAMP(3) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "contas_financeiras_pkey" PRIMARY KEY ("id")
);

-- Add foreign key to empresa for contas_financeiras
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contas_financeiras_companyId_fkey'
  ) THEN
    ALTER TABLE "contas_financeiras"
      ADD CONSTRAINT "contas_financeiras_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "empresas"("id");
  END IF;
END$$;

-- Create indexes for contas_financeiras
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'contas_financeiras_companyId_accountType_idx'
  ) THEN
    CREATE INDEX "contas_financeiras_companyId_accountType_idx" ON "contas_financeiras" ("companyId", "accountType");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'contas_financeiras_companyId_isDefault_idx'
  ) THEN
    CREATE INDEX "contas_financeiras_companyId_isDefault_idx" ON "contas_financeiras" ("companyId", "isDefault");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'contas_financeiras_companyId_deletedAt_idx'
  ) THEN
    CREATE INDEX "contas_financeiras_companyId_deletedAt_idx" ON "contas_financeiras" ("companyId", "deletedAt");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'contas_financeiras_companyId_default_unique'
  ) THEN
    CREATE UNIQUE INDEX "contas_financeiras_companyId_default_unique" ON "contas_financeiras" ("companyId") WHERE "isDefault" = true AND "deletedAt" IS NULL;
  END IF;
END$$;
