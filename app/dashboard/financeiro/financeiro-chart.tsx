import { BarChart3, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { accountTypeLabels } from "./financeiro-data";
import { formatMoneyCents } from "./financeiro-money";
import type { FinancialAccountWithBalance } from "./financeiro-types";
export type FinancialCashFlowPoint = {
  month: string;
  incomeCents: number;
  expenseCents: number;
  predictedIncomeCents: number;
  predictedExpenseCents: number;
};
const monthLabel = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(new Date(`${value}-15T12:00:00`))
    .replace(".", "");
export function FinanceiroChart({
  cashFlow,
  accounts,
  onNewAccount,
  onEditAccount,
  onSetDefault,
  onArchiveAccount,
}: {
  cashFlow: FinancialCashFlowPoint[];
  accounts: FinancialAccountWithBalance[];
  onNewAccount: () => void;
  onEditAccount: (account: FinancialAccountWithBalance) => void;
  onSetDefault: (account: FinancialAccountWithBalance) => void;
  onArchiveAccount: (account: FinancialAccountWithBalance) => void;
}) {
  const maximum = Math.max(
    ...cashFlow.flatMap((item) => [
      item.incomeCents,
      item.expenseCents,
      item.predictedIncomeCents,
      item.predictedExpenseCents,
    ]),
    1,
  );
  return (
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.45fr)]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Fluxo realizado e previsto
            </p>
            <CardTitle className="mt-1 text-base">
              Receitas e saídas persistidas
            </CardTitle>
          </div>
          <BarChart3 className="h-5 w-5 text-sky-600" />
        </CardHeader>
        <CardContent className="p-4">
          <div className="relative flex h-48 items-end gap-3">
            {cashFlow.length ? (
              cashFlow.map((item) => (
                <div
                  key={item.month}
                  className="flex h-full min-w-0 flex-1 flex-col justify-end"
                >
                  <div className="flex h-full items-end justify-center gap-1.5">
                    <div
                      className="w-full max-w-8 rounded-t bg-emerald-500"
                      style={{ height: `${(item.incomeCents / maximum) * 100}%` }}
                      title={formatMoneyCents(item.incomeCents)}
                    />
                    <div
                      className="w-full max-w-8 rounded-t bg-emerald-300/60"
                      style={{
                        height: `${(item.predictedIncomeCents / maximum) * 100}%`,
                      }}
                      title={`Previsto: ${formatMoneyCents(item.predictedIncomeCents)}`}
                    />
                    <div
                      className="w-full max-w-8 rounded-t bg-rose-300/60"
                      style={{
                        height: `${(item.predictedExpenseCents / maximum) * 100}%`,
                      }}
                      title={`Previsto: ${formatMoneyCents(item.predictedExpenseCents)}`}
                    />
                    <div
                      className="w-full max-w-8 rounded-t bg-rose-400"
                      style={{ height: `${(item.expenseCents / maximum) * 100}%` }}
                      title={formatMoneyCents(item.expenseCents)}
                    />
                  </div>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    {monthLabel(item.month)}
                  </p>
                </div>
              ))
            ) : (
              <p className="m-auto text-sm text-muted-foreground">
                Crie lançamentos para formar o gráfico.
              </p>
            )}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span>
              ● <b className="text-emerald-600">Receitas</b>
            </span>
            <span>
              ● <b className="text-rose-500">Saídas</b>
            </span>
            <span>● Previsto</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contas
            </p>
            <CardTitle className="mt-1 text-base">Saldos derivados</CardTitle>
          </div>
          <Button size="sm" variant="secondary" onClick={onNewAccount}>
            Nova conta
          </Button>
        </CardHeader>
        <CardContent className="divide-y divide-border p-3">
          {accounts.map((account) => (
            <article key={account.id} className="py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{account.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {accountTypeLabels[account.type]}
                    {account.isDefault ? " · Padrão" : ""}
                  </p>
                </div>
                <Landmark className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-sm font-bold">
                {formatMoneyCents(account.currentBalanceCents)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Button size="sm" variant="ghost" onClick={() => onEditAccount(account)}>
                  Editar
                </Button>
                {!account.isDefault && (
                  <Button size="sm" variant="ghost" onClick={() => onSetDefault(account)}>
                    Tornar padrão
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onArchiveAccount(account)}
                >
                  Arquivar
                </Button>
              </div>
            </article>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
