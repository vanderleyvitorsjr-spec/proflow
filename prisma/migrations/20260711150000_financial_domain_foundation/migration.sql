-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'INVESTMENT');

-- CreateEnum
CREATE TYPE "ExpenseClassification" AS ENUM ('FIXED', 'VARIABLE', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CASH', 'CHECKING_ACCOUNT', 'DIGITAL_ACCOUNT', 'CREDIT_CARD', 'RESERVE', 'INVESTMENT', 'OTHER');

-- CreateTable
CREATE TABLE "categorias_financeiras" (
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

-- CreateIndex
CREATE UNIQUE INDEX "categorias_financeiras_companyId_name_transactionType_key" ON "categorias_financeiras" ("companyId", "name", "transactionType");

-- CreateIndex
CREATE INDEX "categorias_financeiras_companyId_transactionType_idx" ON "categorias_financeiras" ("companyId", "transactionType");

-- CreateIndex
CREATE INDEX "categorias_financeiras_companyId_expenseClassification_idx" ON "categorias_financeiras" ("companyId", "expenseClassification");

-- CreateIndex
CREATE INDEX "categorias_financeiras_companyId_isDefault_idx" ON "categorias_financeiras" ("companyId", "isDefault");

-- CreateIndex
CREATE INDEX "categorias_financeiras_deletedAt_idx" ON "categorias_financeiras" ("deletedAt");

-- CreateTable
CREATE TABLE "contas_financeiras" (
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

-- CreateIndex
CREATE INDEX "contas_financeiras_companyId_accountType_idx" ON "contas_financeiras" ("companyId", "accountType");

-- CreateIndex
CREATE INDEX "contas_financeiras_companyId_isDefault_idx" ON "contas_financeiras" ("companyId", "isDefault");

-- CreateIndex
CREATE INDEX "contas_financeiras_deletedAt_idx" ON "contas_financeiras" ("deletedAt");
