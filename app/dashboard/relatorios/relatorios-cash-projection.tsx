import { CalendarClock } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricItem, MetricStrip } from "@/components/ui/metric-strip";
import { SectionHeader } from "@/components/ui/section-header";
import { formatCurrencyBRLFromCents, formatDateBR } from "@/lib/br-formatters";
import type { CashProjection } from "./analytics/cash-projection-engine";

export function RelatoriosCashProjection({
  projection,
}: {
  projection?: CashProjection;
}) {
  return (
    <Card>
      <CardHeader className="border-b px-4 py-3">
        <SectionHeader
          compact
          title="Projeção financeira"
          description="Contas pendentes com vencimento confirmado. Não representa saldo bancário."
        />
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {!projection?.available ? (
          <EmptyState
            size="compact"
            icon={<CalendarClock className="h-5 w-5" />}
            title="Dados insuficientes para projetar"
            description="A fonte financeira não está disponível."
          />
        ) : (
          <>
            <MetricStrip>
              {projection.windows.map((window) => (
                <MetricItem
                  key={window.days}
                  label={`${window.days} dias`}
                  value={formatCurrencyBRLFromCents(window.balanceCents)}
                  description={`${formatCurrencyBRLFromCents(window.incomeCents)} em entradas · ${formatCurrencyBRLFromCents(window.expenseCents)} em saídas`}
                />
              ))}
              <MetricItem
                label="Vencido a receber"
                value={formatCurrencyBRLFromCents(projection.overdueIncomeCents)}
              />
              <MetricItem
                label="Vencido a pagar"
                value={formatCurrencyBRLFromCents(projection.overdueExpenseCents)}
              />
            </MetricStrip>
            {projection.concentration.length ? (
              <div>
                <h3 className="text-sm font-semibold">Maiores concentrações por data</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                  {projection.concentration.map((item) => (
                    <div key={item.date} className="rounded-lg border px-3 py-2">
                      <p className="text-xs text-muted-foreground">{formatDateBR(item.date)}</p>
                      <p className="font-semibold tabular-nums">{formatCurrencyBRLFromCents(item.amountCents)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
