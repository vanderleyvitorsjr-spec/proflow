"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculatePricing } from "./precificacao-selectors";
import { getPricingDivergencesAction } from "./precificacao-actions";
import { Select } from "@/components/ui/select";
import type { PricingSimulation, PricingTemplate } from "./precificacao-types";
import { ptBrLabel } from "@/lib/pt-br-labels";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function PricingSimulationsList({
  simulations,
  templates,
  onEdit,
  onDuplicate,
  onArchive,
  onScenario,
}: {
  simulations: PricingSimulation[];
  templates: PricingTemplate[];
  onEdit: (item: PricingSimulation) => void;
  onDuplicate: (item: PricingSimulation) => void;
  onArchive: (item: PricingSimulation) => void;
  onScenario: (item: PricingSimulation) => void;
}) {
  const [onlyDivergent, setOnlyDivergent] = useState(false),
    [divergentIds, setDivergentIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    let active = true;
    void Promise.all(
      simulations.map(async (item) => ({
        id: item.id,
        result: await getPricingDivergencesAction(item.id),
      })),
    ).then((entries) => {
      if (!active) return;
      setDivergentIds(
        new Set(
          entries
            .filter(
              (entry) =>
                entry.result.ok &&
                entry.result.data.some((divergence) => divergence.codes.length > 0),
            )
            .map((entry) => entry.id),
        ),
      );
    });
    return () => {
      active = false;
    };
  }, [simulations]);
  if (!simulations.length)
    return (
      <EmptyState
        title="Nenhuma simulação encontrada"
        description="Crie uma simulação ou ajuste os filtros."
      />
    );
  const visible = onlyDivergent
    ? simulations.filter((item) => divergentIds.has(item.id))
    : simulations;
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Select
          aria-label="Filtrar divergências"
          className="w-52"
          value={onlyDivergent ? "DIVERGENT" : "ALL"}
          onChange={(event) => setOnlyDivergent(event.target.value === "DIVERGENT")}
        >
          <option value="ALL">Todas as simulações</option>
          <option value="DIVERGENT">Com divergências</option>
        </Select>
      </div>
      {onlyDivergent && !visible.length ? (
        <EmptyState
          title="Nenhuma divergência"
          description="As origens consultadas estão consistentes."
        />
      ) : (
        <TableFrame>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Simulação</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Cenário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Recomendado</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((item) => {
                const result = calculatePricing(
                    item.costComponents,
                    item.commercialRules,
                  ),
                  template = templates.find((t) => t.id === item.templateId);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/precificacao/${item.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        #{String(item.sequence).padStart(4, "0")} · {item.title}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">
                        v{item.currentVersion} · {item.parameters.category}
                      </p>
                    </TableCell>
                    <TableCell>{template?.name ?? "Manual"}</TableCell>
                    <TableCell>{item.scenarioLabel}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-muted px-2 py-1 text-[11px]">
                        {ptBrLabel(item.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {money.format(result.totalCostCents / 100)}
                    </TableCell>
                    <TableCell className="text-right">
                      {money.format(result.recommendedPriceCents / 100)}
                    </TableCell>
                    <TableCell className="text-right">
                      {(result.effectiveMarginBasisPoints / 100).toLocaleString("pt-BR")}%
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDuplicate(item)}
                        >
                          Duplicar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onScenario(item)}
                        >
                          Cenário
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={Boolean(item.archivedAt)}
                          onClick={() => onArchive(item)}
                        >
                          Arquivar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableFrame>
      )}
    </div>
  );
}
