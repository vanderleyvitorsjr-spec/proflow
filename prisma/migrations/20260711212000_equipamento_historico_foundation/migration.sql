-- Create enum EquipmentHistoryEventType and table for equipment service history
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipmenthistoryeventtype') THEN
    CREATE TYPE "EquipmentHistoryEventType" AS ENUM (
      'INSTALLATION', 'PREVENTIVE_MAINTENANCE', 'CORRECTIVE_MAINTENANCE', 'CLEANING', 'INSPECTION', 'DIAGNOSIS',
      'PART_REPLACEMENT', 'REFRIGERANT_CHARGE', 'ELECTRICAL_REPAIR', 'CALIBRATION', 'WARRANTY_SERVICE', 'REMOVAL',
      'REPLACEMENT', 'STATUS_CHANGE', 'OTHER'
    );
  END IF;
END$$;

-- Create table
CREATE TABLE IF NOT EXISTS "historicos_equipamentos_instalados" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "installedEquipmentId" TEXT NOT NULL,
  "serviceOrderId" TEXT,
  "technicianUserId" TEXT,
  "eventType" "EquipmentHistoryEventType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "serviceDate" TIMESTAMP(3) NOT NULL,
  "operatingHours" DECIMAL(12,2),
  "odometerReading" DECIMAL(12,2),
  "previousStatus" TEXT,
  "resultingStatus" TEXT,
  "diagnosis" TEXT,
  "solution" TEXT,
  "recommendations" TEXT,
  "measurements" JSONB,
  "partsReplaced" TEXT,
  "refrigerantAdded" DECIMAL(12,2),
  "refrigerantType" TEXT,
  "pressureLowSide" DECIMAL(8,2),
  "pressureHighSide" DECIMAL(8,2),
  "inputVoltage" DECIMAL(8,2),
  "currentDraw" DECIMAL(8,2),
  "temperatureBefore" DECIMAL(6,2),
  "temperatureAfter" DECIMAL(6,2),
  "warrantyUntil" TIMESTAMP(3),
  "nextRecommendedServiceDate" TIMESTAMP(3),
  "customerSignatureName" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "historicos_equipamentos_instalados_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'historicos_equipamentos_instalados_companyId_fkey') THEN
    ALTER TABLE "historicos_equipamentos_instalados"
      ADD CONSTRAINT "historicos_equipamentos_instalados_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "empresas"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'historicos_equipamentos_instalados_installedEquipmentId_fkey') THEN
    ALTER TABLE "historicos_equipamentos_instalados"
      ADD CONSTRAINT "historicos_equipamentos_instalados_installedEquipmentId_fkey"
      FOREIGN KEY ("installedEquipmentId") REFERENCES "equipamentos_instalados"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'historicos_equipamentos_instalados_serviceOrderId_fkey') THEN
    ALTER TABLE "historicos_equipamentos_instalados"
      ADD CONSTRAINT "historicos_equipamentos_instalados_serviceOrderId_fkey"
      FOREIGN KEY ("serviceOrderId") REFERENCES "ordens_servico"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'historicos_equipamentos_instalados_technicianUserId_fkey') THEN
    ALTER TABLE "historicos_equipamentos_instalados"
      ADD CONSTRAINT "historicos_equipamentos_instalados_technicianUserId_fkey"
      FOREIGN KEY ("technicianUserId") REFERENCES "usuarios"("id");
  END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS "historicos_equipamentos_instalados_companyId_installedEquipmentId_idx" ON "historicos_equipamentos_instalados" ("companyId", "installedEquipmentId");
CREATE INDEX IF NOT EXISTS "historicos_equipamentos_instalados_companyId_serviceDate_idx" ON "historicos_equipamentos_instalados" ("companyId", "serviceDate");
CREATE INDEX IF NOT EXISTS "historicos_equipamentos_instalados_companyId_eventType_idx" ON "historicos_equipamentos_instalados" ("companyId", "eventType");
CREATE INDEX IF NOT EXISTS "historicos_equipamentos_instalados_companyId_serviceOrderId_idx" ON "historicos_equipamentos_instalados" ("companyId", "serviceOrderId");
CREATE INDEX IF NOT EXISTS "historicos_equipamentos_instalados_companyId_technicianUserId_idx" ON "historicos_equipamentos_instalados" ("companyId", "technicianUserId");
CREATE INDEX IF NOT EXISTS "historicos_equipamentos_instalados_companyId_nextRecommendedServiceDate_idx" ON "historicos_equipamentos_instalados" ("companyId", "nextRecommendedServiceDate");
CREATE INDEX IF NOT EXISTS "historicos_equipamentos_instalados_companyId_deletedAt_idx" ON "historicos_equipamentos_instalados" ("companyId", "deletedAt");
