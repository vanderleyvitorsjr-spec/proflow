-- Migration: Add checklist templates and items

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checklistcategory') THEN
        CREATE TYPE "ChecklistCategory" AS ENUM (
            'INSTALLATION','PREVENTIVE_MAINTENANCE','CORRECTIVE_MAINTENANCE','CLEANING','ELECTRICAL_INSPECTION','SAFETY','COMMISSIONING','WARRANTY','OTHER'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checklistitemtype') THEN
        CREATE TYPE "ChecklistItemType" AS ENUM (
            'BOOLEAN','TEXT','LONG_TEXT','NUMBER','DECIMAL','DATE','TIME','SINGLE_CHOICE','MULTIPLE_CHOICE','MEASUREMENT','PHOTO_REQUIRED','SIGNATURE_REQUIRED','SECTION','INFORMATION'
        );
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS "checklist_templates" (
    "id" varchar(191) PRIMARY KEY,
    "companyId" varchar(191) NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "category" "ChecklistCategory" NOT NULL,
    "version" integer NOT NULL DEFAULT 1,
    "isDefault" boolean NOT NULL DEFAULT false,
    "isActive" boolean NOT NULL DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    "deletedAt" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "checklist_template_items" (
    "id" varchar(191) PRIMARY KEY,
    "companyId" varchar(191) NOT NULL,
    "checklistTemplateId" varchar(191) NOT NULL,
    "parentItemId" varchar(191),
    "title" text NOT NULL,
    "description" text,
    "itemType" "ChecklistItemType" NOT NULL,
    "position" integer NOT NULL,
    "isRequired" boolean NOT NULL DEFAULT false,
    "expectedValue" text,
    "minValue" numeric(12,2),
    "maxValue" numeric(12,2),
    "unit" text,
    "options" jsonb,
    "helpText" text,
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
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'checklist_templates' AND kcu.column_name = 'companyId'
    ) THEN
        ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'checklist_template_items' AND kcu.column_name = 'companyId'
    ) THEN
        ALTER TABLE "checklist_template_items" ADD CONSTRAINT "checklist_template_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'checklist_template_items' AND kcu.column_name = 'checklistTemplateId'
    ) THEN
        ALTER TABLE "checklist_template_items" ADD CONSTRAINT "checklist_template_items_template_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "checklist_templates"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'checklist_template_items' AND kcu.column_name = 'parentItemId'
    ) THEN
        ALTER TABLE "checklist_template_items" ADD CONSTRAINT "checklist_template_items_parent_fkey" FOREIGN KEY ("parentItemId") REFERENCES "checklist_template_items"("id");
    END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS "checklist_templates_companyId_category_idx" ON "checklist_templates" ("companyId","category");
CREATE INDEX IF NOT EXISTS "checklist_templates_companyId_isActive_idx" ON "checklist_templates" ("companyId","isActive");
CREATE INDEX IF NOT EXISTS "checklist_templates_companyId_name_idx" ON "checklist_templates" ("companyId","name");
CREATE INDEX IF NOT EXISTS "checklist_templates_deletedAt_idx" ON "checklist_templates" ("deletedAt");

CREATE INDEX IF NOT EXISTS "checklist_template_items_companyId_templateId_idx" ON "checklist_template_items" ("companyId","checklistTemplateId");
CREATE INDEX IF NOT EXISTS "checklist_template_items_companyId_parentItemId_idx" ON "checklist_template_items" ("companyId","parentItemId");
CREATE INDEX IF NOT EXISTS "checklist_template_items_templateId_position_idx" ON "checklist_template_items" ("checklistTemplateId","position");
CREATE INDEX IF NOT EXISTS "checklist_template_items_companyId_itemType_idx" ON "checklist_template_items" ("companyId","itemType");
CREATE INDEX IF NOT EXISTS "checklist_template_items_deletedAt_idx" ON "checklist_template_items" ("companyId","deletedAt");

-- Uniqueness constraint to avoid duplicate versions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'checklist_templates' AND indexname = 'checklist_templates_companyId_name_version_key'
    ) THEN
        CREATE UNIQUE INDEX "checklist_templates_companyId_name_version_key" ON "checklist_templates" ("companyId","name","version");
    END IF;
END$$;
