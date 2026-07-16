"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { PricingTemplateFormValues } from "./precificacao-schema";
import type { PricingTemplate } from "./precificacao-types";
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
export function PricingTemplateDialog({
  open,
  template,
  busy,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  template?: PricingTemplate | null;
  busy: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (input: PricingTemplateFormValues) => Promise<void>;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, busy, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-title"
        className="w-full max-w-2xl rounded-xl border bg-background p-5 shadow-2xl"
      >
        <h2 id="template-title" className="text-lg font-semibold">
          {template ? "Editar template" : "Novo template"}
        </h2>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget),
              rules = {
                taxRateBasisPoints: Math.round(Number(d.get("tax")) * 100),
                taxBasis: "SALE_PRICE" as const,
                taxFixedCents: 0,
                commissionRateBasisPoints: Math.round(Number(d.get("commission")) * 100),
                commissionFixedCents: 0,
                minimumMarginBasisPoints: 0,
                recommendedMarginBasisPoints: Math.round(
                  Number(d.get("recommended")) * 100,
                ),
                premiumMarginBasisPoints: Math.round(Number(d.get("premium")) * 100),
                discountRateBasisPoints: 0,
                discountFixedCents: 0,
                belowMinimumConfirmed: false,
              };
            void onSave({
              code: String(d.get("code")),
              name: String(d.get("name")),
              description: String(d.get("description")),
              serviceType: String(d.get("serviceType")),
              category: String(
                d.get("category"),
              ) as PricingTemplateFormValues["category"],
              components: template?.costComponents ?? [],
              commercialRules: rules,
              active: true,
            });
          }}
        >
          <div>
            <Label htmlFor="template-code">Código</Label>
            <Input
              id="template-code"
              name="code"
              defaultValue={template?.code}
              autoFocus
              required
            />
          </div>
          <div>
            <Label htmlFor="template-name">Nome</Label>
            <Input
              id="template-name"
              name="name"
              defaultValue={template?.name}
              required
            />
          </div>
          <div>
            <Label htmlFor="template-service">Tipo do serviço</Label>
            <Input
              id="template-service"
              name="serviceType"
              defaultValue={template?.serviceType}
              required
            />
          </div>
          <div>
            <Label htmlFor="template-category">Categoria</Label>
            <Select
              id="template-category"
              name="category"
              defaultValue={template?.category ?? "OTHER"}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="template-description">Descrição</Label>
            <Input
              id="template-description"
              name="description"
              defaultValue={template?.description}
            />
          </div>
          <Field
            name="tax"
            label="Imposto (%)"
            value={(template?.commercialRules.taxRateBasisPoints ?? 600) / 100}
          />
          <Field
            name="commission"
            label="Comissão (%)"
            value={(template?.commercialRules.commissionRateBasisPoints ?? 300) / 100}
          />
          <Field
            name="recommended"
            label="Margem recomendada (%)"
            value={(template?.commercialRules.recommendedMarginBasisPoints ?? 3000) / 100}
          />
          <Field
            name="premium"
            label="Margem premium (%)"
            value={(template?.commercialRules.premiumMarginBasisPoints ?? 4000) / 100}
          />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button disabled={busy}>{busy ? "Salvando..." : "Salvar template"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
function Field({ name, label, value }: { name: string; label: string; value: number }) {
  return (
    <div>
      <Label htmlFor={`template-${name}`}>{label}</Label>
      <Input
        id={`template-${name}`}
        name={name}
        type="number"
        min="0"
        step="0.01"
        defaultValue={value}
      />
    </div>
  );
}
