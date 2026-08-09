import type { FinancialStorageState } from "./financeiro-types";
import { financialDistributionTotals } from "./financeiro-rule-three";
import { transactionOpenCents } from "./financeiro-status";

function csvCell(value: string | number) {
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}
function row(values: Array<string | number>) {
  return values.map(csvCell).join(";");
}
function brl(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}
function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

type AnnualMovement = {
  date: string;
  movement: string;
  title: string;
  category: string;
  counterparty: string;
  serviceOrder: string;
  amountCents: number;
};

function annualMovements(state: FinancialStorageState, year: number): AnnualMovement[] {
  const movements: AnnualMovement[] = [];
  for (const transaction of state.transactions) {
    if (transaction.archivedAt || transaction.canceledAt) continue;
    if (transaction.kind === "REALIZED" && transaction.realizedAt.startsWith(`${year}-`)) {
      movements.push({
        date: transaction.realizedAt,
        movement: transaction.direction === "INCOME" ? "Receita recebida" : transaction.nature === "INVESTMENT" ? "Investimento pago" : "Despesa paga",
        title: transaction.title,
        category: transaction.category,
        counterparty: transaction.direction === "INCOME"
          ? transaction.clientNameSnapshot || transaction.customerName || ""
          : transaction.supplier || "",
        serviceOrder: transaction.serviceOrderNumberSnapshot || "",
        amountCents: transaction.direction === "INCOME" ? transaction.totalCents : -transaction.totalCents,
      });
    }
    if (transaction.kind === "REALIZED") continue;
    for (const installment of transaction.installments) {
      if (installment.canceledAt) continue;
      for (const payment of installment.payments) {
        if (payment.reversedAt || !payment.paidAt.startsWith(`${year}-`)) continue;
        movements.push({
          date: payment.paidAt,
          movement: transaction.direction === "INCOME" ? "Recebimento de parcela" : transaction.nature === "INVESTMENT" ? "Pagamento de investimento" : "Pagamento de despesa",
          title: transaction.title,
          category: transaction.category,
          counterparty: transaction.direction === "INCOME"
            ? transaction.clientNameSnapshot || transaction.customerName || ""
            : transaction.supplier || "",
          serviceOrder: transaction.serviceOrderNumberSnapshot || "",
          amountCents: transaction.direction === "INCOME" ? payment.amountCents : -payment.amountCents,
        });
      }
    }
  }
  return movements.sort((a, b) => a.date.localeCompare(b.date));
}

