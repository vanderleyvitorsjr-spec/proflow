import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateOperationalProgress,
  calculateProfitability,
  consolidateCosts,
} from "../../app/dashboard/projetos/[id]/projeto-workspace-domain";
import { projectCashFlow } from "../../app/dashboard/relatorios/analytics/cash-projection-engine";
import type { ReportFinancialSource } from "../../lib/contracts/relatorios-financeiro.contract";

describe("domínio do workspace operacional", () => {
  it("mantém o progresso entre zero e cem", () => {
    const empty = calculateOperationalProgress({
      orderStatus: "",
      checklist: [],
      agenda: [],
      hasMaterialPlan: false,
      hasConfirmedMaterials: false,
      hasEquipmentDefinition: false,
      hasTechnicalReport: false,
      hasFinancialRecord: false,
    });
    const complete = calculateOperationalProgress({
      orderStatus: "COMPLETED",
      checklist: [{ status: "COMPLETED", required: true }],
      agenda: [{ status: "COMPLETED" }],
      hasMaterialPlan: true,
      hasConfirmedMaterials: true,
      hasEquipmentDefinition: true,
      executionStatus: "COMPLETED",
      hasTechnicalReport: true,
      hasFinancialRecord: true,
    });
    assert.equal(empty.total, 0);
    assert.equal(complete.total, 100);
  });

  it("explica fontes ausentes no progresso parcial", () => {
    const result = calculateOperationalProgress({
      orderStatus: "OPEN",
      checklist: [],
      agenda: [],
      hasMaterialPlan: false,
      hasConfirmedMaterials: false,
      hasEquipmentDefinition: false,
      hasTechnicalReport: false,
      hasFinancialRecord: false,
    });
    assert.ok(result.missing.includes("Agendamento"));
    assert.ok(result.missing.includes("Checklist operacional"));
  });

  it("não considera item obrigatório bloqueado como concluído", () => {
    const result = calculateOperationalProgress({
      orderStatus: "IN_PROGRESS",
      checklist: [{ status: "BLOCKED", required: true }],
      agenda: [{ status: "COMPLETED" }],
      hasMaterialPlan: true,
      hasConfirmedMaterials: true,
      hasEquipmentDefinition: true,
      executionStatus: "IN_PROGRESS",
      hasTechnicalReport: false,
      hasFinancialRecord: false,
    });
    assert.ok(result.total < 100);
    assert.ok(result.missing.includes("Item obrigatório bloqueado"));
  });

  it("remove custos duplicados pela origem e referência", () => {
    const costs = consolidateCosts([
      { id: "1", source: "STOCK", category: "Material", description: "Cabo", valueCents: 1000, status: "REALIZED", reference: "mov-1" },
      { id: "2", source: "STOCK", category: "Material", description: "Cabo", valueCents: 1000, status: "REALIZED", reference: "mov-1" },
    ]);
    assert.equal(costs.length, 1);
  });

  it("descarta custo negativo ou inválido", () => {
    assert.equal(
      consolidateCosts([
        { id: "1", source: "FINANCE", category: "Outros", description: "Inválido", valueCents: -1, status: "REALIZED", reference: "fin-1" },
      ]).length,
      0,
    );
  });

  it("calcula margem prevista e realizada", () => {
    const result = calculateProfitability({
      expectedRevenueCents: 100_000,
      expectedCostCents: 60_000,
      realizedRevenueCents: 80_000,
      realizedCostCents: 50_000,
    });
    assert.equal(result.expectedMarginCents, 40_000);
    assert.equal(result.realizedMarginCents, 30_000);
    assert.equal(result.expectedProfitabilityBasisPoints, 4000);
  });

  it("não produz NaN ou Infinity quando a receita é zero", () => {
    const result = calculateProfitability({
      expectedRevenueCents: 0,
      expectedCostCents: 100,
      realizedRevenueCents: 0,
      realizedCostCents: 100,
    });
    assert.equal(result.expectedProfitabilityBasisPoints, undefined);
    assert.equal(result.realizedProfitabilityBasisPoints, undefined);
  });

  it("preserva margem negativa quando custos superam receita", () => {
    const result = calculateProfitability({
      expectedRevenueCents: 100,
      expectedCostCents: 200,
      realizedRevenueCents: 100,
      realizedCostCents: 250,
    });
    assert.equal(result.expectedMarginCents, -100);
    assert.equal(result.realizedMarginCents, -150);
  });
});

