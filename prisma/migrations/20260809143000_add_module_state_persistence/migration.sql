CREATE TABLE "module_states" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "module_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "module_states_companyId_module_key" ON "module_states"("companyId", "module");
CREATE INDEX "module_states_companyId_idx" ON "module_states"("companyId");
ALTER TABLE "module_states" ADD CONSTRAINT "module_states_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
