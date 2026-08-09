"use client";

import { useMemo, useState } from "react";
import { BriefcaseBusiness, CircleDollarSign, PiggyBank, Save, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateFinancialDistributionAction } from "./financeiro-actions";
import type {
  FinancialAllocation,
  FinancialBucket,
  FinancialDistribution,
  FinancialStorageState,
} from "./financeiro-types";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function allocationFor(amountCents: number, distribution: FinancialDistribution): FinancialAllocation {
  const salaryCents = Math.floor((amountCents * distribution.salaryBasisPoints) / 10000);
  const companyCents = Math.floor((amountCents * distribution.companyBasisPoints) / 10000);
  return {
    salaryCents,
    companyCents,
    reserveCents: amountCents - salaryCents - companyCents,
    ...distribution,
  };
}

type ReserveEvent = {
  sortKey: string;
  type: "ALLOCATION" | "WITHDRAWAL";
  amountCents: number;
};

/**
 * Consolida a Regra dos Três a partir dos movimentos efetivamente realizados.
 * As alocações de receita preservam o percentual existente na data do recebimento.
 * Saídas escolhem explicitamente Salário, Empresa ou Reserva; registros legados
 * sem bucket são tratados como Caixa da empresa.
 */
export function financialDistributionTotals(state: FinancialStorageState) {
  const totals = {
    receivedCents: 0,
    salaryAllocatedCents: 0,
    companyAllocatedCents: 0,
    reserveAllocatedCents: 0,
    salarySpentCents: 0,
    companySpentCents: 0,
    reserveSpentCents: 0,
    salaryCents: 0,
    companyCents: 0,
    reserveCents: 0,
    reserveReplenishmentCents: 0,
  };
  const reserveEvents: ReserveEvent[] = [];

  const addAllocation = (amountCents: number, allocated: FinancialAllocation, sortKey: string) => {
    totals.receivedCents += amountCents;
    totals.salaryAllocatedCents += allocated.salaryCents;
    totals.companyAllocatedCents += allocated.companyCents;
    totals.reserveAllocatedCents += allocated.reserveCents;
    reserveEvents.push({ sortKey, type: "ALLOCATION", amountCents: allocated.reserveCents });
  };
  const addExpense = (amountCents: number, bucket: FinancialBucket | undefined, sortKey: string) => {
    const source = bucket ?? "COMPANY";
    if (source === "SALARY") totals.salarySpentCents += amountCents;
    else if (source === "RESERVE") {
      totals.reserveSpentCents += amountCents;
      reserveEvents.push({ sortKey, type: "WITHDRAWAL", amountCents });
    } else totals.companySpentCents += amountCents;
  };

  for (const transaction of state.transactions) {
    if (transaction.archivedAt || transaction.canceledAt) continue;

    if (transaction.kind === "REALIZED") {
      if (transaction.direction === "INCOME") {
        const allocated = transaction.allocation ?? allocationFor(transaction.totalCents, state.distribution);
        addAllocation(
          transaction.totalCents,
          allocated,
          `${transaction.realizedAt}T12:00:00|${transaction.createdAt}|${transaction.id}`,
        );
      } else {
        addExpense(
          transaction.totalCents,
          transaction.fundingBucket,
          `${transaction.realizedAt}T12:00:00|${transaction.createdAt}|${transaction.id}`,
        );
      }
      continue;
    }

    for (const installment of transaction.installments) {
      if (installment.canceledAt) continue;
      for (const payment of installment.payments) {
        if (payment.reversedAt) continue;
        const sortKey = `${payment.paidAt}T12:00:00|${payment.createdAt}|${payment.id}`;
        if (transaction.kind === "RECEIVABLE") {
          const allocated = payment.allocation ?? allocationFor(payment.amountCents, state.distribution);
          addAllocation(payment.amountCents, allocated, sortKey);
        } else if (transaction.kind === "PAYABLE") {
          addExpense(payment.amountCents, payment.fundingBucket, sortKey);
        }
      }
    }
  }

  totals.salaryCents = totals.salaryAllocatedCents - totals.salarySpentCents;
  totals.companyCents = totals.companyAllocatedCents - totals.companySpentCents;
  totals.reserveCents = totals.reserveAllocatedCents - totals.reserveSpentCents;

  // Qualquer retirada da Reserva cria uma obrigação de recomposição. Apenas a
  // parcela destinada à Reserva em recebimentos posteriores reduz essa obrigação.
  let reserveDebt = 0;
  for (const event of reserveEvents.sort((a, b) => a.sortKey.localeCompare(b.sortKey))) {
    if (event.type === "WITHDRAWAL") reserveDebt += event.amountCents;
    else reserveDebt = Math.max(0, reserveDebt - event.amountCents);
  }
  totals.reserveReplenishmentCents = reserveDebt;
  return totals;
}

