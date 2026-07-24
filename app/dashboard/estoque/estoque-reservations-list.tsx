import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StockDivergence } from "./estoque-divergences";
import { reservationRemaining } from "./estoque-selectors";
import type { StockReservation, StockReservationDivergence } from "./estoque-types";
import { ptBrLabel } from "@/lib/pt-br-labels";
export function StockReservationsList({
  reservations,
  divergences,
  unitScale,
  unitLabel,
  onConsume,
  onRelease,
  onReview,
}: {
  reservations: StockReservation[];
  divergences: Record<string, StockReservationDivergence | null>;
  unitScale: number;
  unitLabel: string;
  onConsume: (r: StockReservation) => void;
  onRelease: (r: StockReservation) => void;
  onReview: (r: StockReservation, update: boolean) => void;
}) {
  if (!reservations.length)
    return (
      <EmptyState
        size="compact"
        title="Nenhuma reserva"
        description="As reservas vinculadas a Ordens aparecerão aqui."
      />
    );
  return (
    <div className="space-y-2">
      {reservations.map((r) => {
        const remaining = reservationRemaining(r);
        const quantity = (value: number) =>
          `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value / unitScale)} ${unitLabel}`;
        return (
          <article key={r.id} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link
                  href={`/dashboard/ordens/${r.serviceOrderId}`}
                  className="text-sm font-bold text-sky-600"
                >
                  {r.serviceOrderNumberSnapshot}
                </Link>
                <p className="text-sm">{r.serviceOrderTitleSnapshot}</p>
                <p className="text-xs text-muted-foreground">{r.purpose}</p>
              </div>
              <Badge variant={divergences[r.id] ? "warning" : "outline"}>
                {ptBrLabel(divergences[r.id] ?? r.status)}
              </Badge>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
              <span>
                Reservado<strong className="block">{quantity(r.quantity)}</strong>
              </span>
              <span>
                Consumido<strong className="block">{quantity(r.consumedQuantity)}</strong>
              </span>
              <span>
                Liberado<strong className="block">{quantity(r.releasedQuantity)}</strong>
              </span>
              <span>
                Saldo<strong className="block">{quantity(remaining)}</strong>
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onConsume(r)} disabled={remaining <= 0}>
                Consumir
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onRelease(r)}
                disabled={remaining <= 0}
              >
                Liberar
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href={`/dashboard/ordens/${r.serviceOrderId}`}>Abrir OS</Link>
              </Button>
            </div>
            <StockDivergence
              reservation={r}
              divergence={divergences[r.id] ?? null}
              onReview={() => onReview(r, false)}
              onUpdate={() => onReview(r, true)}
            />
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer font-medium">
                Histórico da reserva
              </summary>
              <div className="mt-2 space-y-1">
                {r.history
                  .slice()
                  .reverse()
                  .map((h) => (
                    <p key={h.id}>{h.description}</p>
                  ))}
              </div>
            </details>
          </article>
        );
      })}
    </div>
  );
}