export function buildAnnualFinancialDataset(
  state: FinancialStorageState,
  year: number,
  equipmentDepreciationCents: number,
) {
  let received = 0;
  let competenceRevenue = 0;
  let paidExpenses = 0;
  let investments = 0;
  const clients = new Map<string, number>();
  const categories = new Map<string, number>();
  const monthly = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, competenceRevenue: 0, received: 0, paidExpenses: 0, investments: 0 }));

  for (const transaction of state.transactions) {
    if (transaction.archivedAt || transaction.canceledAt) continue;
    if (transaction.direction === "INCOME" && transaction.competenceDate.startsWith(`${year}-`)) {
      competenceRevenue += transaction.totalCents;
      const monthIndex = Number(transaction.competenceDate.slice(5, 7)) - 1;
      if (monthly[monthIndex]) monthly[monthIndex].competenceRevenue += transaction.totalCents;
    }
    if (transaction.kind === "REALIZED" && transaction.realizedAt.startsWith(`${year}-`)) {
      if (transaction.direction === "INCOME") {
        received += transaction.totalCents;
        const monthIndex = Number(transaction.realizedAt.slice(5, 7)) - 1;
        if (monthly[monthIndex]) monthly[monthIndex].received += transaction.totalCents;
        const name = transaction.customerName || transaction.clientNameSnapshot || "Receitas sem cliente";
        clients.set(name, (clients.get(name) ?? 0) + transaction.totalCents);
        categories.set(transaction.category, (categories.get(transaction.category) ?? 0) + transaction.totalCents);
      } else if (transaction.nature === "INVESTMENT") {
        investments += transaction.totalCents;
        const monthIndex = Number(transaction.realizedAt.slice(5, 7)) - 1;
        if (monthly[monthIndex]) monthly[monthIndex].investments += transaction.totalCents;
      } else {
        paidExpenses += transaction.totalCents;
        const monthIndex = Number(transaction.realizedAt.slice(5, 7)) - 1;
        if (monthly[monthIndex]) monthly[monthIndex].paidExpenses += transaction.totalCents;
      }
    }
    if (transaction.kind !== "REALIZED") {
      for (const installment of transaction.installments) {
        if (installment.canceledAt) continue;
        for (const payment of installment.payments) {
          if (payment.reversedAt || !payment.paidAt.startsWith(`${year}-`)) continue;
          if (transaction.direction === "INCOME") {
            received += payment.amountCents;
            const monthIndex = Number(payment.paidAt.slice(5, 7)) - 1;
            if (monthly[monthIndex]) monthly[monthIndex].received += payment.amountCents;
            const name = transaction.clientNameSnapshot || transaction.customerName || "Receitas sem cliente";
            clients.set(name, (clients.get(name) ?? 0) + payment.amountCents);
            categories.set(transaction.category, (categories.get(transaction.category) ?? 0) + payment.amountCents);
          } else if (transaction.nature === "INVESTMENT") {
            investments += payment.amountCents;
            const monthIndex = Number(payment.paidAt.slice(5, 7)) - 1;
            if (monthly[monthIndex]) monthly[monthIndex].investments += payment.amountCents;
          } else {
            paidExpenses += payment.amountCents;
            const monthIndex = Number(payment.paidAt.slice(5, 7)) - 1;
            if (monthly[monthIndex]) monthly[monthIndex].paidExpenses += payment.amountCents;
          }
        }
      }
    }
  }

  const openReceivables = state.transactions
    .filter(
      (item) =>
        !item.archivedAt &&
        !item.canceledAt &&
        item.kind === "RECEIVABLE",
    )
    .reduce((total, item) => total + transactionOpenCents(item), 0);
  const distribution = financialDistributionTotals(state);
  return {
    year,
    received,
    competenceRevenue,
    paidExpenses,
    investments,
    cashResult: received - paidExpenses - investments,
    openReceivables,
    equipmentDepreciationCents,
    distribution,
    clients: [...clients.entries()].sort((first, second) => second[1] - first[1]),
    categories: [...categories.entries()].sort((first, second) => second[1] - first[1]),
    monthly,
    movements: annualMovements(state, year),
  };
}

