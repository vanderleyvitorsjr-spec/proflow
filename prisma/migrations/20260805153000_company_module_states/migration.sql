CREATE TABLE IF NOT EXISTS "company_module_states" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "payload" JSONB NOT NULL,
  "backup" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "company_module_states_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "company_module_states_companyId_module_key" ON "company_module_states"("companyId", "module");
CREATE INDEX IF NOT EXISTS "company_module_states_companyId_updatedAt_idx" ON "company_module_states"("companyId", "updatedAt");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_module_states_companyId_fkey') THEN
    ALTER TABLE "company_module_states" ADD CONSTRAINT "company_module_states_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "company_stored_files" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "uploadedById" TEXT,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "category" TEXT,
  "name" TEXT NOT NULL,
  "originalName" TEXT,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" BIGINT,
  "bucket" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "visibility" "FileVisibility" NOT NULL DEFAULT 'COMPANY',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "company_stored_files_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "company_stored_files_companyId_entityType_entityId_idx" ON "company_stored_files"("companyId", "entityType", "entityId");
CREATE INDEX IF NOT EXISTS "company_stored_files_companyId_category_idx" ON "company_stored_files"("companyId", "category");
CREATE INDEX IF NOT EXISTS "company_stored_files_companyId_createdAt_idx" ON "company_stored_files"("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "company_stored_files_companyId_deletedAt_idx" ON "company_stored_files"("companyId", "deletedAt");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_stored_files_companyId_fkey') THEN
    ALTER TABLE "company_stored_files" ADD CONSTRAINT "company_stored_files_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_stored_files_uploadedById_fkey') THEN
    ALTER TABLE "company_stored_files" ADD CONSTRAINT "company_stored_files_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
