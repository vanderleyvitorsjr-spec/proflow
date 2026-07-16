-- Migration: Add service order attachments for orders and checklist items

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'serviceorderattachmenttype') THEN
        CREATE TYPE "ServiceOrderAttachmentType" AS ENUM (
            'IMAGE','VIDEO','AUDIO','DOCUMENT','SIGNATURE','RECEIPT','INVOICE','REPORT','OTHER'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'serviceorderattachmentcategory') THEN
        CREATE TYPE "ServiceOrderAttachmentCategory" AS ENUM (
            'BEFORE_SERVICE','DURING_SERVICE','AFTER_SERVICE','DIAGNOSIS','EQUIPMENT','INSTALLATION','CHECKLIST','CUSTOMER_SIGNATURE','TECHNICAL_REPORT','WARRANTY','PAYMENT','GENERAL'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'storageprovider') THEN
        CREATE TYPE "StorageProvider" AS ENUM (
            'SUPABASE','LOCAL','S3','GOOGLE_DRIVE','OTHER'
        );
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS "service_order_attachments" (
    "id" varchar(191) PRIMARY KEY,
    "companyId" varchar(191) NOT NULL,
    "serviceOrderId" varchar(191) NOT NULL,
    "serviceOrderChecklistId" varchar(191),
    "serviceOrderChecklistItemId" varchar(191),
    "uploadedByUserId" varchar(191),
    "attachmentType" "ServiceOrderAttachmentType" NOT NULL,
    "category" "ServiceOrderAttachmentCategory" NOT NULL,
    "fileName" text NOT NULL,
    "originalFileName" text,
    "mimeType" text NOT NULL,
    "fileSizeBytes" bigint,
    "storageProvider" "StorageProvider" NOT NULL,
    "storageBucket" text,
    "storagePath" text NOT NULL,
    "publicUrl" text,
    "checksum" text,
    "title" text,
    "description" text,
    "capturedAt" timestamp with time zone,
    "latitude" numeric(10,7),
    "longitude" numeric(10,7),
    "sortOrder" integer,
    "isCustomerVisible" boolean NOT NULL DEFAULT false,
    "isRequiredRecord" boolean NOT NULL DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    "deletedAt" timestamp with time zone
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'service_order_attachments' AND kcu.column_name = 'companyId'
    ) THEN
        ALTER TABLE "service_order_attachments" ADD CONSTRAINT "service_order_attachments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'service_order_attachments' AND kcu.column_name = 'serviceOrderId'
    ) THEN
        ALTER TABLE "service_order_attachments" ADD CONSTRAINT "service_order_attachments_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ordens_servico"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'service_order_attachments' AND kcu.column_name = 'serviceOrderChecklistId'
    ) THEN
        ALTER TABLE "service_order_attachments" ADD CONSTRAINT "service_order_attachments_serviceOrderChecklistId_fkey" FOREIGN KEY ("serviceOrderChecklistId") REFERENCES "checklists_ordem_servico"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'service_order_attachments' AND kcu.column_name = 'serviceOrderChecklistItemId'
    ) THEN
        ALTER TABLE "service_order_attachments" ADD CONSTRAINT "service_order_attachments_serviceOrderChecklistItemId_fkey" FOREIGN KEY ("serviceOrderChecklistItemId") REFERENCES "checklist_execucao_items"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'service_order_attachments' AND kcu.column_name = 'uploadedByUserId'
    ) THEN
        ALTER TABLE "service_order_attachments" ADD CONSTRAINT "service_order_attachments_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "usuarios"("id");
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS "service_order_attachments_companyId_serviceOrderId_idx" ON "service_order_attachments" ("companyId","serviceOrderId");
CREATE INDEX IF NOT EXISTS "service_order_attachments_companyId_serviceOrderChecklistId_idx" ON "service_order_attachments" ("companyId","serviceOrderChecklistId");
CREATE INDEX IF NOT EXISTS "service_order_attachments_companyId_serviceOrderChecklistItemId_idx" ON "service_order_attachments" ("companyId","serviceOrderChecklistItemId");
CREATE INDEX IF NOT EXISTS "service_order_attachments_companyId_uploadedByUserId_idx" ON "service_order_attachments" ("companyId","uploadedByUserId");
CREATE INDEX IF NOT EXISTS "service_order_attachments_companyId_attachmentType_idx" ON "service_order_attachments" ("companyId","attachmentType");
CREATE INDEX IF NOT EXISTS "service_order_attachments_companyId_category_idx" ON "service_order_attachments" ("companyId","category");
CREATE INDEX IF NOT EXISTS "service_order_attachments_companyId_capturedAt_idx" ON "service_order_attachments" ("companyId","capturedAt");
CREATE INDEX IF NOT EXISTS "service_order_attachments_companyId_isCustomerVisible_idx" ON "service_order_attachments" ("companyId","isCustomerVisible");
CREATE INDEX IF NOT EXISTS "service_order_attachments_companyId_deletedAt_idx" ON "service_order_attachments" ("companyId","deletedAt");
CREATE INDEX IF NOT EXISTS "service_order_attachments_checksum_idx" ON "service_order_attachments" ("checksum");
CREATE INDEX IF NOT EXISTS "service_order_attachments_serviceOrderId_sortOrder_idx" ON "service_order_attachments" ("serviceOrderId","sortOrder");
