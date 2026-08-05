ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CUSTOMER_SERVICE';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'INVENTORY';

DO $$ BEGIN
  CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'CANCELED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "authUserId" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "jobTitle" TEXT;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "zipCode" TEXT;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "street" TEXT;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "addressNumber" TEXT;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "complement" TEXT;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "district" TEXT;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "state" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_authUserId_key" ON "usuarios"("authUserId");
CREATE INDEX IF NOT EXISTS "usuarios_authUserId_idx" ON "usuarios"("authUserId");

CREATE TABLE IF NOT EXISTS "company_invitations" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMPTZ,
  "canceledAt" TIMESTAMPTZ,
  CONSTRAINT "company_invitations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "company_invitations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id"),
  CONSTRAINT "company_invitations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "usuarios"("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "company_invitations_tokenHash_key" ON "company_invitations"("tokenHash");
CREATE INDEX IF NOT EXISTS "company_invitations_companyId_status_idx" ON "company_invitations"("companyId", "status");
CREATE INDEX IF NOT EXISTS "company_invitations_companyId_email_idx" ON "company_invitations"("companyId", "email");
CREATE INDEX IF NOT EXISTS "company_invitations_expiresAt_idx" ON "company_invitations"("expiresAt");

ALTER TABLE "empresas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "usuarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permissoes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company_invitations" ENABLE ROW LEVEL SECURITY;

CREATE SCHEMA IF NOT EXISTS private;
CREATE OR REPLACE FUNCTION private.current_proflow_company_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "companyId" FROM "usuarios"
  WHERE "authUserId" = auth.uid()::text
    AND "status" = 'ACTIVE'
    AND "deletedAt" IS NULL
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION private.current_proflow_company_id() FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_proflow_company_id() TO authenticated;

DROP POLICY IF EXISTS "company_members_read_company" ON "empresas";
CREATE POLICY "company_members_read_company" ON "empresas" FOR SELECT TO authenticated
USING ("id" = private.current_proflow_company_id());

DROP POLICY IF EXISTS "members_read_same_company_users" ON "usuarios";
CREATE POLICY "members_read_same_company_users" ON "usuarios" FOR SELECT TO authenticated
USING ("companyId" = private.current_proflow_company_id());

DROP POLICY IF EXISTS "members_read_own_permissions" ON "permissoes";
CREATE POLICY "members_read_own_permissions" ON "permissoes" FOR SELECT TO authenticated
USING ("companyId" = private.current_proflow_company_id());

DROP POLICY IF EXISTS "team_managers_read_invitations" ON "company_invitations";
CREATE POLICY "team_managers_read_invitations" ON "company_invitations" FOR SELECT TO authenticated
USING ("companyId" = private.current_proflow_company_id());
