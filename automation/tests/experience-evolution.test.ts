import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatBrazilianPhone,
  formatCep,
  formatCnpj,
  formatCpf,
  formatCurrencyBRLFromCents,
  formatDateBR,
  formatDateTimeBR,
  formatNumberBR,
  formatPercentageBR,
  normalizeEmail,
  normalizeProperName,
} from "../../lib/br-formatters";
import {
  ptBrTranslationCatalog,
  translateAutomationMode,
  translateEntityType,
  translateEventType,
  translatePriority,
  translateRole,
  translateStatus,
} from "../../lib/translations/pt-br";
import {
  detectAgendaConflicts,
  filterAgendaByPeriod,
  filterAgendaByTechnician,
  moveAgendaDate,
  summarizeAgendaDay,
  type AgendaDomainEvent,
} from "../../app/dashboard/agenda/agenda-professional-domain";
import {
  priorityExplanation,
  updateOperationalItemState,
  visibleOperationalInsightIds,
} from "../../app/dashboard/central-operacional/central-operacional-state";
import {
  addWorkspaceNote,
  emptyWorkspaceNotes,
  pinWorkspaceNote,
  workspaceNotesForOrder,
} from "../../app/dashboard/projetos/[id]/projeto-workspace-notes-domain";
import { toBrazilianCsv } from "../../lib/csv-br";

describe("catálogo central em português do Brasil", () => {
  it("traduz status", () => assert.equal(translateStatus("COMPLETED"), "Concluída"));
  it("traduz função", () => assert.equal(translateRole("TECHNICIAN"), "Técnico"));
  it("traduz prioridade", () => assert.equal(translatePriority("WARNING"), "Atenção"));
  it("traduz tipo de evento", () =>
    assert.equal(translateEventType("SERVICE_ORDER_COMPLETED"), "Ordem de Serviço concluída"));
  it("traduz modo de automação", () =>
    assert.equal(translateAutomationMode("SIMULATION"), "Simulação"));
  it("traduz tipo de entidade", () =>
    assert.equal(translateEntityType("SERVICE_ORDER"), "Ordem de Serviço"));
  it("não expõe termos críticos em inglês nos valores visíveis", () => {
    const visible = JSON.stringify(ptBrTranslationCatalog);
    for (const term of ["Save", "Delete", "Loading", "Settings", "Overview"])
      assert.equal(visible.includes(term), false);
  });
});

describe("formatação brasileira consolidada", () => {
  it("capitaliza nome de pessoa", () =>
    assert.equal(normalizeProperName("maria da silva"), "Maria da Silva"));
  it("capitaliza nome de empresa", () =>
    assert.equal(normalizeProperName("climax power ltda"), "Climax Power LTDA"));
  it("preserva conectivos", () =>
    assert.equal(normalizeProperName("joão dos santos"), "João dos Santos"));
  it("normaliza e-mail", () =>
    assert.equal(normalizeEmail(" CONTATO@EXEMPLO.COM "), "contato@exemplo.com"));
  it("formata data", () => assert.equal(formatDateBR("2026-07-16"), "16/07/2026"));
  it("formata data e hora", () =>
    assert.match(formatDateTimeBR("2026-07-16T14:30:00-03:00"), /16\/07\/2026 às 14:30/));
  it("formata moeda", () =>
    assert.equal(formatCurrencyBRLFromCents(100000), "R$ 1.000,00"));
  it("formata número", () => assert.equal(formatNumberBR(1234.5, 2), "1.234,50"));
  it("formata percentual", () => assert.equal(formatPercentageBR(12.5), "12,50%"));
  it("formata CPF", () => assert.equal(formatCpf("12345678900"), "123.456.789-00"));
  it("formata CNPJ", () =>
    assert.equal(formatCnpj("12345678000199"), "12.345.678/0001-99"));
  it("formata telefone", () =>
    assert.equal(formatBrazilianPhone("73988936763"), "(73) 9 8893-6763"));
  it("formata CEP", () => assert.equal(formatCep("45810000"), "45810-000"));
});

const events: AgendaDomainEvent[] = [
  {
    id: "a",
    title: "Visita",
    technician: "Equipe Técnica",
    startAt: "2026-07-16T09:00:00-03:00",
    endAt: "2026-07-16T11:00:00-03:00",
    status: "CONFIRMED",
    priority: "URGENT",
  },
  {
    id: "b",
    title: "Manutenção",
    technician: "Equipe Técnica",
    startAt: "2026-07-16T10:00:00-03:00",
    endAt: "2026-07-16T12:00:00-03:00",
    status: "PENDING",
  },
  {
    id: "c",
    title: "Instalação",
    technician: "Outra Equipe",
    startAt: "2026-07-17T09:00:00-03:00",
    endAt: "2026-07-17T10:00:00-03:00",
    status: "COMPLETED",
  },
];