export function buildAnnualFinancialCsv(
  state: FinancialStorageState,
  year: number,
  equipmentDepreciationCents: number,
) {
  const data = buildAnnualFinancialDataset(state, year, equipmentDepreciationCents);
  const lines = [
    row(["PROFLOW — RELATÓRIO FINANCEIRO ANUAL", year]),
    row([
      "Aviso",
      "Relatório gerencial de apoio contábil/fiscal. Não substitui DASN-SIMEI, DEFIS, PGDAS-D, escrituração contábil ou orientação do contador.",
    ]),
    "",
    row(["RESUMO", "VALOR (R$)"]),
    row(["Receita por competência no ano", brl(data.competenceRevenue)]),
    row(["Receitas efetivamente recebidas no ano (regime de caixa)", brl(data.received)]),
    row(["Despesas efetivamente pagas no ano", brl(data.paidExpenses)]),
    row(["Investimentos pagos no ano", brl(data.investments)]),
    row(["Resultado de caixa antes de tributos/ajustes", brl(data.cashResult)]),
    row(["Contas a receber ainda abertas (posição atual)", brl(data.openReceivables)]),
    row(["Depreciação estimada de equipamentos no ano", brl(data.equipmentDepreciationCents)]),
    "",
    row(["REGRA DOS TRÊS — POSIÇÃO ACUMULADA NO SISTEMA", "VALOR (R$)"]),
    row(["Salário — alocado", brl(data.distribution.salaryAllocatedCents)]),
    row(["Salário — usado", brl(data.distribution.salarySpentCents)]),
    row(["Salário — saldo gerencial", brl(data.distribution.salaryCents)]),
    row(["Empresa — alocado", brl(data.distribution.companyAllocatedCents)]),
    row(["Empresa — usado", brl(data.distribution.companySpentCents)]),
    row(["Empresa — saldo gerencial", brl(data.distribution.companyCents)]),
    row(["Reserva — alocado", brl(data.distribution.reserveAllocatedCents)]),
    row(["Reserva — usado", brl(data.distribution.reserveSpentCents)]),
    row(["Reserva — saldo gerencial", brl(data.distribution.reserveCents)]),
    row(["Reserva — valor a recompor", brl(data.distribution.reserveReplenishmentCents)]),
    "",
    row(["RECEITAS RECEBIDAS POR CATEGORIA", "VALOR (R$)"]),
    ...data.categories.map(([name, cents]) => row([name, brl(cents)])),
    "",
    row(["MOVIMENTO MENSAL", "COMPETÊNCIA (R$)", "RECEBIDO (R$)", "DESPESAS PAGAS (R$)", "INVESTIMENTOS (R$)"]),
    ...data.monthly.map((item) => row([String(item.month).padStart(2, "0"), brl(item.competenceRevenue), brl(item.received), brl(item.paidExpenses), brl(item.investments)])),
    "",
    row(["RECEITAS RECEBIDAS POR CLIENTE", "VALOR (R$)"]),
    ...data.clients.map(([name, cents]) => row([name, brl(cents)])),
    "",
    row(["MOVIMENTAÇÃO FINANCEIRA DO ANO", "TIPO", "TÍTULO", "CATEGORIA", "CLIENTE / FORNECEDOR", "ORDEM DE SERVIÇO", "VALOR (R$)"]),
    ...data.movements.map((item) =>
      row([item.date, item.movement, item.title, item.category, item.counterparty, item.serviceOrder, brl(item.amountCents)]),
    ),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}

export function downloadAnnualCsv(csv: string, year: number) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `proflow-relatorio-financeiro-anual-${year}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function printAnnualFinancialReport(
  state: FinancialStorageState,
  year: number,
  equipmentDepreciationCents: number,
) {
  const data = buildAnnualFinancialDataset(state, year, equipmentDepreciationCents);
  const clientRows = data.clients.length
    ? data.clients
        .map(
          ([name, cents]) =>
            `<tr><td>${escapeHtml(name)}</td><td class="money">${escapeHtml(money(cents))}</td></tr>`,
        )
        .join("")
    : '<tr><td colspan="2">Nenhuma receita vinculada a cliente no período.</td></tr>';
  const movementRows = data.movements.length
    ? data.movements
        .map(
          (item) =>
            `<tr><td>${escapeHtml(item.date.split("-").reverse().join("/"))}</td><td>${escapeHtml(item.movement)}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.counterparty || "—")}</td><td class="money">${escapeHtml(money(item.amountCents))}</td></tr>`,
        )
        .join("")
    : '<tr><td colspan="5">Nenhuma movimentação financeira realizada no período.</td></tr>';
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>ProFlow — Relatório financeiro anual ${year}</title>
<style>
*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;color:#172033;background:#fff}main{max-width:980px;margin:0 auto;padding:36px}header{border-bottom:3px solid #1378d1;padding-bottom:16px;margin-bottom:24px}h1{margin:0;font-size:26px}h2{margin:28px 0 10px;font-size:17px;color:#0d5fa8}p{line-height:1.5}.muted{color:#667085;font-size:12px}.notice{background:#f6f8fb;border:1px solid #dce3ec;padding:12px;border-radius:8px}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{padding:9px 10px;border-bottom:1px solid #e4e7ec;text-align:left;font-size:13px}.money{text-align:right;font-variant-numeric:tabular-nums}th{background:#f8fafc}footer{margin-top:34px;padding-top:14px;border-top:1px solid #e4e7ec;color:#667085;font-size:11px}@media print{main{padding:0}.no-print{display:none}@page{margin:14mm}}
</style></head><body><main>
<header><h1>ProFlow — Relatório financeiro anual ${year}</h1><p class="muted">Gerado em ${escapeHtml(new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date()))}</p></header>
<p class="notice"><strong>Apoio contábil/fiscal:</strong> este relatório consolida os registros do ProFlow, mas não substitui declarações oficiais nem a validação de enquadramento e classificação pelo contador.</p>
<h2>Resumo anual</h2><table><tbody>
<tr><td>Receita por competência</td><td class="money">${money(data.competenceRevenue)}</td></tr>
<tr><td>Receita efetivamente recebida</td><td class="money">${money(data.received)}</td></tr>
<tr><td>Despesas efetivamente pagas</td><td class="money">${money(data.paidExpenses)}</td></tr>
<tr><td>Investimentos pagos</td><td class="money">${money(data.investments)}</td></tr>
<tr><td>Resultado de caixa antes de ajustes tributários</td><td class="money">${money(data.cashResult)}</td></tr>
<tr><td>Contas a receber ainda abertas — posição atual</td><td class="money">${money(data.openReceivables)}</td></tr>
<tr><td>Depreciação estimada dos equipamentos no ano</td><td class="money">${money(data.equipmentDepreciationCents)}</td></tr>
</tbody></table>
<h2>Regra dos Três — posição acumulada</h2><table><tbody>
<tr><td>Salário — alocado / usado / saldo</td><td class="money">${money(data.distribution.salaryAllocatedCents)} / ${money(data.distribution.salarySpentCents)} / ${money(data.distribution.salaryCents)}</td></tr>
<tr><td>Empresa — alocado / usado / saldo</td><td class="money">${money(data.distribution.companyAllocatedCents)} / ${money(data.distribution.companySpentCents)} / ${money(data.distribution.companyCents)}</td></tr>
<tr><td>Reserva — alocado / usado / saldo</td><td class="money">${money(data.distribution.reserveAllocatedCents)} / ${money(data.distribution.reserveSpentCents)} / ${money(data.distribution.reserveCents)}</td></tr>
<tr><td>Reserva a recompor</td><td class="money">${money(data.distribution.reserveReplenishmentCents)}</td></tr>
</tbody></table>
<h2>Movimento mensal</h2><table><thead><tr><th>Mês</th><th class="money">Competência</th><th class="money">Recebido</th><th class="money">Despesas</th><th class="money">Investimentos</th></tr></thead><tbody>${data.monthly.map((item) => `<tr><td>${String(item.month).padStart(2, "0")}/${year}</td><td class="money">${money(item.competenceRevenue)}</td><td class="money">${money(item.received)}</td><td class="money">${money(item.paidExpenses)}</td><td class="money">${money(item.investments)}</td></tr>`).join("")}</tbody></table>
<h2>Receitas recebidas por categoria</h2><table><thead><tr><th>Categoria</th><th class="money">Valor recebido</th></tr></thead><tbody>${data.categories.length ? data.categories.map(([name, cents]) => `<tr><td>${escapeHtml(name)}</td><td class="money">${money(cents)}</td></tr>`).join("") : '<tr><td colspan="2">Nenhuma receita no período.</td></tr>'}</tbody></table>
<h2>Receitas recebidas por cliente</h2><table><thead><tr><th>Cliente</th><th class="money">Valor recebido</th></tr></thead><tbody>${clientRows}</tbody></table>
<h2>Movimentação financeira realizada no ano</h2><table><thead><tr><th>Data</th><th>Tipo</th><th>Lançamento</th><th>Cliente / fornecedor</th><th class="money">Valor</th></tr></thead><tbody>${movementRows}</tbody></table>
<footer>ProFlow · Relatório gerencial anual · Ano-calendário ${year}</footer>
<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));</script>
</main></body></html>`;
  const report = window.open("", "_blank");
  if (!report) throw new Error("O navegador bloqueou a janela do relatório. Permita pop-ups para imprimir ou salvar em PDF.");
  report.opener = null;
  report.document.open();
  report.document.write(html);
  report.document.close();
}
