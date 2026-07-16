-- Add optional financial transaction, financial account, posting and status fields to contas_receber

-- Ensure ReceivableStatus enum exists for contas_receber.status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'receivablestatus') THEN
    CREATE TYPE "ReceivableStatus" AS ENUM ('PLANNED', 'PENDING', 'PARTIALLY_RECEIVED', 'RECEIVED', 'OVERDUE', 'RENEGOTIATED', 'CANCELED', 'REVERSED');
  END IF;
END$$;

ALTER TABLE "contas_receber"
  ADD COLUMN IF NOT EXISTS "financialTransactionId" TEXT;

ALTER TABLE "contas_receber"
  ADD COLUMN IF NOT EXISTS "financialAccountId" TEXT;

ALTER TABLE "contas_receber"
  ADD COLUMN IF NOT EXISTS "createdById" TEXT;

ALTER TABLE "contas_receber"
  ADD COLUMN IF NOT EXISTS "grossAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

ALTER TABLE "contas_receber"
  ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

ALTER TABLE "contas_receber"
  ADD COLUMN IF NOT EXISTS "interestAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

ALTER TABLE "contas_receber"
  ADD COLUMN IF NOT EXISTS "penaltyAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

ALTER TABLE "contas_receber"
  ADD COLUMN IF NOT EXISTS "netAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

ALTER TABLE "contas_receber"
  ADD COLUMN IF NOT EXISTS "installmentNumber" INTEGER;

ALTER TABLE "contas_receber"
  ADD COLUMN IF NOT EXISTS "installmentCount" INTEGER;

ALTER TABLE "contas_receber"
  ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;

ALTER TABLE "contas_receber"
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PENDING';

ALTER TABLE "contas_receber"
  ADD CONSTRAINT IF NOT EXISTS "contas_receber_financialTransactionId_fkey"
  FOREIGN KEY ("financialTransactionId") REFERENCES "transacoes_financeiras"("id");

ALTER TABLE "contas_receber"
  ADD CONSTRAINT IF NOT EXISTS "contas_receber_financialAccountId_fkey"
  FOREIGN KEY ("financialAccountId") REFERENCES "contas_financeiras"("id");

ALTER TABLE "contas_receber"
  ADD CONSTRAINT IF NOT EXISTS "contas_receber_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "usuarios"("id");

CREATE INDEX IF NOT EXISTS "contas_receber_companyId_financialTransactionId_idx" ON "contas_receber" ("companyId", "financialTransactionId");
CREATE INDEX IF NOT EXISTS "contas_receber_companyId_financialAccountId_idx" ON "contas_receber" ("companyId", "financialAccountId");
CREATE INDEX IF NOT EXISTS "contas_receber_companyId_status_idx" ON "contas_receber" ("companyId", "status");
CREATE INDEX IF NOT EXISTS "contas_receber_companyId_serviceOrderId_idx" ON "contas_receber" ("companyId", "serviceOrderId");
CREATE INDEX IF NOT EXISTS "contas_receber_companyId_deletedAt_idx" ON "contas_receber" ("companyId", "deletedAt");
