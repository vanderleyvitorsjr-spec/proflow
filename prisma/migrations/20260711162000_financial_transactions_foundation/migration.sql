-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PLANNED', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'RENEGOTIATED', 'CANCELED', 'REVERSED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'BOLETO', 'CHECK', 'PAYMENT_LINK', 'OTHER');

-- CreateTable
CREATE TABLE "transacoes_financeiras" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "financialCategoryId" TEXT NOT NULL,
    "financialAccountId" TEXT NOT NULL,
    "clientId" TEXT,
    "serviceOrderId" TEXT,
    "supplierId" TEXT,
    "createdById" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "paymentMethod" "PaymentMethod",
    "competenceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    CONSTRAINT "transacoes_financeiras_pkey" PRIMARY KEY ("id")
);

-- Create foreign keys
ALTER TABLE "transacoes_financeiras"
  ADD CONSTRAINT "transacoes_financeiras_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "empresas"("id");

ALTER TABLE "transacoes_financeiras"
  ADD CONSTRAINT "transacoes_financeiras_financialCategoryId_fkey"
  FOREIGN KEY ("financialCategoryId") REFERENCES "categorias_financeiras"("id");

ALTER TABLE "transacoes_financeiras"
  ADD CONSTRAINT "transacoes_financeiras_financialAccountId_fkey"
  FOREIGN KEY ("financialAccountId") REFERENCES "contas_financeiras"("id");

ALTER TABLE "transacoes_financeiras"
  ADD CONSTRAINT "transacoes_financeiras_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clientes"("id");

ALTER TABLE "transacoes_financeiras"
  ADD CONSTRAINT "transacoes_financeiras_serviceOrderId_fkey"
  FOREIGN KEY ("serviceOrderId") REFERENCES "ordens_servico"("id");

ALTER TABLE "transacoes_financeiras"
  ADD CONSTRAINT "transacoes_financeiras_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "fornecedores"("id");

ALTER TABLE "transacoes_financeiras"
  ADD CONSTRAINT "transacoes_financeiras_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "usuarios"("id");

-- Create indexes
CREATE INDEX "transacoes_financeiras_companyId_financialCategoryId_idx" ON "transacoes_financeiras" ("companyId", "financialCategoryId");
CREATE INDEX "transacoes_financeiras_companyId_financialAccountId_idx" ON "transacoes_financeiras" ("companyId", "financialAccountId");
CREATE INDEX "transacoes_financeiras_companyId_clientId_idx" ON "transacoes_financeiras" ("companyId", "clientId");
CREATE INDEX "transacoes_financeiras_companyId_serviceOrderId_idx" ON "transacoes_financeiras" ("companyId", "serviceOrderId");
CREATE INDEX "transacoes_financeiras_companyId_supplierId_idx" ON "transacoes_financeiras" ("companyId", "supplierId");
CREATE INDEX "transacoes_financeiras_companyId_transactionType_idx" ON "transacoes_financeiras" ("companyId", "transactionType");
CREATE INDEX "transacoes_financeiras_companyId_status_idx" ON "transacoes_financeiras" ("companyId", "status");
CREATE INDEX "transacoes_financeiras_companyId_competenceDate_idx" ON "transacoes_financeiras" ("companyId", "competenceDate");
CREATE INDEX "transacoes_financeiras_companyId_dueDate_idx" ON "transacoes_financeiras" ("companyId", "dueDate");
CREATE INDEX "transacoes_financeiras_companyId_paidAt_idx" ON "transacoes_financeiras" ("companyId", "paidAt");
CREATE INDEX "transacoes_financeiras_companyId_deletedAt_idx" ON "transacoes_financeiras" ("companyId", "deletedAt");
