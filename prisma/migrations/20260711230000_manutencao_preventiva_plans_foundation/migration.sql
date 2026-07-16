-- Migration: Add MaintenanceFrequencyType enum and extend manutencoes_preventivas

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenancefrequencytype') THEN
        CREATE TYPE "MaintenanceFrequencyType" AS ENUM ('DAYS','WEEKS','MONTHS','YEARS','OPERATING_HOURS','CUSTOM');
    END IF;
END$$;

ALTER TABLE "manutencoes_preventivas"
    ADD COLUMN IF NOT EXISTS "frequencyType" "MaintenanceFrequencyType";

ALTER TABLE "manutencoes_preventivas"
    ADD COLUMN IF NOT EXISTS "frequencyInterval" integer;

ALTER TABLE "manutencoes_preventivas"
    ADD COLUMN IF NOT EXISTS "startDate" timestamp with time zone;

ALTER TABLE "manutencoes_preventivas"
    ADD COLUMN IF NOT EXISTS "nextServiceDate" timestamp with time zone;

ALTER TABLE "manutencoes_preventivas"
    ADD COLUMN IF NOT EXISTS "lastServiceDate" timestamp with time zone;

ALTER TABLE "manutencoes_preventivas"
    ADD COLUMN IF NOT EXISTS "description" text;

ALTER TABLE "manutencoes_preventivas"
    ADD COLUMN IF NOT EXISTS "estimatedDurationMinutes" integer;

ALTER TABLE "manutencoes_preventivas"
    ADD COLUMN IF NOT EXISTS "estimatedTechnicians" integer;

ALTER TABLE "manutencoes_preventivas"
    ADD COLUMN IF NOT EXISTS "estimatedCost" numeric(12,2);

ALTER TABLE "manutencoes_preventivas"
    ADD COLUMN IF NOT EXISTS "isActive" boolean DEFAULT true;

ALTER TABLE "manutencoes_preventivas"
    ADD COLUMN IF NOT EXISTS "autoCreateServiceOrder" boolean DEFAULT false;

ALTER TABLE "manutencoes_preventivas"
    ADD COLUMN IF NOT EXISTS "advanceNoticeDays" integer;

ALTER TABLE "manutencoes_preventivas"
    ADD COLUMN IF NOT EXISTS "notes" text;

-- Indexes
CREATE INDEX IF NOT EXISTS "manutencoes_preventivas_companyId_installedEquipmentId_idx" ON "manutencoes_preventivas" ("companyId","installedEquipmentId");
CREATE INDEX IF NOT EXISTS "manutencoes_preventivas_companyId_nextServiceDate_idx" ON "manutencoes_preventivas" ("companyId","nextServiceDate");
CREATE INDEX IF NOT EXISTS "manutencoes_preventivas_companyId_isActive_idx" ON "manutencoes_preventivas" ("companyId","isActive");
CREATE INDEX IF NOT EXISTS "manutencoes_preventivas_companyId_contractId_idx" ON "manutencoes_preventivas" ("companyId","contractId");

-- Ensure deletedAt index already exists in prior migrations; if not, create safely
CREATE INDEX IF NOT EXISTS "manutencoes_preventivas_deletedAt_idx" ON "manutencoes_preventivas" ("deletedAt");
