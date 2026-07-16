"use client";

import {
  ArrowRight,
  Calculator,
  Car,
  CircleDollarSign,
  FileText,
  Percent,
  ReceiptText,
  UsersRound,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import type { PricingCalculationInput } from "./precificacao-data";

type PrecificacaoCalculatorProps = {
  values: PricingCalculationInput;
  onChange: (
    field: keyof PricingCalculationInput,
    value: number,
  ) => void;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(
    Number.isFinite(value) ? value : 0,
  );
}

function NumericField({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold text-muted-foreground">
        {label}
      </span>

      <div className="relative">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) =>
            onChange(Number(event.target.value) || 0)
          }
          className="h-9 rounded-[var(--radius-control)] pr-14"
        />

        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

export function PrecificacaoCalculator({
  values,
  onChange,
}: PrecificacaoCalculatorProps) {
  const laborCost =
    values.laborHours *
    values.laborHourlyCost *
    values.technicians;

  const displacementCost =
    values.distanceKm * values.costPerKm;

  const directCost =
    values.materialCost +
    laborCost +
    values.equipmentCost +
    displacementCost +
    values.tollCost +
    values.accommodationCost +
    values.foodCost +
    values.thirdPartyCost;

  const taxAmount = directCost * (values.taxRate / 100);
  const commissionAmount =
    directCost * (values.commissionRate / 100);

  const costBeforeMargin =
    directCost + taxAmount + commissionAmount;

  const marginAmount =
    costBeforeMargin * (values.marginRate / 100);

  const grossPrice = costBeforeMargin + marginAmount;

  const discountAmount =
    grossPrice * (values.discountRate / 100);

  const finalPrice = Math.max(0, grossPrice - discountAmount);
  const estimatedProfit = finalPrice - costBeforeMargin;

  const effectiveMargin =
    finalPrice > 0 ? (estimatedProfit / finalPrice) * 100 : 0;

  return (
    <section className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.45fr)]">
      <Card className="rounded-[var(--radius-card)] border-border bg-card shadow-xs">
        <CardHeader className="border-b border-border px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Composição de custos
              </p>

              <CardTitle className="mt-1 text-lg">
                Calculadora de preço
              </CardTitle>
            </div>

            <div className="rounded-xl bg-sky-50 p-2.5 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
              <Calculator className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Wrench
                className="h-4 w-4 text-sky-600"
                aria-hidden="true"
              />
              <h3 className="text-sm font-bold text-foreground">
                Custos diretos
              </h3>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              <NumericField
                label="Materiais"
                value={values.materialCost}
                suffix="R$"
                onChange={(value) =>
                  onChange("materialCost", value)
                }
              />

              <NumericField
                label="Horas de trabalho"
                value={values.laborHours}
                suffix="h"
                onChange={(value) =>
                  onChange("laborHours", value)
                }
              />

              <NumericField
                label="Custo por hora"
                value={values.laborHourlyCost}
                suffix="R$"
                onChange={(value) =>
                  onChange("laborHourlyCost", value)
                }
              />

              <NumericField
                label="Quantidade de técnicos"
                value={values.technicians}
                onChange={(value) =>
                  onChange("technicians", value)
                }
              />

              <NumericField
                label="Uso de equipamentos"
                value={values.equipmentCost}
                suffix="R$"
                onChange={(value) =>
                  onChange("equipmentCost", value)
                }
              />

              <NumericField
                label="Serviços terceirizados"
                value={values.thirdPartyCost}
                suffix="R$"
                onChange={(value) =>
                  onChange("thirdPartyCost", value)
                }
              />
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <div className="mb-4 flex items-center gap-2">
              <Car
                className="h-4 w-4 text-violet-600"
                aria-hidden="true"
              />
              <h3 className="text-sm font-bold text-foreground">
                Deslocamento e operação
              </h3>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              <NumericField
                label="Distância total"
                value={values.distanceKm}
                suffix="km"
                onChange={(value) =>
                  onChange("distanceKm", value)
                }
              />

              <NumericField
                label="Custo por quilômetro"
                value={values.costPerKm}
                suffix="R$"
                onChange={(value) =>
                  onChange("costPerKm", value)
                }
              />

              <NumericField
                label="Pedágio"
                value={values.tollCost}
                suffix="R$"
                onChange={(value) =>
                  onChange("tollCost", value)
                }
              />

              <NumericField
                label="Hospedagem"
                value={values.accommodationCost}
                suffix="R$"
                onChange={(value) =>
                  onChange("accommodationCost", value)
                }
              />

              <NumericField
                label="Alimentação"
                value={values.foodCost}
                suffix="R$"
                onChange={(value) =>
                  onChange("foodCost", value)
                }
              />
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <div className="mb-4 flex items-center gap-2">
              <Percent
                className="h-4 w-4 text-emerald-600"
                aria-hidden="true"
              />
              <h3 className="text-sm font-bold text-foreground">
                Impostos, comissão e margem
              </h3>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              <NumericField
                label="Impostos"
                value={values.taxRate}
                suffix="%"
                onChange={(value) =>
                  onChange("taxRate", value)
                }
              />

              <NumericField
                label="Comissão"
                value={values.commissionRate}
                suffix="%"
                onChange={(value) =>
                  onChange("commissionRate", value)
                }
              />

              <NumericField
                label="Margem desejada"
                value={values.marginRate}
                suffix="%"
                onChange={(value) =>
                  onChange("marginRate", value)
                }
              />

              <NumericField
                label="Desconto"
                value={values.discountRate}
                suffix="%"
                onChange={(value) =>
                  onChange("discountRate", value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3 xl:sticky xl:top-3">
        <Card className="overflow-hidden rounded-[var(--radius-card)] border-sky-700 bg-[#08182c] text-white shadow-sm">
          <CardContent className="relative p-4">
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-200">
                Preço final sugerido
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight">
                {formatCurrency(finalPrice)}
              </p>

              <p className="mt-2 text-sm text-slate-300">
                Valor considerando custos, encargos, margem e desconto.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
                  <p className="text-[0.65rem] text-slate-400">
                    Lucro estimado
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    {formatCurrency(estimatedProfit)}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
                  <p className="text-[0.65rem] text-slate-400">
                    Margem efetiva
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    {percentageFormatter.format(effectiveMargin)}%
                  </p>
                </div>
              </div>

              <Button className="mt-6 w-full bg-sky-500 text-white hover:bg-sky-400">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Gerar orçamento
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[var(--radius-card)] border-border bg-card shadow-xs">
          <CardHeader className="border-b border-border px-4 py-3">
            <CardTitle className="text-lg">
              Resumo do cálculo
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <UsersRound className="h-4 w-4" aria-hidden="true" />
                Mão de obra
              </span>
              <strong className="text-foreground">
                {formatCurrency(laborCost)}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Car className="h-4 w-4" aria-hidden="true" />
                Deslocamento
              </span>
              <strong className="text-foreground">
                {formatCurrency(displacementCost)}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <ReceiptText className="h-4 w-4" aria-hidden="true" />
                Custos diretos
              </span>
              <strong className="text-foreground">
                {formatCurrency(directCost)}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                Impostos
              </span>
              <strong className="text-foreground">
                {formatCurrency(taxAmount)}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                Comissão
              </span>
              <strong className="text-foreground">
                {formatCurrency(commissionAmount)}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <CircleDollarSign
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Custo total
              </span>
              <strong className="text-foreground">
                {formatCurrency(costBeforeMargin)}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                Margem adicionada
              </span>
              <strong className="text-emerald-600 dark:text-emerald-400">
                {formatCurrency(marginAmount)}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                Desconto
              </span>
              <strong className="text-rose-600 dark:text-rose-400">
                - {formatCurrency(discountAmount)}
              </strong>
            </div>

            <Button type="button" variant="secondary" className="mt-2 w-full">
              Salvar modelo de serviço
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
