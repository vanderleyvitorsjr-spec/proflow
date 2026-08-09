import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth/context";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

const ALLOWED_MODULES = new Set([
  "crm",
  "clientes",
  "cliente-relacionamentos",
  "ordens",
  "financeiro",
  "precificacao",
  "equipamentos",
  "configuracoes",
  "pricing-systemic",
]);


const MODULE_PERMISSIONS: Partial<Record<string, { read: Permission; write: Permission }>> = {
  crm: { read: "CRM_VIEW", write: "CRM_MANAGE" },
  clientes: { read: "CLIENTS_VIEW", write: "CLIENTS_UPDATE" },
  "cliente-relacionamentos": { read: "CLIENTS_VIEW", write: "CLIENTS_UPDATE" },
  ordens: { read: "ORDERS_VIEW", write: "ORDERS_UPDATE" },
  financeiro: { read: "FINANCE_VIEW", write: "FINANCE_UPDATE" },
  equipamentos: { read: "EQUIPMENT_VIEW", write: "EQUIPMENT_MANAGE" },
  configuracoes: { read: "SETTINGS_VIEW", write: "SETTINGS_MANAGE" },
};
function allowed(context: NonNullable<Awaited<ReturnType<typeof getCurrentUserContext>>>, module: string, mode: "read" | "write") {
  const permission = MODULE_PERMISSIONS[module]?.[mode];
  if (!permission) return ["OWNER", "ADMIN", "MANAGER"].includes(context.role);
  return hasPermission(context.role, permission, { allow: context.permissions, deny: context.deniedPermissions });
}
function validateModule(value: string) {
  const module = value.trim().toLocaleLowerCase("pt-BR");
  return ALLOWED_MODULES.has(module) ? module : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ module: string }> },
) {
  const context = await getCurrentUserContext();
  if (!context) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { module: raw } = await params;
  const module = validateModule(raw);
  if (!module) return NextResponse.json({ error: "Módulo inválido." }, { status: 400 });
  if (!allowed(context, module, "read")) return NextResponse.json({ error: "Sem permissão para este módulo." }, { status: 403 });

  const record = await prisma.moduleState.findUnique({
    where: { companyId_module: { companyId: context.companyId, module } },
  });
  return NextResponse.json(
    record
      ? { data: record.data, revision: record.revision, updatedAt: record.updatedAt.toISOString() }
      : { data: null, revision: 0, updatedAt: null },
  );
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ module: string }> },
) {
  const context = await getCurrentUserContext();
  if (!context) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { module: raw } = await params;
  const module = validateModule(raw);
  if (!module) return NextResponse.json({ error: "Módulo inválido." }, { status: 400 });
  if (!allowed(context, module, "write")) return NextResponse.json({ error: "Sem permissão para alterar este módulo." }, { status: 403 });

  const body = (await request.json()) as { data?: unknown };
  if (body.data === undefined)
    return NextResponse.json({ error: "Dados obrigatórios." }, { status: 400 });

  const record = await prisma.$transaction(async (tx) => {
    const current = await tx.moduleState.findUnique({
      where: { companyId_module: { companyId: context.companyId, module } },
    });
    return tx.moduleState.upsert({
      where: { companyId_module: { companyId: context.companyId, module } },
      create: {
        companyId: context.companyId,
        module,
        revision: 1,
        data: body.data as never,
      },
      update: {
        revision: (current?.revision ?? 0) + 1,
        data: body.data as never,
      },
    });
  });

  return NextResponse.json({
    data: record.data,
    revision: record.revision,
    updatedAt: record.updatedAt.toISOString(),
  });
}
