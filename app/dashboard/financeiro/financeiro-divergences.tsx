"use client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { FinancialDivergence } from "./financeiro-reconciliation";
import { formatMoneyCents } from "./financeiro-money";
const labels = {
  MATCHED: "Conciliado",
  ORDER_VALUE_INCREASED: "Valor aumentado",
  ORDER_VALUE_DECREASED: "Valor reduzido",
  ORDER_ARCHIVED: "OS arquivada",
  ORDER_CANCELED: "OS cancelada",
  ORDER_UNAVAILABLE: "OS indisponível",
  MANUALLY_MODIFIED: "Alterado manualmente",
} as const;
export function FinanceiroDivergences({
  items,
  onComplement,
  onCancelOpen,
  onReview,
  onUpdateSnapshot,
}: {
  items: FinancialDivergence[];
  onComplement: (item: FinancialDivergence) => void;
  onCancelOpen: (item: FinancialDivergence) => void;
  onReview: (item: FinancialDivergence) => void;
  onUpdateSnapshot: (item: FinancialDivergence) => void;
}) {
  const divergences = items.filter((item) => item.status !== "MATCHED");
  return (
    <Card className="overflow-hidden">
      <header className="border-b p-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Reconciliação
        </p>
        <h2 className="font-bold">Divergências de Ordens de Serviço</h2>
      </header>
      {divergences.length ? (
        <div className="divide-y">
          {divergences.map((item) => (
            <article
              key={item.transaction.id}
              className="grid gap-3 p-4 lg:grid-cols-[1fr_repeat(4,auto)] lg:items-center"
            >
              <div>
                <p className="font-semibold">
                  {item.transaction.serviceOrderNumberSnapshot} ·{" "}
                  {item.transaction.serviceOrderTitleSnapshot}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.transaction.clientNameSnapshot} · Revisada{" "}
                  {item.transaction.reconciliationReviewedAt
                    ? new Intl.DateTimeFormat("pt-BR").format(
                        new Date(item.transaction.reconciliationReviewedAt),
                      )
                    : "nunca"}
                </p>
                <Badge variant="warning">{labels[item.status]}</Badge>
              </div>
              <Value
                label="OS atual"
                value={
                  item.order
                    ? formatMoneyCents(item.currentOrderValueCents)
                    : "Indisponível"
                }
              />
              <Value label="Emitido" value={formatMoneyCents(item.issuedCents)} />
              <Value
                label="Recebido / saldo"
                value={`${formatMoneyCents(item.paidCents)} / ${formatMoneyCents(item.openCents)}`}
              />
              <div className="flex flex-wrap gap-1">
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/dashboard/ordens/${item.transaction.serviceOrderId}`}>
                    Abrir OS
                  </Link>
                </Button>
                {item.transaction.clientId && (
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/dashboard/clientes/${item.transaction.clientId}`}>
                      Cliente
                    </Link>
                  </Button>
                )}
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/dashboard/financeiro/${item.transaction.id}`}>
                    Recebível
                  </Link>
                </Button>
                {item.status === "ORDER_VALUE_INCREASED" && (
                  <Button size="sm" onClick={() => onComplement(item)}>
                    Criar complemento
                  </Button>
                )}
                {item.openCents > 0 &&
                  (item.status === "ORDER_VALUE_DECREASED" ||
                    item.status === "ORDER_CANCELED") && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onCancelOpen(item)}
                    >
                      Cancelar saldo
                    </Button>
                  )}
                <Button size="sm" variant="ghost" onClick={() => onReview(item)}>
                  Marcar revisado
                </Button>
                {item.order && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onUpdateSnapshot(item)}
                  >
                    Atualizar snapshot
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          className="m-4"
          title="Sem divergências"
          description="Os recebíveis vinculados estão conciliados com suas Ordens."
        />
      )}
    </Card>
  );
}
function Value({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
