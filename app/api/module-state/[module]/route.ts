import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserContext } from "@/lib/auth/context";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

const modulePermissions: Record<
  string,
  { read: Permission; write: Permission }
> = {
  clientes: { read: "CLIENTS_VIEW", write: "CLIENTS_UPDATE" },
  crm: { read: "CRM_VIEW", write: "CRM_MANAGE" },
  agenda: { read: "AGENDA_VIEW", write: "AGENDA_MANAGE" },
  ordens: { read: "ORDERS_VIEW", write: "ORDERS_UPDATE" },
  financeiro: { read: "FINANCE_VIEW", write: "FINANCE_UPDATE" },
  estoque: { read: "INVENTORY_VIEW", write: "INVENTORY_MANAGE" },
  equipamentos: { read: "EQUIPMENT_VIEW", write: "EQUIPMENT_MANAGE" },
  configuracoes: { read: "SETTINGS_VIEW", write: "SETTINGS_MANAGE" },
  perfil: { read: "SETTINGS_VIEW", write: "SETTINGS_MANAGE" },
  "workspace-operacional": {
    read: "ORDERS_VIEW",
    write: "ORDERS_UPDATE",
  },
  "central-operacional": {
    read: "ORDERS_VIEW",
    write: "ORDERS_UPDATE",
  },
  automacoes: {
    read: "AUTOMATIONS_VIEW",
    write: "AUTOMATIONS_MANAGE",
  },
  documentos: {
    read: "ORDERS_VIEW",
    write: "ORDERS_UPDATE",
  },
};

function canAccess(
  context: NonNullable<
    Awaited<ReturnType<typeof getCurrentUserContext>>
  >,
  module: string,
  mode: "read" | "write",
) {
  const permission = modulePermissions[module]?.[mode];

  if (!permission) {
    return false;
  }

  return hasPermission(context.role, permission, {
    allow: context.permissions,
    deny: context.deniedPermissions,
  });
}

function toJsonInput(
  value: Prisma.JsonValue | null,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ module: string }> },
) {
  const context = await getCurrentUserContext();

  if (!context) {
    return NextResponse.json(
      { error: "Não autenticado." },
      { status: 401 },
    );
  }

  const { module } = await params;

  if (!canAccess(context, module, "read")) {
    return NextResponse.json(
      { error: "Acesso negado." },
      { status: 403 },
    );
  }

  const state = await prisma.companyModuleState.findUnique({
    where: {
      companyId_module: {
        companyId: context.companyId,
        module,
      },
    },
  });

  return NextResponse.json({
    found: Boolean(state),
    revision: state?.revision ?? 0,
    payload: state?.payload ?? null,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> },
) {
  const context = await getCurrentUserContext();

  if (!context) {
    return NextResponse.json(
      { error: "Não autenticado." },
      { status: 401 },
    );
  }

  const { module } = await params;

  if (!canAccess(context, module, "write")) {
    return NextResponse.json(
      { error: "Acesso negado." },
      { status: 403 },
    );
  }

  const contentLength = Number(
    request.headers.get("content-length") ?? 0,
  );

  if (contentLength > 8 * 1024 * 1024) {
    return NextResponse.json(
      { error: "O conjunto de dados excede 8 MB." },
      { status: 413 },
    );
  }

  const body = (await request.json()) as {
    payload?: unknown;
    recover?: boolean;
    expectedRevision?: number;
  };

  const existing = await prisma.companyModuleState.findUnique({
    where: {
      companyId_module: {
        companyId: context.companyId,
        module,
      },
    },
  });

  if (body.recover) {
    if (!existing?.backup) {
      return NextResponse.json(
        { error: "Backup não encontrado." },
        { status: 404 },
      );
    }

    const updated = await prisma.companyModuleState.update({
      where: {
        id: existing.id,
      },
      data: {
        payload: toJsonInput(existing.backup),
        backup: toJsonInput(existing.payload),
        revision: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      revision: updated.revision,
      payload: updated.payload,
    });
  }

  if (body.payload === undefined) {
    return NextResponse.json(
      { error: "Conteúdo obrigatório." },
      { status: 400 },
    );
  }

  if (
    existing &&
    body.expectedRevision !== undefined &&
    existing.revision !== body.expectedRevision
  ) {
    return NextResponse.json(
      {
        error:
          "Os dados foram alterados em outra janela. Recarregue antes de salvar.",
        revision: existing.revision,
      },
      { status: 409 },
    );
  }

  const payload =
    body.payload === null
      ? Prisma.JsonNull
      : (body.payload as Prisma.InputJsonValue);

  const updated = existing
    ? await prisma.companyModuleState.update({
        where: {
          id: existing.id,
        },
        data: {
          backup: toJsonInput(existing.payload),
          payload,
          revision: {
            increment: 1,
          },
        },
      })
    : await prisma.companyModuleState.create({
        data: {
          companyId: context.companyId,
          module,
          payload,
        },
      });

  return NextResponse.json({
    revision: updated.revision,
    payload: updated.payload,
  });
}