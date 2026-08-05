-- Add optional financial transaction, financial account, posting and status fields to contas_receber
-- This migration is safe to reapply after a partially failed attempt.

-- Ensure ReceivableStatus enum exists with the exact quoted PostgreSQL name.
DO $$
BEGIN
  IF to_regtype('"ReceivableStatus"') IS NULL THEN
    CREATE TYPE "ReceivableStatus" AS ENUM (
      'PLANNED',
      'PENDING',
      'PARTIALLY_RECEIVED',
      'RECEIVED',
      'OVERDUE',
      'RENEGOTIATED',
      'CANCELED',
      'REVERSED'
    );
  END IF;
END
$$;

ALTER TABLE "contas_receber"
  ADD COLUMN IF NOT EXISTS "financialTransactionId" TEXT,
  ADD COLUMN IF NOT EXISTS "serviceOrderId" TEXT,
  ADD COLUMN IF NOT EXISTS "contractId" TEXT,
  ADD COLUMN IF NOT EXISTS "financialAccountId" TEXT,
  ADD COLUMN IF NOT EXISTS "createdById" TEXT,
  ADD COLUMN IF NOT EXISTS "grossAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "interestAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "penaltyAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "netAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "installmentNumber" INTEGER,
  ADD COLUMN IF NOT EXISTS "installmentCount" INTEGER,
  ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod",
  ADD COLUMN IF NOT EXISTS "receivedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "status" "ReceivableStatus" NOT NULL DEFAULT 'PENDING';

-- Repair columns created as TEXT by a previous partial attempt.
ALTER TABLE "contas_receber"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ReceivableStatus"
    USING ("status"::text::"ReceivableStatus"),
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

ALTER TABLE "contas_receber"
  ALTER COLUMN "paymentMethod" TYPE "PaymentMethod"
    USING (
      CASE
        WHEN "paymentMethod" IS NULL OR btrim("paymentMethod"::text) = '' THEN NULL
        ELSE "paymentMethod"::text::"PaymentMethod"
      END
    );

-- Add foreign keys only when they are missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contas_receber_financialTransactionId_fkey'
      AND conrelid = 'public.contas_receber'::regclass
  ) THEN
    ALTER TABLE "contas_receber"
      ADD CONSTRAINT "contas_receber_financialTransactionId_fkey"
      FOREIGN KEY ("financialTransactionId")
      REFERENCES "transacoes_financeiras"("id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contas_receber_serviceOrderId_fkey'
      AND conrelid = 'public.contas_receber'::regclass
  ) THEN
    ALTER TABLE "contas_receber"
      ADD CONSTRAINT "contas_receber_serviceOrderId_fkey"
      FOREIGN KEY ("serviceOrderId")
      REFERENCES "ordens_servico"("id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contas_receber_contractId_fkey'
      AND conrelid = 'public.contas_receber'::regclass
  ) THEN
    ALTER TABLE "contas_receber"
      ADD CONSTRAINT "contas_receber_contractId_fkey"
      FOREIGN KEY ("contractId")
      REFERENCES "contratos"("id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contas_receber_financialAccountId_fkey'
      AND conrelid = 'public.contas_receber'::regclass
  ) THEN
    ALTER TABLE "contas_receber"
      ADD CONSTRAINT "contas_receber_financialAccountId_fkey"
      FOREIGN KEY ("financialAccountId")
      REFERENCES "contas_financeiras"("id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contas_receber_createdById_fkey'
      AND conrelid = 'public.contas_receber'::regclass
  ) THEN
    ALTER TABLE "contas_receber"
      ADD CONSTRAINT "contas_receber_createdById_fkey"
      FOREIGN KEY ("createdById")
      REFERENCES "usuarios"("id");
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS
  "contas_receber_companyId_financialTransactionId_idx"
ON "contas_receber" ("companyId", "financialTransactionId");

CREATE INDEX IF NOT EXISTS
  "contas_receber_companyId_financialAccountId_idx"
ON "contas_receber" ("companyId", "financialAccountId");

CREATE INDEX IF NOT EXISTS
  "contas_receber_companyId_status_idx"
ON "contas_receber" ("companyId", "status");

CREATE INDEX IF NOT EXISTS
  "contas_receber_companyId_serviceOrderId_idx"
ON "contas_receber" ("companyId", "serviceOrderId");

CREATE INDEX IF NOT EXISTS
  "contas_receber_companyId_contractId_idx"
ON "contas_receber" ("companyId", "contractId");

CREATE INDEX IF NOT EXISTS
  "contas_receber_companyId_receivedAt_idx"
ON "contas_receber" ("companyId", "receivedAt");

CREATE INDEX IF NOT EXISTS
  "contas_receber_companyId_deletedAt_idx"
ON "contas_receber" ("companyId", "deletedAt");
