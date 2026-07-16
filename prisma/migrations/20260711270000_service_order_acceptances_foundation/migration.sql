-- Migration: Add service order acceptance structured model

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'serviceorderacceptancetype') THEN
        CREATE TYPE "ServiceOrderAcceptanceType" AS ENUM (
            'SERVICE_AUTHORIZATION',
            'SERVICE_COMPLETION',
            'TECHNICAL_REPORT',
            'WARRANTY_TERMS',
            'BUDGET_APPROVAL',
            'EQUIPMENT_DELIVERY',
            'OTHER'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'serviceorderacceptancestatus') THEN
        CREATE TYPE "ServiceOrderAcceptanceStatus" AS ENUM (
            'PENDING',
            'ACCEPTED',
            'REJECTED',
            'CANCELED'
        );
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS "service_order_acceptances" (
    "id" varchar(191) PRIMARY KEY,
    "companyId" varchar(191) NOT NULL,
    "serviceOrderId" varchar(191) NOT NULL,
    "clientId" varchar(191) NOT NULL,
    "attachmentId" varchar(191),
    "acceptanceType" "ServiceOrderAcceptanceType" NOT NULL,
    "status" "ServiceOrderAcceptanceStatus" NOT NULL DEFAULT 'PENDING',
    "signerName" text NOT NULL,
    "signerDocument" text,
    "signerEmail" text,
    "signerPhone" text,
    "acceptedAt" timestamp with time zone,
    "rejectedAt" timestamp with time zone,
    "acceptanceTextSnapshot" text NOT NULL,
    "termsVersion" text,
    "ipAddress" text,
    "userAgent" text,
    "latitude" numeric(10,7),
    "longitude" numeric(10,7),
    "rejectionReason" text,
    "notes" text,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    "deletedAt" timestamp with time zone
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'service_order_acceptances' AND kcu.column_name = 'companyId'
    ) THEN
        ALTER TABLE "service_order_acceptances" ADD CONSTRAINT "service_order_acceptances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'service_order_acceptances' AND kcu.column_name = 'serviceOrderId'
    ) THEN
        ALTER TABLE "service_order_acceptances" ADD CONSTRAINT "service_order_acceptances_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ordens_servico"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'service_order_acceptances' AND kcu.column_name = 'clientId'
    ) THEN
        ALTER TABLE "service_order_acceptances" ADD CONSTRAINT "service_order_acceptances_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clientes"("id");
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'service_order_acceptances' AND kcu.column_name = 'attachmentId'
    ) THEN
        ALTER TABLE "service_order_acceptances" ADD CONSTRAINT "service_order_acceptances_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "service_order_attachments"("id");
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS "service_order_acceptances_companyId_serviceOrderId_idx" ON "service_order_acceptances" ("companyId","serviceOrderId");
CREATE INDEX IF NOT EXISTS "service_order_acceptances_companyId_clientId_idx" ON "service_order_acceptances" ("companyId","clientId");
CREATE INDEX IF NOT EXISTS "service_order_acceptances_companyId_status_idx" ON "service_order_acceptances" ("companyId","status");
CREATE INDEX IF NOT EXISTS "service_order_acceptances_companyId_acceptanceType_idx" ON "service_order_acceptances" ("companyId","acceptanceType");
CREATE INDEX IF NOT EXISTS "service_order_acceptances_companyId_acceptedAt_idx" ON "service_order_acceptances" ("companyId","acceptedAt");
CREATE INDEX IF NOT EXISTS "service_order_acceptances_companyId_rejectedAt_idx" ON "service_order_acceptances" ("companyId","rejectedAt");
CREATE INDEX IF NOT EXISTS "service_order_acceptances_companyId_attachmentId_idx" ON "service_order_acceptances" ("companyId","attachmentId");
CREATE INDEX IF NOT EXISTS "service_order_acceptances_companyId_deletedAt_idx" ON "service_order_acceptances" ("companyId","deletedAt");
