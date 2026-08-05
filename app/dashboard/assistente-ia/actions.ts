"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/context";
import { formatCurrencyBRLFromCents } from "@/lib/br-formatters";

type ModulePayload = Record<string, unknown> | unknown[] | null;

function arrayFrom(payload: ModulePayload, key?: string): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (key && payload && typeof payload === "object" && Array.isArray((payload as Record<string, unknown>)[key])) {
    return (payload as Record<string, unknown>)[key] as unknown[];
  }
  return [];
}

export async function askOperationalAssistantAction(question: string) {
  const context = await requirePermission("REPORTS_VIEW");
  const normalized = question.trim().toLocaleLowerCase("pt-BR");
  if (normalized.length < 3) throw new Error("Digite uma pergunta mais detalhada.");

  const states = await prisma.companyModuleState.findMany({
    where: { companyId: context.companyId, module: { in: ["clientes", "crm", "agenda", "ordens", "financeiro", "estoque", "equipamentos"] } },
    select: { module: true, payload: true, updatedAt: true },
  });
  const byModule = new Map(states.map((item) => [item.module, item.payload as ModulePayload]));
  const clients = arrayFrom(byModule.get("clientes") ?? null);
  const leads = arrayFrom(byModule.get("crm") ?? null);
  const orders = arrayFrom((byModule.get("ordens") as Record<string, unknown> | null) ?? null, "records");
  const finance = (byModule.get("financeiro") as Record<string, unknown> | null) ?? null;
  const transactions = arrayFrom(finance, "transactions") as Array<Record<string, unknown>>;
  const stock = (byModule.get("estoque") as Record<string, unknown> | null) ?? null;
  const stockItems = arrayFrom(stock, "items") as Array<Record<string, unknown>>;
  const equipment = (byModule.get("equipamentos") as Record<string, unknown> | null) ?? null;
  const assets = arrayFrom(equipment, "assets");

  const openOrders = (orders as Array<Record<string, unknown>>).filter((item) => !["COMPLETED", "CANCELED"].includes(String(item.status))).length;
  const overdue = transactions.filter((item) => {
    if (!Array.isArray(item.installments)) return false;
    return item.installments.some((installment) => {
      const value = installment as Record<string, unknown>;
      return !value.canceledAt && new Date(String(value.dueDate)) < new Date() && Array.isArray(value.payments) && value.payments.length === 0;
    });
  });
  const lowStock = stockItems.filter((item) => Number(item.minimumQuantity ?? 0) > 0 && Number(item.initialQuantity ?? item.quantity ?? 0) <= Number(item.minimumQuantity ?? 0));
  const pipelineValue = (leads as Array<Record<string, unknown>>).filter((item) => !item.archivedAt && !item.convertedAt).reduce((sum, item) => sum + Number(item.estimatedValue ?? 0), 0);

  const summary = {
    clients: clients.length,
    leads: leads.length,
    openOrders,
    overdue: overdue.length,
    lowStock: lowStock.length,
    assets: assets.length,
    pipelineValue,
  };

  let answer = `Neste momento, encontrei ${summary.clients} cliente(s), ${summary.leads} oportunidade(s), ${summary.openOrders} Ordem(ns) em aberto, ${summary.overdue} lançamento(s) vencido(s), ${summary.lowStock} item(ns) com atenção de Estoque e ${summary.assets} equipamento(s).`;
  const actions: Array<{ label: string; href: string }> = [];

  if (normalized.includes("finance") || normalized.includes("receber") || normalized.includes("vencid")) {
    answer = summary.overdue
      ? `Existem ${summary.overdue} lançamento(s) com vencimento ultrapassado. Recomendo abrir o Financeiro, conferir os pagamentos já registrados e definir a próxima ação de cobrança.`
      : "Não encontrei lançamentos vencidos nos dados atuais. Ainda assim, revise a previsão dos próximos 30 dias no Financeiro.";
    actions.push({ label: "Abrir Financeiro", href: "/dashboard/financeiro" });
  } else if (normalized.includes("crm") || normalized.includes("lead") || normalized.includes("oportun")) {
    answer = `O Funil possui ${summary.leads} oportunidade(s), com valor estimado total de ${formatCurrencyBRLFromCents(Math.round(summary.pipelineValue * 100))}. Priorize oportunidades sem próxima ação e com maior tempo na mesma etapa.`;
    actions.push({ label: "Abrir CRM", href: "/dashboard/crm" });
  } else if (normalized.includes("estoque") || normalized.includes("material")) {
    answer = summary.lowStock
      ? `Há ${summary.lowStock} item(ns) com quantidade igual ou inferior ao mínimo cadastrado. Revise reservas e compras antes de confirmar novos consumos.`
      : "Não encontrei itens abaixo do mínimo nos dados atuais.";
    actions.push({ label: "Abrir Estoque", href: "/dashboard/estoque" });
  } else if (normalized.includes("ordem") || normalized.includes("serviço") || normalized.includes("servico")) {
    answer = `Existem ${summary.openOrders} Ordem(ns) ainda não concluída(s). Verifique as que estão sem agenda, responsável, checklist ou material confirmado.`;
    actions.push({ label: "Abrir Ordens", href: "/dashboard/ordens" });
  } else {
    actions.push({ label: "Abrir Central Operacional", href: "/dashboard/central-operacional" });
  }

  await prisma.logSistema.create({
    data: {
      companyId: context.companyId,
      userId: context.internalUserId,
      action: "OPERATIONAL_ASSISTANT_QUERY",
      entity: "ASSISTANT",
      metadata: { question, summary },
    },
  });

  return { answer, summary, actions, generatedAt: new Date().toISOString() };
}
