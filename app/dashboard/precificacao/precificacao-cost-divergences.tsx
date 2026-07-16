"use client";
import { Button } from "@/components/ui/button";
import type { PricingCostDivergence, PricingSimulation } from "./precificacao-types";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function PricingCostDivergences({
  simulation,
  divergences,
  busy,
  onReview,
}: {
  simulation: PricingSimulation;
  divergences: PricingCostDivergence[];
  busy: boolean;
  onReview: (componentId: string, update: boolean) => Promise<void>;
}) {
  const active = divergences.filter((item) => item.codes.length);
  if (!active.length)
    return (
      <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">
        As origens vinculadas estão atualizadas.
      </p>
    );
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="text-sm font-semibold">Divergências das origens</h2>
      <div className="mt-3 space-y-2">
        {active.map((item) => {
          const component = simulation.costComponents.find(
            (candidate) => candidate.id === item.componentId,
          );
          return (
            <article key={item.componentId} className="rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <strong>{component?.description}</strong>
                  <p className="text-xs text-muted-foreground">
                    {item.codes.join(" · ")}
                  </p>
                  <p className="mt-1 text-xs">
                    Usado: {money.format(item.usedCostCents / 100)}
                    {item.currentCostCents !== undefined
                      ? ` · Atual: ${money.format(item.currentCostCents / 100)}`
                      : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void onReview(item.componentId, false)}
                  >
                    Manter valor
                  </Button>
                  <Button
                    size="sm"
                    disabled={busy || Boolean(component?.manuallyModified)}
                    onClick={() => void onReview(item.componentId, true)}
                  >
                    Atualizar custo
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