describe("projeção financeira determinística", () => {
  const source: ReportFinancialSource = {
    accounts: [],
    transactions: [
      {
        id: "income",
        title: "Recebível",
        nature: "REVENUE" as const,
        direction: "INCOME" as const,
        kind: "RECEIVABLE" as const,
        category: "Serviços",
        competenceDate: "2026-07-01",
        issueDate: "2026-07-01",
        realizedAt: "",
        totalCents: 90_000,
        accountId: "account",
        canceled: false,
        archived: false,
        installments: [
          { dueDate: "2026-08-01", amountCents: 30_000, canceled: false, payments: [] },
          { dueDate: "2026-09-01", amountCents: 30_000, canceled: false, payments: [] },
          { dueDate: "2026-10-01", amountCents: 30_000, canceled: false, payments: [] },
        ],
      },
      {
        id: "expense",
        title: "Conta",
        nature: "EXPENSE" as const,
        direction: "EXPENSE" as const,
        kind: "PAYABLE" as const,
        category: "Operação",
        competenceDate: "2026-07-01",
        issueDate: "2026-07-01",
        realizedAt: "",
        totalCents: 20_000,
        accountId: "account",
        canceled: false,
        archived: false,
        installments: [
          { dueDate: "2026-07-20", amountCents: 5_000, canceled: false, payments: [] },
          { dueDate: "2026-08-10", amountCents: 15_000, canceled: false, payments: [] },
        ],
      },
    ],
  };

  it("separa contas vencidas da projeção futura", () => {
    const result = projectCashFlow(source, new Date("2026-07-23T12:00:00.000Z"));
    assert.equal(result.overdueExpenseCents, 5_000);
    assert.equal(result.windows[0]?.expenseCents, 15_000);
  });

  it("calcula janelas de 30, 60 e 90 dias", () => {
    const result = projectCashFlow(source, new Date("2026-07-23T12:00:00.000Z"));
    assert.deepEqual(result.windows.map((item) => item.days), [30, 60, 90]);
    assert.equal(result.windows[0]?.incomeCents, 30_000);
    assert.equal(result.windows[1]?.incomeCents, 60_000);
    assert.equal(result.windows[2]?.incomeCents, 90_000);
  });

  it("deduz pagamentos confirmados do valor pendente", () => {
    const paid = structuredClone(source);
    paid.transactions[0]!.installments[0]!.payments.push({
      amountCents: 10_000,
      paidAt: "2026-07-22",
    });
    const result = projectCashFlow(paid, new Date("2026-07-23T12:00:00.000Z"));
    assert.equal(result.windows[0]?.incomeCents, 20_000);
  });

  it("ignora pagamentos estornados", () => {
    const reversed = structuredClone(source);
    reversed.transactions[0]!.installments[0]!.payments.push({
      amountCents: 10_000,
      paidAt: "2026-07-22",
      reversedAt: "2026-07-23",
    });
    const result = projectCashFlow(reversed, new Date("2026-07-23T12:00:00.000Z"));
    assert.equal(result.windows[0]?.incomeCents, 30_000);
  });

  it("ignora lançamentos cancelados", () => {
    const canceled = structuredClone(source);
    canceled.transactions[0]!.canceled = true;
    const result = projectCashFlow(canceled, new Date("2026-07-23T12:00:00.000Z"));
    assert.equal(result.windows[2]?.incomeCents, 0);
  });

  it("retorna indisponível sem fonte financeira", () => {
    assert.equal(
      projectCashFlow(undefined, new Date("2026-07-23T12:00:00.000Z")).available,
      false,
    );
  });
});
