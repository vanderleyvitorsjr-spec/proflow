-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'TECHNICIAN', 'FINANCE', 'SALES', 'VIEWER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'INVITED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('BILLING', 'SERVICE', 'DELIVERY', 'HEADQUARTER', 'OTHER');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "ServiceOrderStatus" AS ENUM ('DRAFT', 'OPEN', 'SCHEDULED', 'IN_PROGRESS', 'WAITING_PARTS', 'WAITING_APPROVAL', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ServiceOrderPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RESERVATION', 'RETURN');

-- CreateEnum
CREATE TYPE "FinancialStatus" AS ENUM ('OPEN', 'PAID', 'OVERDUE', 'CANCELED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "CashFlowType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PreventiveStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'ERROR', 'SUCCESS');

-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('PRIVATE', 'COMPANY', 'PUBLIC');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ToolStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'LOST');

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "tradeSegment" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissoes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT true,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canUpdate" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canExport" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "permissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "type" "ClientType" NOT NULL DEFAULT 'COMPANY',
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enderecos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "clientId" TEXT,
    "type" "AddressType" NOT NULL DEFAULT 'SERVICE',
    "street" TEXT NOT NULL,
    "number" TEXT,
    "complement" TEXT,
    "district" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Brasil',
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "category" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "equipamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos_instalados" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "clientId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "serialNumber" TEXT,
    "assetTag" TEXT,
    "location" TEXT,
    "installedAt" TIMESTAMP(3),
    "warrantyUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,

    CONSTRAINT "equipamentos_instalados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "category" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "plate" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "brand" TEXT,
    "year" INTEGER,
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "mileage" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "veiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ferramentas" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "code" TEXT,
    "status" "ToolStatus" NOT NULL DEFAULT 'AVAILABLE',
    "location" TEXT,
    "lastCheckAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ferramentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoques" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "location" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "estoques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "categoryId" TEXT,
    "supplierId" TEXT,
    "stockId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "costPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "salePrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "quantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "minQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_estoque" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "productId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "userId" TEXT,
    "serviceOrderId" TEXT,
    "type" "StockMovementType" NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "clientId" TEXT NOT NULL,
    "addressId" TEXT,
    "installedEquipmentId" TEXT,
    "responsibleId" TEXT,
    "teamId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "ServiceOrderPriority" NOT NULL DEFAULT 'MEDIUM',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklists" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "serviceOrderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "serviceOrderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "metadata" JSONB,

    CONSTRAINT "fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assinaturas" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "serviceOrderId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerDocument" TEXT,
    "imageUrl" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiais_utilizados" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "serviceOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "materiais_utilizados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "vehicleId" TEXT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "equipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendas" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "clientId" TEXT,
    "serviceOrderId" TEXT,
    "teamId" TEXT,
    "userId" TEXT,
    "vehicleId" TEXT,
    "addressId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "agendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiros" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "clientId" TEXT,
    "serviceOrderId" TEXT,
    "description" TEXT NOT NULL,
    "type" "CashFlowType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "FinancialStatus" NOT NULL DEFAULT 'OPEN',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "financeiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_receber" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "clientId" TEXT,
    "costCenterId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" "FinancialStatus" NOT NULL DEFAULT 'OPEN',
    "invoiceNumber" TEXT,

    CONSTRAINT "contas_receber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_pagar" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "supplierId" TEXT,
    "costCenterId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" "FinancialStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "contas_pagar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fluxos_caixa" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "receivableId" TEXT,
    "payableId" TEXT,
    "costCenterId" TEXT,
    "type" "CashFlowType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fluxos_caixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centros_custo" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "centros_custo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamentos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "clientId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "validUntil" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "orcamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "clientId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "monthlyFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "slaHours" INTEGER,
    "scope" TEXT,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manutencoes_preventivas" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "clientId" TEXT NOT NULL,
    "contractId" TEXT,
    "installedEquipmentId" TEXT,
    "title" TEXT NOT NULL,
    "frequencyDays" INTEGER NOT NULL,
    "nextDueAt" TIMESTAMP(3) NOT NULL,
    "lastDoneAt" TIMESTAMP(3),
    "status" "PreventiveStatus" NOT NULL DEFAULT 'ACTIVE',
    "checklistTemplate" JSONB,

    CONSTRAINT "manutencoes_preventivas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_sistema" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,

    CONSTRAINT "logs_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquivos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT,
    "clientId" TEXT,
    "serviceOrderId" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "visibility" "FileVisibility" NOT NULL DEFAULT 'COMPANY',
    "metadata" JSONB,

    CONSTRAINT "arquivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_empresa" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#2563eb',
    "settings" JSONB,

    CONSTRAINT "configuracoes_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EquipeUsuarios" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EquipeUsuarios_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_EquipeFerramentas" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EquipeFerramentas_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_companyId_key" ON "empresas"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_document_key" ON "empresas"("document");

-- CreateIndex
CREATE INDEX "empresas_name_idx" ON "empresas"("name");

-- CreateIndex
CREATE INDEX "empresas_deletedAt_idx" ON "empresas"("deletedAt");

-- CreateIndex
CREATE INDEX "usuarios_companyId_status_idx" ON "usuarios"("companyId", "status");

-- CreateIndex
CREATE INDEX "usuarios_companyId_role_idx" ON "usuarios"("companyId", "role");

-- CreateIndex
CREATE INDEX "usuarios_deletedAt_idx" ON "usuarios"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_companyId_email_key" ON "usuarios"("companyId", "email");

-- CreateIndex
CREATE INDEX "permissoes_companyId_module_idx" ON "permissoes"("companyId", "module");

-- CreateIndex
CREATE INDEX "permissoes_deletedAt_idx" ON "permissoes"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "permissoes_companyId_userId_module_key" ON "permissoes"("companyId", "userId", "module");

-- CreateIndex
CREATE INDEX "clientes_companyId_name_idx" ON "clientes"("companyId", "name");

-- CreateIndex
CREATE INDEX "clientes_companyId_active_idx" ON "clientes"("companyId", "active");

-- CreateIndex
CREATE INDEX "clientes_deletedAt_idx" ON "clientes"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_companyId_document_key" ON "clientes"("companyId", "document");

-- CreateIndex
CREATE INDEX "enderecos_companyId_clientId_idx" ON "enderecos"("companyId", "clientId");

-- CreateIndex
CREATE INDEX "enderecos_companyId_city_state_idx" ON "enderecos"("companyId", "city", "state");

-- CreateIndex
CREATE INDEX "enderecos_deletedAt_idx" ON "enderecos"("deletedAt");

-- CreateIndex
CREATE INDEX "equipamentos_companyId_name_idx" ON "equipamentos"("companyId", "name");

-- CreateIndex
CREATE INDEX "equipamentos_companyId_category_idx" ON "equipamentos"("companyId", "category");

-- CreateIndex
CREATE INDEX "equipamentos_deletedAt_idx" ON "equipamentos"("deletedAt");

-- CreateIndex
CREATE INDEX "equipamentos_instalados_companyId_clientId_idx" ON "equipamentos_instalados"("companyId", "clientId");

-- CreateIndex
CREATE INDEX "equipamentos_instalados_companyId_equipmentId_idx" ON "equipamentos_instalados"("companyId", "equipmentId");

-- CreateIndex
CREATE INDEX "equipamentos_instalados_deletedAt_idx" ON "equipamentos_instalados"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_instalados_companyId_serialNumber_key" ON "equipamentos_instalados"("companyId", "serialNumber");

-- CreateIndex
CREATE INDEX "fornecedores_companyId_name_idx" ON "fornecedores"("companyId", "name");

-- CreateIndex
CREATE INDEX "fornecedores_deletedAt_idx" ON "fornecedores"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_companyId_document_key" ON "fornecedores"("companyId", "document");

-- CreateIndex
CREATE INDEX "veiculos_companyId_status_idx" ON "veiculos"("companyId", "status");

-- CreateIndex
CREATE INDEX "veiculos_deletedAt_idx" ON "veiculos"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "veiculos_companyId_plate_key" ON "veiculos"("companyId", "plate");

-- CreateIndex
CREATE INDEX "ferramentas_companyId_status_idx" ON "ferramentas"("companyId", "status");

-- CreateIndex
CREATE INDEX "ferramentas_companyId_name_idx" ON "ferramentas"("companyId", "name");

-- CreateIndex
CREATE INDEX "ferramentas_deletedAt_idx" ON "ferramentas"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ferramentas_companyId_code_key" ON "ferramentas"("companyId", "code");

-- CreateIndex
CREATE INDEX "estoques_companyId_name_idx" ON "estoques"("companyId", "name");

-- CreateIndex
CREATE INDEX "estoques_companyId_active_idx" ON "estoques"("companyId", "active");

-- CreateIndex
CREATE INDEX "estoques_deletedAt_idx" ON "estoques"("deletedAt");

-- CreateIndex
CREATE INDEX "categorias_companyId_parentId_idx" ON "categorias"("companyId", "parentId");

-- CreateIndex
CREATE INDEX "categorias_deletedAt_idx" ON "categorias"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_companyId_name_key" ON "categorias"("companyId", "name");

-- CreateIndex
CREATE INDEX "produtos_companyId_name_idx" ON "produtos"("companyId", "name");

-- CreateIndex
CREATE INDEX "produtos_companyId_categoryId_idx" ON "produtos"("companyId", "categoryId");

-- CreateIndex
CREATE INDEX "produtos_companyId_stockId_idx" ON "produtos"("companyId", "stockId");

-- CreateIndex
CREATE INDEX "produtos_deletedAt_idx" ON "produtos"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_companyId_sku_key" ON "produtos"("companyId", "sku");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_companyId_productId_idx" ON "movimentacoes_estoque"("companyId", "productId");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_companyId_stockId_idx" ON "movimentacoes_estoque"("companyId", "stockId");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_companyId_type_idx" ON "movimentacoes_estoque"("companyId", "type");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_companyId_createdAt_idx" ON "movimentacoes_estoque"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_deletedAt_idx" ON "movimentacoes_estoque"("deletedAt");

-- CreateIndex
CREATE INDEX "ordens_servico_companyId_clientId_idx" ON "ordens_servico"("companyId", "clientId");

-- CreateIndex
CREATE INDEX "ordens_servico_companyId_status_idx" ON "ordens_servico"("companyId", "status");

-- CreateIndex
CREATE INDEX "ordens_servico_companyId_priority_idx" ON "ordens_servico"("companyId", "priority");

-- CreateIndex
CREATE INDEX "ordens_servico_companyId_scheduledAt_idx" ON "ordens_servico"("companyId", "scheduledAt");

-- CreateIndex
CREATE INDEX "ordens_servico_deletedAt_idx" ON "ordens_servico"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ordens_servico_companyId_code_key" ON "ordens_servico"("companyId", "code");

-- CreateIndex
CREATE INDEX "checklists_companyId_serviceOrderId_idx" ON "checklists"("companyId", "serviceOrderId");

-- CreateIndex
CREATE INDEX "checklists_companyId_completedAt_idx" ON "checklists"("companyId", "completedAt");

-- CreateIndex
CREATE INDEX "checklists_deletedAt_idx" ON "checklists"("deletedAt");

-- CreateIndex
CREATE INDEX "fotos_companyId_serviceOrderId_idx" ON "fotos"("companyId", "serviceOrderId");

-- CreateIndex
CREATE INDEX "fotos_deletedAt_idx" ON "fotos"("deletedAt");

-- CreateIndex
CREATE INDEX "assinaturas_companyId_serviceOrderId_idx" ON "assinaturas"("companyId", "serviceOrderId");

-- CreateIndex
CREATE INDEX "assinaturas_companyId_signedAt_idx" ON "assinaturas"("companyId", "signedAt");

-- CreateIndex
CREATE INDEX "assinaturas_deletedAt_idx" ON "assinaturas"("deletedAt");

-- CreateIndex
CREATE INDEX "materiais_utilizados_companyId_serviceOrderId_idx" ON "materiais_utilizados"("companyId", "serviceOrderId");

-- CreateIndex
CREATE INDEX "materiais_utilizados_companyId_productId_idx" ON "materiais_utilizados"("companyId", "productId");

-- CreateIndex
CREATE INDEX "materiais_utilizados_deletedAt_idx" ON "materiais_utilizados"("deletedAt");

-- CreateIndex
CREATE INDEX "equipes_companyId_active_idx" ON "equipes"("companyId", "active");

-- CreateIndex
CREATE INDEX "equipes_companyId_vehicleId_idx" ON "equipes"("companyId", "vehicleId");

-- CreateIndex
CREATE INDEX "equipes_deletedAt_idx" ON "equipes"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "equipes_companyId_name_key" ON "equipes"("companyId", "name");

-- CreateIndex
CREATE INDEX "agendas_companyId_startsAt_idx" ON "agendas"("companyId", "startsAt");

-- CreateIndex
CREATE INDEX "agendas_companyId_status_idx" ON "agendas"("companyId", "status");

-- CreateIndex
CREATE INDEX "agendas_companyId_teamId_idx" ON "agendas"("companyId", "teamId");

-- CreateIndex
CREATE INDEX "agendas_companyId_userId_idx" ON "agendas"("companyId", "userId");

-- CreateIndex
CREATE INDEX "agendas_deletedAt_idx" ON "agendas"("deletedAt");

-- CreateIndex
CREATE INDEX "financeiros_companyId_type_idx" ON "financeiros"("companyId", "type");

-- CreateIndex
CREATE INDEX "financeiros_companyId_status_idx" ON "financeiros"("companyId", "status");

-- CreateIndex
CREATE INDEX "financeiros_companyId_dueDate_idx" ON "financeiros"("companyId", "dueDate");

-- CreateIndex
CREATE INDEX "financeiros_deletedAt_idx" ON "financeiros"("deletedAt");

-- CreateIndex
CREATE INDEX "contas_receber_companyId_clientId_idx" ON "contas_receber"("companyId", "clientId");

-- CreateIndex
CREATE INDEX "contas_receber_companyId_status_idx" ON "contas_receber"("companyId", "status");

-- CreateIndex
CREATE INDEX "contas_receber_companyId_dueDate_idx" ON "contas_receber"("companyId", "dueDate");

-- CreateIndex
CREATE INDEX "contas_receber_deletedAt_idx" ON "contas_receber"("deletedAt");

-- CreateIndex
CREATE INDEX "contas_pagar_companyId_supplierId_idx" ON "contas_pagar"("companyId", "supplierId");

-- CreateIndex
CREATE INDEX "contas_pagar_companyId_status_idx" ON "contas_pagar"("companyId", "status");

-- CreateIndex
CREATE INDEX "contas_pagar_companyId_dueDate_idx" ON "contas_pagar"("companyId", "dueDate");

-- CreateIndex
CREATE INDEX "contas_pagar_deletedAt_idx" ON "contas_pagar"("deletedAt");

-- CreateIndex
CREATE INDEX "fluxos_caixa_companyId_type_idx" ON "fluxos_caixa"("companyId", "type");

-- CreateIndex
CREATE INDEX "fluxos_caixa_companyId_occurredAt_idx" ON "fluxos_caixa"("companyId", "occurredAt");

-- CreateIndex
CREATE INDEX "fluxos_caixa_companyId_costCenterId_idx" ON "fluxos_caixa"("companyId", "costCenterId");

-- CreateIndex
CREATE INDEX "fluxos_caixa_deletedAt_idx" ON "fluxos_caixa"("deletedAt");

-- CreateIndex
CREATE INDEX "centros_custo_companyId_name_idx" ON "centros_custo"("companyId", "name");

-- CreateIndex
CREATE INDEX "centros_custo_deletedAt_idx" ON "centros_custo"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "centros_custo_companyId_code_key" ON "centros_custo"("companyId", "code");

-- CreateIndex
CREATE INDEX "orcamentos_companyId_clientId_idx" ON "orcamentos"("companyId", "clientId");

-- CreateIndex
CREATE INDEX "orcamentos_companyId_status_idx" ON "orcamentos"("companyId", "status");

-- CreateIndex
CREATE INDEX "orcamentos_deletedAt_idx" ON "orcamentos"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "orcamentos_companyId_code_key" ON "orcamentos"("companyId", "code");

-- CreateIndex
CREATE INDEX "contratos_companyId_clientId_idx" ON "contratos"("companyId", "clientId");

-- CreateIndex
CREATE INDEX "contratos_companyId_status_idx" ON "contratos"("companyId", "status");

-- CreateIndex
CREATE INDEX "contratos_deletedAt_idx" ON "contratos"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_companyId_code_key" ON "contratos"("companyId", "code");

-- CreateIndex
CREATE INDEX "manutencoes_preventivas_companyId_clientId_idx" ON "manutencoes_preventivas"("companyId", "clientId");

-- CreateIndex
CREATE INDEX "manutencoes_preventivas_companyId_nextDueAt_idx" ON "manutencoes_preventivas"("companyId", "nextDueAt");

-- CreateIndex
CREATE INDEX "manutencoes_preventivas_companyId_status_idx" ON "manutencoes_preventivas"("companyId", "status");

-- CreateIndex
CREATE INDEX "manutencoes_preventivas_deletedAt_idx" ON "manutencoes_preventivas"("deletedAt");

-- CreateIndex
CREATE INDEX "notificacoes_companyId_userId_idx" ON "notificacoes"("companyId", "userId");

-- CreateIndex
CREATE INDEX "notificacoes_companyId_readAt_idx" ON "notificacoes"("companyId", "readAt");

-- CreateIndex
CREATE INDEX "notificacoes_companyId_type_idx" ON "notificacoes"("companyId", "type");

-- CreateIndex
CREATE INDEX "notificacoes_deletedAt_idx" ON "notificacoes"("deletedAt");

-- CreateIndex
CREATE INDEX "logs_sistema_companyId_userId_idx" ON "logs_sistema"("companyId", "userId");

-- CreateIndex
CREATE INDEX "logs_sistema_companyId_entity_entityId_idx" ON "logs_sistema"("companyId", "entity", "entityId");

-- CreateIndex
CREATE INDEX "logs_sistema_companyId_createdAt_idx" ON "logs_sistema"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "logs_sistema_deletedAt_idx" ON "logs_sistema"("deletedAt");

-- CreateIndex
CREATE INDEX "arquivos_companyId_userId_idx" ON "arquivos"("companyId", "userId");

-- CreateIndex
CREATE INDEX "arquivos_companyId_clientId_idx" ON "arquivos"("companyId", "clientId");

-- CreateIndex
CREATE INDEX "arquivos_companyId_serviceOrderId_idx" ON "arquivos"("companyId", "serviceOrderId");

-- CreateIndex
CREATE INDEX "arquivos_companyId_visibility_idx" ON "arquivos"("companyId", "visibility");

-- CreateIndex
CREATE INDEX "arquivos_deletedAt_idx" ON "arquivos"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_empresa_companyId_key" ON "configuracoes_empresa"("companyId");

-- CreateIndex
CREATE INDEX "configuracoes_empresa_deletedAt_idx" ON "configuracoes_empresa"("deletedAt");

-- CreateIndex
CREATE INDEX "_EquipeUsuarios_B_index" ON "_EquipeUsuarios"("B");

-- CreateIndex
CREATE INDEX "_EquipeFerramentas_B_index" ON "_EquipeFerramentas"("B");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissoes" ADD CONSTRAINT "permissoes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissoes" ADD CONSTRAINT "permissoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos_instalados" ADD CONSTRAINT "equipamentos_instalados_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos_instalados" ADD CONSTRAINT "equipamentos_instalados_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos_instalados" ADD CONSTRAINT "equipamentos_instalados_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedores" ADD CONSTRAINT "fornecedores_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferramentas" ADD CONSTRAINT "ferramentas_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoques" ADD CONSTRAINT "estoques_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "estoques"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_productId_fkey" FOREIGN KEY ("productId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "estoques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ordens_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "enderecos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_installedEquipmentId_fkey" FOREIGN KEY ("installedEquipmentId") REFERENCES "equipamentos_instalados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "equipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais_utilizados" ADD CONSTRAINT "materiais_utilizados_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais_utilizados" ADD CONSTRAINT "materiais_utilizados_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais_utilizados" ADD CONSTRAINT "materiais_utilizados_productId_fkey" FOREIGN KEY ("productId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipes" ADD CONSTRAINT "equipes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipes" ADD CONSTRAINT "equipes_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "veiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendas" ADD CONSTRAINT "agendas_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendas" ADD CONSTRAINT "agendas_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendas" ADD CONSTRAINT "agendas_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ordens_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendas" ADD CONSTRAINT "agendas_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "equipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendas" ADD CONSTRAINT "agendas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendas" ADD CONSTRAINT "agendas_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "veiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendas" ADD CONSTRAINT "agendas_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "enderecos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiros" ADD CONSTRAINT "financeiros_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiros" ADD CONSTRAINT "financeiros_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiros" ADD CONSTRAINT "financeiros_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ordens_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_receber" ADD CONSTRAINT "contas_receber_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_receber" ADD CONSTRAINT "contas_receber_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_receber" ADD CONSTRAINT "contas_receber_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "centros_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "centros_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxos_caixa" ADD CONSTRAINT "fluxos_caixa_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxos_caixa" ADD CONSTRAINT "fluxos_caixa_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "contas_receber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxos_caixa" ADD CONSTRAINT "fluxos_caixa_payableId_fkey" FOREIGN KEY ("payableId") REFERENCES "contas_pagar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxos_caixa" ADD CONSTRAINT "fluxos_caixa_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "centros_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centros_custo" ADD CONSTRAINT "centros_custo_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencoes_preventivas" ADD CONSTRAINT "manutencoes_preventivas_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencoes_preventivas" ADD CONSTRAINT "manutencoes_preventivas_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencoes_preventivas" ADD CONSTRAINT "manutencoes_preventivas_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencoes_preventivas" ADD CONSTRAINT "manutencoes_preventivas_installedEquipmentId_fkey" FOREIGN KEY ("installedEquipmentId") REFERENCES "equipamentos_instalados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_sistema" ADD CONSTRAINT "logs_sistema_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_sistema" ADD CONSTRAINT "logs_sistema_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivos" ADD CONSTRAINT "arquivos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivos" ADD CONSTRAINT "arquivos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivos" ADD CONSTRAINT "arquivos_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivos" ADD CONSTRAINT "arquivos_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ordens_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes_empresa" ADD CONSTRAINT "configuracoes_empresa_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipeUsuarios" ADD CONSTRAINT "_EquipeUsuarios_A_fkey" FOREIGN KEY ("A") REFERENCES "equipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipeUsuarios" ADD CONSTRAINT "_EquipeUsuarios_B_fkey" FOREIGN KEY ("B") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipeFerramentas" ADD CONSTRAINT "_EquipeFerramentas_A_fkey" FOREIGN KEY ("A") REFERENCES "equipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipeFerramentas" ADD CONSTRAINT "_EquipeFerramentas_B_fkey" FOREIGN KEY ("B") REFERENCES "ferramentas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
