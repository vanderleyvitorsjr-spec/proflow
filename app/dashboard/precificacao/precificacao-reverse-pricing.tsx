"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reversePricing } from "./precificacao-selectors";
import type { PricingSimulation } from "./precificacao-types";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function PricingReversePricing({ simulation }: { simulation: PricingSimulation }) {
  const [target, setTarget] = useState(
      (simulation.reversePricingInput?.targetPriceCents ?? 0) / 100,
    ),
    result =
      target > 0
        ? reversePricing(
            simulation.costComponents,
            simulation.commercialRules,
            Math.round(target * 100),
          )
        : null;
  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <h2 className="text-sm font-semibold">Quanto o cliente aceita pagar?</h2>
          <p className="text-xs text-muted-foreground">
            Análise reversa sem alterar os componentes.
          </p>
        </div>
        <div>
          <Label htmlFor="reverse-target">Preço-alvo</Label>
          <Input
            id="reverse-target"
            type="number"
            min="0"
            step="0.01"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
          />
        </div>
        <Button variant="secondary" onClick={() => setTarget(target)}>
          Recalcular
        </Button>
      </div>
      {result ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Custo máximo"
            value={money.format(result.maximumCostCents / 100)}
          />
          <Metric
            label="Lucro resultante"
            value={money.format(result.resultingProfitCents / 100)}
          />
          <Metric
            label="Margem resultante"
            value={`${(result.resultingMarginBasisPoints / 100).toLocaleString("pt-BR")}%`}
          />
          <Metric
            label="Redução necessária"
            value={money.format(result.requiredReductionCents / 100)}
          />
          <div className="sm:col-span-2 lg:col-span-4 rounded-lg bg-muted/40 p-3 text-sm">
            <strong>Maiores impactos:</strong>{" "}
            {result.impactComponents.join(", ") || "Nenhum"}. Recomendações: revisar
            materiais, horas, equipamentos, deslocamento ou margem e recalcular antes de
            decidir.{result.loss ? " O preço-alvo produz prejuízo." : ""}
          </div>
        </div>
      ) : null}
    </section>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