describe("Agenda Profissional", () => {
  it("detecta conflito do mesmo técnico", () =>
    assert.equal(detectAgendaConflicts(events).length, 1));
  it("não confunde técnicos diferentes", () =>
    assert.equal(detectAgendaConflicts([events[0]!, events[2]!]).length, 0));
  it("não considera evento cancelado", () =>
    assert.equal(
      detectAgendaConflicts([events[0]!, { ...events[1]!, status: "CANCELED" }]).length,
      0,
    ));
  it("filtra por técnico", () =>
    assert.equal(filterAgendaByTechnician(events, "outra equipe").length, 1));
  it("filtra por período", () =>
    assert.equal(
      filterAgendaByPeriod(
        events,
        new Date("2026-07-16T00:00:00-03:00"),
        new Date("2026-07-17T00:00:00-03:00"),
      ).length,
      2,
    ));
  it("resume o dia", () => {
    const summary = summarizeAgendaDay(events, new Date("2026-07-16T12:00:00-03:00"));
    assert.equal(summary.total, 2);
    assert.equal(summary.urgent, 1);
    assert.equal(summary.conflicts, 1);
  });
  it("altera data preservando horário quando solicitado", () =>
    assert.match(moveAgendaDate(events[0]!.startAt, "2026-07-20", "14:30"), /T17:30:00.000Z$/));
});

describe("Central Operacional 2.0", () => {
  it("explica prioridade crítica por atraso", () =>
    assert.match(
      priorityExplanation({
        priority: "CRITICAL",
        title: "Conta vencida",
        description: "Pagamento atrasado.",
      }),
      /prazo vencido/,
    ));
  it("resolve item sem apagar o registro", () => {
    const state = updateOperationalItemState(
      { version: 1, items: [] },
      { insightId: "1", status: "RESOLVED", updatedAt: "2026-07-16T12:00:00Z" },
    );
    assert.equal(state.items[0]?.status, "RESOLVED");
  });
  it("oculta resolvido da lista ativa", () =>
    assert.deepEqual(
      visibleOperationalInsightIds(
        ["1"],
        {
          version: 1,
          items: [{ insightId: "1", status: "RESOLVED", updatedAt: "2026-07-16" }],
        },
        new Date("2026-07-16"),
      ),
      [],
    ));
  it("mantém item adiado fora da lista até a data", () =>
    assert.deepEqual(
      visibleOperationalInsightIds(
        ["1"],
        {
          version: 1,
          items: [{
            insightId: "1",
            status: "SNOOZED",
            snoozedUntil: "2026-07-20",
            updatedAt: "2026-07-16",
          }],
        },
        new Date("2026-07-19"),
      ),
      [],
    ));
  it("reabre item adiado após a data", () =>
    assert.deepEqual(
      visibleOperationalInsightIds(
        ["1"],
        {
          version: 1,
          items: [{
            insightId: "1",
            status: "SNOOZED",
            snoozedUntil: "2026-07-20",
            updatedAt: "2026-07-16",
          }],
        },
        new Date("2026-07-21"),
      ),
      ["1"],
    ));
});

describe("observações internas do Workspace", () => {
  it("adiciona observação", () => {
    const state = addWorkspaceNote(emptyWorkspaceNotes(), {
      id: "n1",
      serviceOrderId: "os1",
      text: " Confirmar acesso ",
      createdAt: "2026-07-16",
    });
    assert.equal(state.notes[0]?.text, "Confirmar acesso");
  });
  it("rejeita observação vazia", () =>
    assert.throws(() =>
      addWorkspaceNote(emptyWorkspaceNotes(), {
        id: "n1",
        serviceOrderId: "os1",
        text: " ",
        createdAt: "2026-07-16",
      }),
    ));
  it("fixa observação", () => {
    const state = pinWorkspaceNote(
      {
        version: 1,
        notes: [{
          id: "n1",
          serviceOrderId: "os1",
          text: "Atenção",
          pinned: false,
          createdAt: "2026-07-16",
        }],
      },
      "n1",
      true,
    );
    assert.equal(state.notes[0]?.pinned, true);
  });
  it("filtra observações pela Ordem", () =>
    assert.equal(
      workspaceNotesForOrder(
        {
          version: 1,
          notes: [
            { id: "1", serviceOrderId: "os1", text: "A", pinned: false, createdAt: "2026-07-16" },
            { id: "2", serviceOrderId: "os2", text: "B", pinned: false, createdAt: "2026-07-16" },
          ],
        },
        "os1",
      ).length,
      1,
    ));
});

describe("exportação brasileira de Relatórios", () => {
  it("gera CSV com BOM, ponto e vírgula e cabeçalhos em português", () => {
    const csv = toBrazilianCsv([
      ["Relatório ProFlow"],
      ["Gerado em", "16/07/2026 às 14:30"],
      ["Período", "01/07/2026 a 31/07/2026"],
    ]);
    assert.equal(csv.startsWith("\uFEFF"), true);
    assert.match(csv, /"Gerado em";/);
    assert.match(csv, /"Período"/);
  });
});
