-- Migration: Add service order checklists and checklist execution items

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'serviceordercheckliststatus') THEN
        CREATE TYPE "ServiceOrderChecklistStatus" AS ENUM ('PENDING','IN_PROGRESS','COMPLETED','CANCELED');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS "checklists_ordem_servico" (
    "id" varchar(191) PRIMARY KEY,
    "companyId" varchar(191) NOT NULL,
    "serviceOrderId" varchar(191) NOT NULL,
    "checklistTemplateId" varchar(191) NOT NULL,
    "checklistTemplateVersion" integer NOT NULL,
    "assignedToUserId" varchar(191),
    "startedAt" timestamp with time zone,
    "completedAt" timestamp with time zone,
    "status" "ServiceOrderChecklistStatus" NOT NULL DEFAULT 'PENDING',
    "notes" text,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    "deletedAt" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "checklist_execucao_items" (
    "id" varchar(191) PRIMARY KEY,
    "companyId" varchar(191) NOT NULL,
    "serviceOrderChecklistId" varchar(191) NOT NULL,
    "checklistTemplateItemId" varchar(191),
    "parentItemId" varchar(191),
    "titleSnapshot" text NOT NULL,
    "descriptionSnapshot" text,
    "itemTypeSnapshot" "ChecklistItemType" NOT NULL,
    "position" integer NOT NULL,
    "isRequired" boolean NOT NULL DEFAULT false,
    "expectedValueSnapshot" text,
    "minValueSnapshot" numeric(12,2),
    "maxValueSnapshot" numeric(12,2),
    "unitSnapshot" text,
    "optionsSnapshot" jsonb,
    "responseText" text,
    "responseNumber" numeric(12,2),
    "responseBoolean" boolean,
    "responseDate" timestamp with time zone,
    "responseJson" jsonb,
    "isCompliant" boolean,
    "technicianNotes" text,
    "answeredByUserId" varchar(191),
    "answeredAt" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    "deletedAt" timestamp with time zone
);

-- Foreign keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'checklists_ordem_servico' AND kcu.column_name = 'companyId'
    ) THEN
        ALTER TABLE "checklists_ordem_servico" ADD CONSTRAINT "checklists_ordem_servico_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'checklists_ordem_servico' AND kcu.column_name = 'serviceOrderId'
    ) THEN
        ALTER TABLE "checklists_ordem_servico" ADD CONSTRAINT "checklists_ordem_servico_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ordens_servico"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'checklists_ordem_servico' AND kcu.column_name = 'checklistTemplateId'
    ) THEN
        ALTER TABLE "checklists_ordem_servico" ADD CONSTRAINT "checklists_ordem_servico_template_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "checklist_templates"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'checklists_ordem_servico' AND kcu.column_name = 'assignedToUserId'
    ) THEN
        ALTER TABLE "checklists_ordem_servico" ADD CONSTRAINT "checklists_ordem_servico_assigned_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "usuarios"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'checklist_execucao_items' AND kcu.column_name = 'companyId'
    ) THEN
        ALTER TABLE "checklist_execucao_items" ADD CONSTRAINT "checklist_execucao_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'checklist_execucao_items' AND kcu.column_name = 'serviceOrderChecklistId'
    ) THEN
        ALTER TABLE "checklist_execucao_items" ADD CONSTRAINT "checklist_execucao_items_checklist_fkey" FOREIGN KEY ("serviceOrderChecklistId") REFERENCES "checklists_ordem_servico"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'checklist_execucao_items' AND kcu.column_name = 'checklistTemplateItemId'
    ) THEN
        ALTER TABLE "checklist_execucao_items" ADD CONSTRAINT "checklist_execucao_items_templateItem_fkey" FOREIGN KEY ("checklistTemplateItemId") REFERENCES "checklist_template_items"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'checklist_execucao_items' AND kcu.column_name = 'parentItemId'
    ) THEN
        ALTER TABLE "checklist_execucao_items" ADD CONSTRAINT "checklist_execucao_items_parent_fkey" FOREIGN KEY ("parentItemId") REFERENCES "checklist_execucao_items"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'checklist_execucao_items' AND kcu.column_name = 'answeredByUserId'
    ) THEN
        ALTER TABLE "checklist_execucao_items" ADD CONSTRAINT "checklist_execucao_items_answeredBy_fkey" FOREIGN KEY ("answeredByUserId") REFERENCES "usuarios"("id");
    END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS "checklists_ordem_servico_companyId_serviceOrderId_idx" ON "checklists_ordem_servico" ("companyId","serviceOrderId");
CREATE INDEX IF NOT EXISTS "checklists_ordem_servico_companyId_templateId_idx" ON "checklists_ordem_servico" ("companyId","checklistTemplateId");
CREATE INDEX IF NOT EXISTS "checklists_ordem_servico_companyId_status_idx" ON "checklists_ordem_servico" ("companyId","status");
CREATE INDEX IF NOT EXISTS "checklists_ordem_servico_companyId_assignedToUserId_idx" ON "checklists_ordem_servico" ("companyId","assignedToUserId");
CREATE INDEX IF NOT EXISTS "checklists_ordem_servico_companyId_completedAt_idx" ON "checklists_ordem_servico" ("companyId","completedAt");
CREATE INDEX IF NOT EXISTS "checklists_ordem_servico_deletedAt_idx" ON "checklists_ordem_servico" ("deletedAt");

CREATE INDEX IF NOT EXISTS "checklist_execucao_items_companyId_checklistId_idx" ON "checklist_execucao_items" ("companyId","serviceOrderChecklistId");
CREATE INDEX IF NOT EXISTS "checklist_execucao_items_companyId_templateItemId_idx" ON "checklist_execucao_items" ("companyId","checklistTemplateItemId");
CREATE INDEX IF NOT EXISTS "checklist_execucao_items_checklistId_position_idx" ON "checklist_execucao_items" ("serviceOrderChecklistId","position");
CREATE INDEX IF NOT EXISTS "checklist_execucao_items_companyId_answeredByUserId_idx" ON "checklist_execucao_items" ("companyId","answeredByUserId");
CREATE INDEX IF NOT EXISTS "checklist_execucao_items_companyId_answeredAt_idx" ON "checklist_execucao_items" ("companyId","answeredAt");
CREATE INDEX IF NOT EXISTS "checklist_execucao_items_deletedAt_idx" ON "checklist_execucao_items" ("companyId","deletedAt");
