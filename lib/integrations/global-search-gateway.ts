import { listActiveClientPublicReferencesAction } from "@/app/dashboard/clientes/actions";
import { listServiceOrderTechnicalReferencesAction } from "@/app/dashboard/_ordens/ordens-actions";
import { listEquipmentPricingReferencesAction } from "@/app/dashboard/_equipamentos/equipamentos-actions";
import { listCrmLeadsAction } from "@/features/crm/crm-actions";
import { listQuotesAction } from "@/app/dashboard/_orcamentos/orcamentos-actions";
import { listStockPricingReferencesAction } from "@/app/dashboard/_estoque/estoque-actions";
import { listSupplierPublicReferencesAction } from "@/app/dashboard/_fornecedores/fornecedores-actions";
import { listPurchasesAction } from "@/app/dashboard/_fornecedores/compras-actions";
import { listDocumentsAction } from "@/app/dashboard/_documentos/documentos-actions";
import { listFinancialStateAction } from "@/app/dashboard/financeiro/financeiro-actions";
import type { GlobalSearchResult } from "@/lib/contracts/global-activity.contract";
import { filterGlobalSearch } from "@/lib/global-search-domain";

export async function globalSearch(query: string) {
  const settled = await Promise.allSettled([
    listActiveClientPublicReferencesAction(), listServiceOrderTechnicalReferencesAction(),
    listEquipmentPricingReferencesAction(), listCrmLeadsAction(), listQuotesAction({ archived: false }),
    listStockPricingReferencesAction(), listSupplierPublicReferencesAction(), listPurchasesAction(),
    listDocumentsAction(), listFinancialStateAction(),
  ]);
  const results: GlobalSearchResult[] = [];
  const add = (id: string, source: string, title: string, description: string, link: string, keywords: string) => results.push({ id, source, title, description, link, keywords });
  if (settled[0].status === "fulfilled") for (const x of settled[0].value) add(x.id, "Clientes", x.name, [x.phone, x.email].filter(Boolean).join(" · "), `/dashboard/clientes/${x.id}`, `${x.name} ${x.phone} ${x.email}`);
  if (settled[1].status === "fulfilled") for (const x of settled[1].value) add(x.id, "Ordens", x.number, x.title, `/dashboard/ordens/${x.id}`, `${x.number} ${x.title}`);
  if (settled[2].status === "fulfilled" && settled[2].value.ok) for (const x of settled[2].value.data.filter((v) => !v.archived)) add(x.id, "Equipamentos", x.internalCode, x.name, `/dashboard/equipamentos/${x.id}`, `${x.internalCode} ${x.name}`);
  if (settled[3].status === "fulfilled") for (const x of settled[3].value.filter((v) => !v.archivedAt)) add(x.id, "CRM", x.name, x.serviceInterest, `/dashboard/crm/${x.id}`, `${x.name} ${x.serviceInterest} ${x.phone} ${x.email}`);
  if (settled[4].status === "fulfilled") for (const x of settled[4].value) add(x.id, "Orçamentos", x.number, `${x.clientName} · ${x.title}`, `/dashboard/orcamentos/${x.id}/visualizar`, `${x.number} ${x.clientName} ${x.clientDocument} ${x.title}`);
  if (settled[5].status === "fulfilled" && settled[5].value.ok) for (const x of settled[5].value.data) add(x.id, "Estoque", x.internalCode, x.name, `/dashboard/estoque/${x.id}`, `${x.internalCode} ${x.name}`);
  if (settled[6].status === "fulfilled" && settled[6].value.ok) for (const x of settled[6].value.data.filter((v) => !v.archived)) add(x.id, "Fornecedores", x.code, x.name || x.legalName, `/dashboard/fornecedores/${x.id}`, `${x.code} ${x.name} ${x.legalName} ${x.document}`);
  if (settled[7].status === "fulfilled") {
    for (const x of settled[7].value.quotations) add(x.id, "Cotações", x.number, x.title, `/dashboard/fornecedores/compras/cotacoes/${x.id}`, `${x.number} ${x.title}`);
    for (const x of settled[7].value.orders) add(x.id, "Pedidos de Compra", x.number, x.supplierName, `/dashboard/fornecedores/compras/pedidos/${x.id}`, `${x.number} ${x.supplierName}`);
  }
  if (settled[8].status === "fulfilled") for (const x of settled[8].value) add(x.id, "Documentos", x.number ?? x.title, x.title, x.link, `${x.number} ${x.title} ${x.entity}`);
  if (settled[9].status === "fulfilled" && settled[9].value.ok) for (const x of settled[9].value.data.transactions.filter((v) => !v.archivedAt)) add(x.id, "Financeiro", x.title, x.customerName || x.supplier || x.description, `/dashboard/financeiro/${x.id}`, `${x.title} ${x.description} ${x.customerName} ${x.supplier}`);
  const items = filterGlobalSearch(results, query, query.trim() ? 30 : 12);
  return { items, total: filterGlobalSearch(results, query, Number.MAX_SAFE_INTEGER).length, partial: settled.some((x) => x.status === "rejected") };
}
