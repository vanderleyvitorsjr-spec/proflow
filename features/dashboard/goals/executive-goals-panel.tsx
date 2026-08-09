"use client";

import { Copy, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { Select } from "@/components/ui/select";
import {
  formatCurrencyBRLFromCents,
  formatDateBR,
  formatNumberBR,
  formatPercentageBR,
  parseCurrencyBRToCents,
} from "@/lib/br-formatters";
import { toBrazilianCsv } from "@/lib/csv-br";
import {
  createExecutiveGoalAction,
  deleteExecutiveGoalAction,
  duplicateExecutiveGoalAction,
  listExecutiveGoalsAction,
  updateExecutiveGoalAction,
} from "./executive-goals-actions";
import {
  calculateGoalProgress,
  type ExecutiveGoal,
  type GoalCategory,
  type GoalPeriod,
  type GoalUnit,
} from "./executive-goals-domain";

const categoryLabels: Record<GoalCategory, string> = {
  REVENUE: "Faturamento",
  COMPLETED_ORDERS: "Ordens Concluídas",
  NEW_CLIENTS: "Novos Clientes",
  CRM_CONVERSION: "Conversão do CRM",
  AVERAGE_TICKET: "Ticket Médio",
  OVERDUE_REDUCTION: "Redução de Ordens Atrasadas",
  RECEIPTS: "Recebimentos",
  MARGIN: "Margem",
  TEAM_PRODUCTIVITY: "Produtividade da Equipe",
};
const unitLabels: Record<GoalUnit, string> = {
  CURRENCY: "Real",
  QUANTITY: "Quantidade",
  PERCENTAGE: "Percentual",
  DAYS: "Dias",
  HOURS: "Horas",
};
const periodLabels: Record<GoalPeriod, string> = {
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
  CUSTOM: "Personalizado",
};
const statusLabels = {
  NOT_STARTED: "Não Iniciada",
  IN_PROGRESS: "Em Andamento",
  NEAR_TARGET: "Próxima da meta",
  ACHIEVED: "Alcançada",
  EXCEEDED: "Superada",
  OVERDUE: "Atrasada",
  CLOSED: "Encerrada",
} as const;

export type GoalRealizedValues = Partial<Record<GoalCategory, number>>;

export function ExecutiveGoalsPanel({
  realizedValues = {},
  compact = false,
}: {
  realizedValues?: GoalRealizedValues;
  compact?: boolean;
}) {
  const [goals, setGoals] = useState<ExecutiveGoal[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [editing, setEditing] = useState<ExecutiveGoal | null | undefined>(undefined);
  useEffect(() => {
    void listExecutiveGoalsAction().then(setGoals);
  }, []);
  const displayed = useMemo(
    () =>
      goals
        .map((goal) => ({
          ...goal,
          realizedValue: realizedValues[goal.category] ?? goal.realizedValue,
        }))
        .filter(
          (goal) =>
            (filter === "ALL" ||
              (filter === "ACTIVE" ? goal.active : !goal.active)) &&
            (!search.trim() ||
              `${goal.name} ${categoryLabels[goal.category]}`
                .toLocaleLowerCase("pt-BR")
                .includes(search.trim().toLocaleLowerCase("pt-BR"))),
        )
        .sort((a, b) => Number(b.active) - Number(a.active) || a.endDate.localeCompare(b.endDate)),
    [filter, goals, realizedValues, search],
  );
  const refresh = () => listExecutiveGoalsAction().then(setGoals);
  const exportCsv = () => {
    const rows = [
      ["Nome", "Categoria", "Realizado", "Meta", "Progresso", "Prazo", "Situação"],
      ...displayed.map((goal) => {
        const progress = calculateGoalProgress(goal);
        return [
          goal.name,
          categoryLabels[goal.category],
          formatGoalValue(goal.realizedValue, goal.unit),
          formatGoalValue(goal.targetValue, goal.unit),
          progress.available ? formatPercentageBR(progress.percentage ?? 0) : progress.message,
          `${formatDateBR(goal.startDate)} a ${formatDateBR(goal.endDate)}`,
          statusLabels[progress.status],
        ];
      }),
    ];
    const url = URL.createObjectURL(new Blob([toBrazilianCsv(rows)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `metas-executivas-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Card>
      <CardHeader className="border-b px-4 py-3">
        <SectionHeader
          compact
          title="Metas executivas"
          description="Acompanhe objetivos locais com valores reais disponíveis no ProFlow."
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={exportCsv} disabled={!displayed.length}>
                Exportar CSV
              </Button>
              <Button size="sm" onClick={() => setEditing(null)}>
                <Plus className="h-4 w-4" /> Nova meta
              </Button>
            </div>
          }
        />
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {!compact ? (
          <div className="grid gap-2 sm:grid-cols-[1fr_12rem]">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar meta..." aria-label="Pesquisar metas" />
            <Select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
              <option value="ALL">Todas</option>
              <option value="ACTIVE">Ativas</option>
              <option value="INACTIVE">Inativas</option>
            </Select>
          </div>
        ) : null}
        {displayed.length ? (
          <div className={`grid gap-3 ${compact ? "xl:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-3"}`}>
            {displayed.slice(0, compact ? 3 : undefined).map((goal) => {
              const progress = calculateGoalProgress(goal);
              return (
                <article key={goal.id} className="rounded-xl border bg-muted/10 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{goal.name}</p>
                      <p className="text-xs text-muted-foreground">{categoryLabels[goal.category]}</p>
                    </div>
                    <Badge variant={goal.active ? "secondary" : "outline"}>
                      {statusLabels[progress.status]}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm font-semibold tabular-nums">
                    {formatGoalValue(goal.realizedValue, goal.unit)} de {formatGoalValue(goal.targetValue, goal.unit)}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-label={progress.message}>
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, progress.percentage ?? 0)}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                    <span>{progress.message}</span>
                    <span>{progress.daysRemaining === undefined ? "Prazo indisponível" : `${progress.daysRemaining} Dias Restantes`}</span>
                  </div>
                  {!compact ? (
                    <div className="mt-3 flex justify-end gap-1">
                      <Button size="icon" variant="ghost" aria-label={`Editar ${goal.name}`} onClick={() => setEditing(goal)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label={`Duplicar ${goal.name}`} onClick={async () => { setGoals(await duplicateExecutiveGoalAction(goal.id)); }}><Copy className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label={goal.active ? `Desativar ${goal.name}` : `Ativar ${goal.name}`} onClick={async () => setGoals(await updateExecutiveGoalAction(goal.id, { active: !goal.active }))}><Target className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label={`Excluir ${goal.name}`} onClick={async () => { if (window.confirm(`Excluir a meta ${goal.name}? O histórico local desta meta também será removido.`)) setGoals(await deleteExecutiveGoalAction(goal.id)); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState size="compact" icon={<Target className="h-5 w-5" />} title="Nenhuma meta configurada" description="Crie uma meta para acompanhar o desempenho da operação." />
        )}
      </CardContent>
      {editing !== undefined ? (
        <GoalDialog goal={editing} onClose={() => setEditing(undefined)} onSaved={async () => { await refresh(); setEditing(undefined); }} />
      ) : null}
    </Card>
  );
}

function GoalDialog({ goal, onClose, onSaved }: { goal: ExecutiveGoal | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(goal?.name ?? "");
  const [category, setCategory] = useState<GoalCategory>(goal?.category ?? "REVENUE");
  const [unit, setUnit] = useState<GoalUnit>(goal?.unit ?? "CURRENCY");
  const [period, setPeriod] = useState<GoalPeriod>(goal?.period ?? "MONTHLY");
  const [target, setTarget] = useState(String(goal?.targetValue ?? ""));
  const [startDate, setStartDate] = useState(goal?.startDate ?? new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(goal?.endDate ?? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10));
  const [error, setError] = useState("");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-3">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-dialog-title"
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            const targetValue = unit === "CURRENCY"
              ? parseCurrencyBRToCents(target)
              : Number(target.replace(",", "."));
            if (goal) await updateExecutiveGoalAction(goal.id, { name, targetValue, period, startDate, endDate });
            else await createExecutiveGoalAction({ id: `goal-${crypto.randomUUID()}`, name, category, targetValue, unit, period, startDate, endDate, active: true });
            await onSaved();
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Não foi possível salvar a meta.");
          }
        }}
      >
        <header className="border-b p-4"><h2 id="goal-dialog-title" className="font-semibold">{goal ? "Editar meta" : "Nova meta executiva"}</h2><p className="mt-1 text-xs text-muted-foreground">Defina um objetivo mensurável e um prazo claro.</p></header>
        <div className="grid gap-3 overflow-y-auto p-4 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium sm:col-span-2">Nome da meta<Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Aumentar faturamento mensal" /></label>
          <label className="space-y-1 text-xs font-medium">Categoria<Select value={category} disabled={Boolean(goal)} onChange={(event) => setCategory(event.target.value as GoalCategory)}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label>
          <label className="space-y-1 text-xs font-medium">Unidade<Select value={unit} disabled={Boolean(goal)} onChange={(event) => setUnit(event.target.value as GoalUnit)}>{Object.entries(unitLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label>
          <label className="space-y-1 text-xs font-medium">Valor-Alvo<Input inputMode="decimal" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Ex.: 25000,00" /></label>
          <label className="space-y-1 text-xs font-medium">Período<Select value={period} onChange={(event) => setPeriod(event.target.value as GoalPeriod)}>{Object.entries(periodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label>
          <label className="space-y-1 text-xs font-medium">Data Inicial<Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label className="space-y-1 text-xs font-medium">Data Final<Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          {error ? <p role="alert" className="text-sm text-rose-600 sm:col-span-2">{error}</p> : null}
        </div>
        <footer className="flex justify-end gap-2 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button>Salvar meta</Button></footer>
      </form>
    </div>
  );
}

function formatGoalValue(value: number | undefined, unit: GoalUnit) {
  if (value === undefined) return "Dados Insuficientes";
  if (unit === "CURRENCY") return formatCurrencyBRLFromCents(Math.round(value));
  if (unit === "PERCENTAGE") return formatPercentageBR(value);
  if (unit === "HOURS") return `${formatNumberBR(value, 1)} horas`;
  if (unit === "DAYS") return `${formatNumberBR(value, 0)} dias`;
  return formatNumberBR(value, Number.isInteger(value) ? 0 : 2);
}
