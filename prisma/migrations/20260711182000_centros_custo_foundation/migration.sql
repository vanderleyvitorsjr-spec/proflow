-- Add parentId, color, icon and indexes to centros_custo (Cost Centers foundation)

ALTER TABLE "centros_custo"
  ADD COLUMN IF NOT EXISTS "parentId" TEXT;

ALTER TABLE "centros_custo"
  ADD COLUMN IF NOT EXISTS "color" TEXT;

ALTER TABLE "centros_custo"
  ADD COLUMN IF NOT EXISTS "icon" TEXT;

-- Add self-referencing FK for parentId
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'centros_custo_parentId_fkey'
  ) THEN
    ALTER TABLE "centros_custo"
      ADD CONSTRAINT "centros_custo_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "centros_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;

-- Add unique index for (companyId, name) ignoring soft-deleted rows
CREATE UNIQUE INDEX IF NOT EXISTS "centros_custo_companyId_name_unique" ON "centros_custo" ("companyId", "name") WHERE "deletedAt" IS NULL;

-- Ensure indexes for queries by tenant and hierarchy
CREATE INDEX IF NOT EXISTS "centros_custo_companyId_idx" ON "centros_custo" ("companyId");
CREATE INDEX IF NOT EXISTS "centros_custo_companyId_parentId_idx" ON "centros_custo" ("companyId", "parentId");
CREATE INDEX IF NOT EXISTS "centros_custo_companyId_code_idx" ON "centros_custo" ("companyId", "code");
CREATE INDEX IF NOT EXISTS "centros_custo_companyId_name_idx" ON "centros_custo" ("companyId", "name");
CREATE INDEX IF NOT EXISTS "centros_custo_deletedAt_idx" ON "centros_custo" ("companyId", "deletedAt");
