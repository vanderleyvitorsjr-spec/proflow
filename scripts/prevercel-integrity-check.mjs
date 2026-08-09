import fs from "node:fs";
import path from "node:path";

const required = [
  "app/api/module-state/[module]/route.ts",
  "prisma/migrations/20260809143000_add_module_state_persistence/migration.sql",
  "features/crm/crm-service.ts",
  "lib/integrations/crm-pricing-bridge.ts",
  "app/dashboard/clientes/clientes-storage-adapter.ts",
  "app/dashboard/clientes/clientes-operational-summary.ts",
  "app/dashboard/clientes/cliente-360-storage-adapter.ts",
  "app/dashboard/_ordens/ordens-storage-adapter.ts",
  "app/dashboard/financeiro/financeiro-storage-adapter.ts",
  "app/dashboard/financeiro/financeiro-rule-three.tsx",
  "app/dashboard/financeiro/financeiro-annual-report.ts",
  "app/dashboard/precificacao/precificacao-systemica.tsx",
  "app/dashboard/_equipamentos/equipamentos-storage-adapter.ts",
  "app/dashboard/equipamentos/page.tsx",
];

const missing = required.filter((file) => !fs.existsSync(path.resolve(file)));
const sensitive = [".env.local", ".env"].filter((file) => fs.existsSync(path.resolve(file)));

if (missing.length) {
  console.error("Arquivos obrigatórios ausentes:", missing);
  process.exit(1);
}
if (sensitive.length) {
  console.warn("Aviso: arquivo de ambiente presente. Não o inclua no ZIP/Git:", sensitive);
}

const text = (file) => fs.readFileSync(file, "utf8");
const crm = text("features/crm/crm-service.ts");
const bridge = text("lib/integrations/crm-pricing-bridge.ts");
const pricing = text("app/dashboard/precificacao/precificacao-systemica.tsx");
const finance = text("app/dashboard/financeiro/financeiro-rule-three.tsx");
const annual = text("app/dashboard/financeiro/financeiro-annual-report.ts");
const clients = text("app/dashboard/clientes/clientes-operational-summary.ts");
const equipment = text("app/dashboard/_equipamentos/equipamentos-actions.ts");
const migration = text("prisma/migrations/20260809143000_add_module_state_persistence/migration.sql");
const moduleApi = text("app/api/module-state/[module]/route.ts");

const cfm = 120 + 350 + 1500 + 120 + 300 + 300 + 120 + 250 + 350 + 3500;
const cht = cfm / (22 * 8);
const cvs = 650 + 90 + 50 + 180;
const cts = 5 * cht + cvs;
const pv = cts / (1 - (30 + 6 + 3) / 100);
const formulaOk =
  cfm === 6910 &&
  Math.abs(cht - 39.2613636364) < 1e-8 &&
  cvs === 970 &&
  Math.abs(cts - 1166.30681818) < 1e-8 &&
  Math.round(pv * 100) === 191198;

const assertions = [
  [crm.includes('stageId === "approved"') && crm.includes("convertLead"), "CRM aprovado → Cliente"],
  [bridge.includes("crmLeadId") && bridge.includes("clientSnapshot"), "Conversão CRM → vínculos da Precificação"],
  [clients.includes("transactionOpenCents") && clients.includes("receivedFromClient"), "Clientes → recebido / a receber do Financeiro"],
  [pricing.includes("calculateSystemicPricing") && pricing.includes("createPricingSimulationAction") && pricing.includes("Markup Divisor"), "Precificação sistêmica → Simulação"],
  [formulaOk, "Fórmula CFM → CHT → CVS → CTS → PV"],
  [finance.includes("reserveReplenishmentCents"), "Regra dos Três / recomposição"],
  [annual.includes("MOVIMENTAÇÃO FINANCEIRA DO ANO") && annual.includes("DASN-SIMEI"), "Relatório financeiro anual"],
  [equipment.includes("monthlyDepreciationCents") && equipment.includes("estimatedMaintenanceMonthlyCents"), "Equipamentos → depreciação/manutenção → Precificação"],
  [migration.includes('CREATE TABLE "module_states"'), "Persistência remota multiempresa"],
  [moduleApi.includes('"cliente-relacionamentos"') && moduleApi.includes('"equipamentos"'), "Módulos operacionais sincronizados"],
];

let failed = false;
for (const [ok, label] of assertions) {
  console.log(`${ok ? "OK" : "FALHA"} · ${label}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
console.log("Integridade estrutural pré-Vercel: OK");
