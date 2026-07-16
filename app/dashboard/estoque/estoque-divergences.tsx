import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StockReservation, StockReservationDivergence } from "./estoque-types";
export function StockDivergence({
  reservation,
  divergence,
  onReview,
  onUpdate,
}: {
  reservation: StockReservation;
  divergence: StockReservationDivergence | null;
  onReview: () => void;
  onUpdate: () => void;
}) {
  if (!divergence) return null;
  return (
    <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2 text-xs">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <Badge variant="warning">{divergence}</Badge>
      </div>
      <p className="mt-1 text-muted-foreground">
        O estado da OS diverge do snapshot da reserva.
      </p>
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="secondary" onClick={onReview}>
          Marcar revisão
        </Button>
        {divergence === "ORDER_UPDATED" ? (
          <Button size="sm" variant="secondary" onClick={onUpdate}>
            Atualizar snapshot
          </Button>
        ) : null}
      </div>
      {reservation.reviewedAt ? (
        <p className="mt-2">
          Revisado em{" "}
          {new Intl.DateTimeFormat("pt-BR").format(new Date(reservation.reviewedAt))}
        </p>
      ) : null}
    </div>
  );
}
