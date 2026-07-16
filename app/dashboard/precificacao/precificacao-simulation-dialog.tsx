"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type {
  PricingSimulationFormValues,
  PricingComponentFormValues,
} from "./precificacao-schema";
import type {
  LaborProfile,
  PricingSimulation,
  PricingTemplate,
} from "./precificacao-types";
const categories = [
  "INSTALLATION",
  "MAINTENANCE",
  "CLEANING",
  "COMPONENT_REPLACEMENT",
  "INFRASTRUCTURE",
  "RECURRING",
  "RESIDENTIAL_ELECTRICAL",
  "COMMERCIAL_ELECTRICAL",
  "INSPECTION",
  "OTHER",
] as const;
const types = ["MATERIAL", "LABOR", "EQUIPMENT", "TRAVEL", "OVERHEAD", "OTHER"] as const;
type Line = PricingComponentFormValues & { key: string };
const defaultLine = (type: Line["type"] = "MATERIAL"): Line => ({
  key: crypto.randomUUID(),
  type,
  sourceType: "MANUAL",
  description: "",
  quantity: 1,
  unit: type === "LABOR" ? "hora" : "un",
  unitCostCents: 0,
  fixedAmountCents: 0,
  percentageRateBasisPoints: 0,
  percentageBasis: "NONE",
  wastePercentBasisPoints: 0,
  calculationMode:
    type === "EQUIPMENT" ? "PER_HOUR" : type === "OVERHEAD" ? "FIXED" : "QUANTITY",
  manuallyModified: true,
  notes: "",
  equipmentDetails:
    type === "EQUIPMENT"
      ? { method: "PER_HOUR", maintenanceCents: 0, energyCents: 0, wearCents: 0 }
      : undefined,
  travelDetails:
    type === "TRAVEL"
      ? {
          origin: "",
          destination: "",
          distanceMilliKm: 0,
          estimatedTimeMinutes: 0,
          costPerKmCents: 0,
          tollCents: 0,
          parkingCents: 0,
          lodgingCents: 0,
          mealsCents: 0,
          otherCents: 0,
        }
      : undefined,
  overheadCategory: type === "OVERHEAD" ? "OTHER" : undefined,
});
export function PricingSimulationDialog({
  open,
  simulation,
  templates,
  laborProfiles,
  busy,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  simulation?: PricingSimulation | null;
  templates: PricingTemplate[];
  laborProfiles: LaborProfile[];
  busy: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (input: PricingSimulationFormValues) => Promise<void>;
}) {
  const [lines, setLines] = useState<Line[]>([]);
  useEffect(() => {
    if (open)
      queueMicrotask(() =>
        setLines(
          simulation?.costComponents.map((item) => ({
            ...defaultLine(item.type),
            ...item,
            equipmentDetails:
              item.type === "EQUIPMENT"
                ? {
                    ...defaultLine("EQUIPMENT").equipmentDetails!,
                    ...item.equipmentDetails,
                  }
                : item.equipmentDetails,
            travelDetails:
              item.type === "TRAVEL"
                ? {
                    ...defaultLine("TRAVEL").travelDetails!,
                    ...item.travelDetails,
                  }
                : item.travelDetails,
            key: item.id,
          })) ?? [defaultLine("MATERIAL"), defaultLine("LABOR"), defaultLine("TRAVEL")],
        ),
      );
  }, [open, simulation]);
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, busy, onClose]);
  if (!open) return null;
  const change = (key: string, patch: Partial<Line>) =>
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="simulation-title"
        className="h-full w-full max-w-4xl overflow-y-auto border-l bg-background p-5 shadow-2xl"
      >
        <div className="flex justify-between gap-3">
          <div>
            <h2 id="simulation-title" className="text-lg font-semibold">
              {simulation ? "Editar simulação" : "Nova simulação"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Componentes manuais, regras comerciais e preços derivados.
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-500/30 p-3 text-sm text-red-600"
          >
            {error}
          </p>
        ) : null}
        <form
          className="mt-5 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget),
              rules = {
                taxRateBasisPoints: Math.round(Number(d.get("taxRate")) * 100),
                taxBasis: String(d.get("taxBasis")) as "COST" | "SALE_PRICE" | "FIXED",
                taxFixedCents: Math.round(Number(d.get("taxFixed")) * 100),
                commissionRateBasisPoints: Math.round(
                  Number(d.get("commissionRate")) * 100,
                ),
                commissionFixedCents: Math.round(Number(d.get("commissionFixed")) * 100),
                minimumMarginBasisPoints: Math.round(
                  Number(d.get("minimumMargin")) * 100,
                ),
                recommendedMarginBasisPoints: Math.round(
                  Number(d.get("recommendedMargin")) * 100,
                ),
                premiumMarginBasisPoints: Math.round(
                  Number(d.get("premiumMargin")) * 100,
                ),
                discountRateBasisPoints: Math.round(Number(d.get("discountRate")) * 100),
                discountFixedCents: Math.round(Number(d.get("discountFixed")) * 100),
                belowMinimumConfirmed: d.get("belowMinimumConfirmed") === "on",
              };
            void onSave({
              title: String(d.get("title")),
              templateId: String(d.get("templateId") ?? ""),
              scenarioGroupId: simulation?.scenarioGroupId ?? "",
              scenarioLabel: String(d.get("scenarioLabel")),
              description: String(d.get("description") ?? ""),
              category: String(
                d.get("category"),
              ) as PricingSimulationFormValues["category"],
              components: lines,
              commercialRules: rules,
              status: String(d.get("status")) as "DRAFT" | "READY",
              reverseTargetCents: Math.round(Number(d.get("reverseTarget") || 0) * 100),
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Label htmlFor="pricing-title">Título</Label>
              <Input
                id="pricing-title"
                name="title"
                defaultValue={simulation?.title}
                autoFocus
                required
              />
            </div>
            <div>
              <Label htmlFor="pricing-template">Template</Label>
              <Select
                id="pricing-template"
                name="templateId"
                defaultValue={simulation?.templateId}
              >
                <option value="">Sem template</option>
                {templates
                  .filter((t) => !t.archivedAt)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.code} · {t.name}
                    </option>
                  ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="pricing-scenario">Cenário</Label>
              <Input
                id="pricing-scenario"
                name="scenarioLabel"
                defaultValue={simulation?.scenarioLabel ?? "Cenário A"}
              />
            </div>
            <div>
              <Label htmlFor="pricing-category">Categoria</Label>
              <Select
                id="pricing-category"
                name="category"
                defaultValue={simulation?.parameters.category ?? "OTHER"}
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="pricing-status">Status</Label>
              <Select
                id="pricing-status"
                name="status"
                defaultValue={simulation?.status === "READY" ? "READY" : "DRAFT"}
              >
                <option value="DRAFT">Rascunho</option>
                <option value="READY">Pronta</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="pricing-description">Descrição</Label>
              <Input
                id="pricing-description"
                name="description"
                defaultValue={simulation?.parameters.description}
              />
            </div>
          </div>
          <section className="rounded-xl border">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
              <div>
                <h3 className="text-sm font-semibold">Componentes de custo</h3>
                <p className="text-xs text-muted-foreground">
                  Materiais aceitam perda técnica; equipamento aceita hora ou uso.
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {types.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setLines((current) => [...current, defaultLine(type)])}
                  >
                    + {type}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2 p-3">
              {lines.map((line) => (
                <div
                  key={line.key}
                  className="grid gap-2 rounded-lg bg-muted/35 p-3 md:grid-cols-[8rem_1fr_6rem_6rem_7rem_auto]"
                >
                  <Select
                    aria-label="Tipo do componente"
                    value={line.type}
                    onChange={(e) => {
                      const next = defaultLine(e.target.value as Line["type"]);
                      change(line.key, {
                        type: next.type,
                        unit: next.unit,
                        calculationMode: next.calculationMode,
                        equipmentDetails: next.equipmentDetails,
                        travelDetails: next.travelDetails,
                        overheadCategory: next.overheadCategory,
                      });
                    }}
                  >
                    {types.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </Select>
                  <div>
                    <Input
                      aria-label="Descrição do componente"
                      placeholder="Descrição"
                      value={line.description}
                      onChange={(e) => change(line.key, { description: e.target.value })}
                    />
                    {line.type === "LABOR" && laborProfiles.length ? (
                      <Select
                        aria-label="Perfil de mão de obra"
                        className="mt-1"
                        onChange={(e) => {
                          const profile = laborProfiles.find(
                            (p) => p.id === e.target.value,
                          );
                          if (profile)
                            change(line.key, {
                              description: profile.name,
                              unitCostCents: profile.hourlyCostCents,
                              fixedAmountCents: profile.fixedAdditionalCents,
                              percentageRateBasisPoints: profile.burdenRateBasisPoints,
                            });
                        }}
                      >
                        <option value="">Perfil local...</option>
                        {laborProfiles
                          .filter((p) => p.active)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </Select>
                    ) : null}
                  </div>
                  <Input
                    aria-label="Quantidade"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={Number(line.quantity)}
                    onChange={(e) =>
                      change(line.key, { quantity: Number(e.target.value) })
                    }
                  />
                  <Input
                    aria-label="Unidade"
                    value={line.unit}
                    onChange={(e) => change(line.key, { unit: e.target.value })}
                  />
                  <div>
                    <Input
                      aria-label="Custo unitário em reais"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        line.type === "OVERHEAD" &&
                        ["PERCENT_OF_DIRECT_COST", "ALLOCATION_RATE"].includes(
                          line.calculationMode,
                        )
                          ? Number(line.percentageRateBasisPoints ?? 0) / 100
                          : Number(line.unitCostCents) / 100
                      }
                      onChange={(e) =>
                        change(
                          line.key,
                          line.type === "OVERHEAD" &&
                            ["PERCENT_OF_DIRECT_COST", "ALLOCATION_RATE"].includes(
                              line.calculationMode,
                            )
                            ? {
                                percentageRateBasisPoints: Math.round(
                                  Number(e.target.value) * 100,
                                ),
                              }
                            : {
                                unitCostCents: Math.round(Number(e.target.value) * 100),
                                fixedAmountCents:
                                  line.calculationMode === "FIXED"
                                    ? Math.round(Number(e.target.value) * 100)
                                    : line.fixedAmountCents,
                              },
                        )
                      }
                    />
                    {line.type === "MATERIAL" ? (
                      <Input
                        aria-label="Perda técnica percentual"
                        className="mt-1"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={Number(line.wastePercentBasisPoints ?? 0) / 100}
                        onChange={(e) =>
                          change(line.key, {
                            wastePercentBasisPoints: Math.round(
                              Number(e.target.value) * 100,
                            ),
                          })
                        }
                      />
                    ) : null}
                    {line.type === "EQUIPMENT" ? (
                      <Select
                        aria-label="Método do equipamento"
                        className="mt-1"
                        value={line.calculationMode}
                        onChange={(e) =>
                          change(line.key, {
                            calculationMode: e.target.value as Line["calculationMode"],
                            unit: e.target.value === "PER_USE" ? "uso" : "hora",
                            equipmentDetails: {
                              method:
                                e.target.value === "PER_USE" ? "PER_USE" : "PER_HOUR",
                              maintenanceCents:
                                line.equipmentDetails?.maintenanceCents ?? 0,
                              energyCents: line.equipmentDetails?.energyCents ?? 0,
                              wearCents: line.equipmentDetails?.wearCents ?? 0,
                            },
                          })
                        }
                      >
                        <option value="PER_HOUR">Por hora</option>
                        <option value="PER_USE">Por uso</option>
                      </Select>
                    ) : null}
                    {line.type === "OVERHEAD" ? (
                      <Select
                        aria-label="Método do overhead"
                        className="mt-1"
                        value={line.calculationMode}
                        onChange={(e) =>
                          change(line.key, {
                            calculationMode: e.target.value as Line["calculationMode"],
                          })
                        }
                      >
                        <option value="FIXED">Fixo</option>
                        <option value="PERCENT_OF_DIRECT_COST">% custo direto</option>
                        <option value="PER_HOUR">Por hora</option>
                        <option value="ALLOCATION_RATE">Taxa de rateio</option>
                      </Select>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={lines.length === 1}
                    onClick={() =>
                      setLines((current) =>
                        current.filter((item) => item.key !== line.key),
                      )
                    }
                  >
                    Remover
                  </Button>
                  {line.type === "EQUIPMENT" ? (
                    <div className="grid gap-2 md:col-span-full sm:grid-cols-3">
                      {[
                        ["maintenanceCents", "Manutenção estimada (R$)"],
                        ["energyCents", "Energia estimada (R$)"],
                        ["wearCents", "Desgaste adicional (R$)"],
                      ].map(([field, label]) => (
                        <Input
                          key={field}
                          aria-label={label}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={label}
                          value={
                            Number(
                              line.equipmentDetails?.[
                                field as keyof NonNullable<Line["equipmentDetails"]>
                              ] ?? 0,
                            ) / 100
                          }
                          onChange={(e) =>
                            change(line.key, {
                              equipmentDetails: {
                                method:
                                  line.calculationMode === "PER_USE"
                                    ? "PER_USE"
                                    : "PER_HOUR",
                                maintenanceCents:
                                  line.equipmentDetails?.maintenanceCents ?? 0,
                                energyCents: line.equipmentDetails?.energyCents ?? 0,
                                wearCents: line.equipmentDetails?.wearCents ?? 0,
                                [field]: Math.round(Number(e.target.value) * 100),
                              },
                            })
                          }
                        />
                      ))}
                    </div>
                  ) : null}
                  {line.type === "TRAVEL" ? (
                    <div className="grid gap-2 md:col-span-full sm:grid-cols-2 lg:grid-cols-4">
                      <Input
                        aria-label="Origem"
                        placeholder="Origem"
                        value={line.travelDetails?.origin ?? ""}
                        onChange={(e) =>
                          change(line.key, {
                            travelDetails: {
                              ...line.travelDetails!,
                              origin: e.target.value,
                            },
                          })
                        }
                      />
                      <Input
                        aria-label="Destino"
                        placeholder="Destino"
                        value={line.travelDetails?.destination ?? ""}
                        onChange={(e) =>
                          change(line.key, {
                            travelDetails: {
                              ...line.travelDetails!,
                              destination: e.target.value,
                            },
                          })
                        }
                      />
                      {[
                        ["distanceMilliKm", "Distância (km)", 1000],
                        ["estimatedTimeMinutes", "Tempo estimado (min)", 1],
                        ["costPerKmCents", "Custo por km (R$)", 100],
                        ["tollCents", "Pedágio (R$)", 100],
                        ["parkingCents", "Estacionamento (R$)", 100],
                        ["lodgingCents", "Hospedagem (R$)", 100],
                        ["mealsCents", "Alimentação (R$)", 100],
                        ["otherCents", "Outros (R$)", 100],
                      ].map(([field, label, scale]) => (
                        <Input
                          key={String(field)}
                          aria-label={String(label)}
                          placeholder={String(label)}
                          type="number"
                          min="0"
                          step={Number(scale) === 1 ? "1" : "0.01"}
                          value={
                            Number(
                              line.travelDetails?.[
                                field as keyof NonNullable<Line["travelDetails"]>
                              ] ?? 0,
                            ) / Number(scale)
                          }
                          onChange={(e) =>
                            change(line.key, {
                              travelDetails: {
                                ...line.travelDetails!,
                                [field]: Math.round(
                                  Number(e.target.value) * Number(scale),
                                ),
                              },
                            })
                          }
                        />
                      ))}
                    </div>
                  ) : null}
                  {line.type === "OVERHEAD" ? (
                    <Select
                      aria-label="Categoria do overhead"
                      className="md:col-span-full"
                      value={line.overheadCategory ?? "OTHER"}
                      onChange={(e) =>
                        change(line.key, {
                          overheadCategory: e.target.value as Line["overheadCategory"],
                        })
                      }
                    >
                      <option value="ENERGY">Energia</option>
                      <option value="RENT">Aluguel</option>
                      <option value="INTERNET">Internet</option>
                      <option value="PHONE">Telefone</option>
                      <option value="ACCOUNTING">Contador</option>
                      <option value="SOFTWARE">Software</option>
                      <option value="MARKETING">Marketing</option>
                      <option value="ADMINISTRATIVE">Administrativo</option>
                      <option value="OTHER">Outro</option>
                    </Select>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-xl border p-3">
            <h3 className="text-sm font-semibold">Regras comerciais</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Field
                name="taxRate"
                label="Imposto (%)"
                value={(simulation?.commercialRules.taxRateBasisPoints ?? 600) / 100}
              />
              <div>
                <Label>Base do imposto</Label>
                <Select
                  name="taxBasis"
                  defaultValue={simulation?.commercialRules.taxBasis ?? "SALE_PRICE"}
                >
                  <option value="SALE_PRICE">Preço de venda</option>
                  <option value="COST">Custo</option>
                  <option value="FIXED">Fixo</option>
                </Select>
              </div>
              <Field
                name="commissionRate"
                label="Comissão (%)"
                value={
                  (simulation?.commercialRules.commissionRateBasisPoints ?? 300) / 100
                }
              />
              <Field
                name="commissionFixed"
                label="Comissão fixa (R$)"
                value={(simulation?.commercialRules.commissionFixedCents ?? 0) / 100}
              />
              <Field
                name="minimumMargin"
                label="Margem mínima (%)"
                value={(simulation?.commercialRules.minimumMarginBasisPoints ?? 0) / 100}
              />
              <Field
                name="recommendedMargin"
                label="Margem recomendada (%)"
                value={
                  (simulation?.commercialRules.recommendedMarginBasisPoints ?? 3000) / 100
                }
              />
              <Field
                name="premiumMargin"
                label="Margem premium (%)"
                value={
                  (simulation?.commercialRules.premiumMarginBasisPoints ?? 4000) / 100
                }
              />
              <Field
                name="discountRate"
                label="Desconto (%)"
                value={(simulation?.commercialRules.discountRateBasisPoints ?? 0) / 100}
              />
              <Field
                name="discountFixed"
                label="Desconto fixo (R$)"
                value={(simulation?.commercialRules.discountFixedCents ?? 0) / 100}
              />
              <Field
                name="reverseTarget"
                label="Preço-alvo reverso (R$)"
                value={(simulation?.reversePricingInput?.targetPriceCents ?? 0) / 100}
              />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="belowMinimumConfirmed"
                defaultChecked={simulation?.commercialRules.belowMinimumConfirmed}
              />
              Confirmo preço promocional abaixo do mínimo, se houver.
            </label>
          </section>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button disabled={busy}>{busy ? "Salvando..." : "Salvar simulação"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
function Field({ name, label, value }: { name: string; label: string; value: number }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="number"
        min="0"
        step="0.01"
        defaultValue={value}
      />
    </div>
  );
}