export function FinanceiroRuleThree({ state, onUpdated }: { state: FinancialStorageState; onUpdated: () => Promise<void> }) {
  const [salary, setSalary] = useState(state.distribution.salaryBasisPoints / 100);
  const [company, setCompany] = useState(state.distribution.companyBasisPoints / 100);
  const [reserve, setReserve] = useState(state.distribution.reserveBasisPoints / 100);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const totals = useMemo(() => financialDistributionTotals(state), [state]);
  const totalPercent = salary + company + reserve;

  async function save() {
    setMessage("");
    if (Math.abs(totalPercent - 100) > 0.001) {
      setMessage("A soma precisa ser exatamente 100%.");
      return;
    }
    setSaving(true);
    const result = await updateFinancialDistributionAction({
      salaryBasisPoints: Math.round(salary * 100),
      companyBasisPoints: Math.round(company * 100),
      reserveBasisPoints: 10000 - Math.round(salary * 100) - Math.round(company * 100),
    });
    if (result.ok) {
      setMessage("Regra dos Três atualizada. Novos recebimentos usarão estes percentuais.");
      await onUpdated();
    } else setMessage(result.error.message);
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-sky-500" />
          Regra dos Três
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Cada recebimento é separado entre salário, caixa da empresa e fundo de reserva. Ao registrar uma saída, escolha de qual bucket ela saiu. Uso da reserva gera uma recomposição pendente até que novos recebimentos reponham esse valor.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <PercentField label="Salário" value={salary} onChange={setSalary} />
          <PercentField label="Empresa" value={company} onChange={setCompany} />
          <PercentField label="Fundo de reserva" value={reserve} onChange={setReserve} />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className={Math.abs(totalPercent - 100) < 0.001 ? "text-xs text-emerald-600" : "text-xs text-red-500"}>
            Total: {totalPercent.toFixed(2)}%
          </p>
          <Button size="sm" onClick={() => void save()} disabled={saving}>
            <Save className="h-4 w-4" />
            Salvar distribuição
          </Button>
        </div>
        {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Bucket icon={CircleDollarSign} label="Recebido distribuído" value={totals.receivedCents} />
          <Bucket icon={Wallet} label="Saldo para salário" value={totals.salaryCents} detail={`Alocado ${money.format(totals.salaryAllocatedCents / 100)} · usado ${money.format(totals.salarySpentCents / 100)}`} />
          <Bucket icon={BriefcaseBusiness} label="Caixa da empresa" value={totals.companyCents} detail={`Alocado ${money.format(totals.companyAllocatedCents / 100)} · usado ${money.format(totals.companySpentCents / 100)}`} />
          <Bucket icon={PiggyBank} label="Fundo de reserva" value={totals.reserveCents} detail={`Alocado ${money.format(totals.reserveAllocatedCents / 100)} · usado ${money.format(totals.reserveSpentCents / 100)}`} />
          <Bucket icon={PiggyBank} label="Reserva a recompor" value={totals.reserveReplenishmentCents} warning={totals.reserveReplenishmentCents > 0} detail="Retiradas ainda não recompostas por parcelas futuras destinadas à reserva." />
        </div>
      </CardContent>
    </Card>
  );
}

function PercentField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="space-y-1 text-xs font-medium text-muted-foreground">
      <span>{label} (%)</span>
      <Input type="number" min="0" max="100" step="0.1" value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} />
    </label>
  );
}

function Bucket({ icon: Icon, label, value, detail, warning = false }: { icon: typeof Wallet; label: string; value: number; detail?: string; warning?: boolean }) {
  return (
    <div className={warning ? "rounded-xl border border-amber-500/30 bg-amber-500/5 p-3" : "rounded-xl border bg-muted/20 p-3"}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={warning ? "h-4 w-4 text-amber-500" : "h-4 w-4"} />
        {label}
      </div>
      <p className={warning ? "mt-1 text-lg font-bold text-amber-600 dark:text-amber-300" : "mt-1 text-lg font-bold"}>{money.format(value / 100)}</p>
      {detail ? <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{detail}</p> : null}
    </div>
  );
}
