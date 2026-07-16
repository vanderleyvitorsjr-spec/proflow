"use client";
import { Button } from "@/components/ui/button";
import type { StockPurchaseReconciliation } from "./estoque-types";
const labels: Record<StockPurchaseReconciliation, string> = {
  MATCHED: "Valores conciliados",
  PURCHASE_VALUE_INCREASED: "Compra aumentou: gere a diferença",
  PURCHASE_VALUE_DECREASED: "Compra menor que o Financeiro",
  PURCHASE_CANCELED: "Compra cancelada",
  PURCHASE_ARCHIVED: "Compra arquivada",
  FINANCIAL_CANCELED: "Conta a pagar cancelada",
  FINANCIAL_ARCHIVED: "Conta a pagar arquivada",
  FINANCIAL_UNAVAILABLE: "Vínculo financeiro indisponível",
  MANUALLY_MODIFIED: "Vínculo alterado manualmente",
};
export function StockFinancialReconciliation({
  status,
  reviewedAt,
  busy,
  onReview,
}: {
  status: StockPurchaseReconciliation;
  reviewedAt?: string;
  busy: boolean;
  onReview: () => Promise<void>;
}) {
  const ok = status === "MATCHED";
  return (
    <section
      className={`rounded-xl border p-4 ${ok ? "border-emerald-500/25 bg-emerald-500/5" : "border-amber-500/25 bg-amber-500/5"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Conciliação</h2>
          <p className="text-xs text-muted-foreground">
            {labels[status]}
            {reviewedAt
              ? ` · revisada em ${new Date(reviewedAt).toLocaleDateString("pt-BR")}`
              : ""}
          </p>
        </div>
        {!ok ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => void onReview()}
          >
            Marcar revisada
          </Button>
        ) : null}
      </div>
    </section>
  );
}
