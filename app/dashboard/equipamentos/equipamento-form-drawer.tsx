"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyCentsInput, ProperNameInput } from "@/components/ui/br-masked-inputs";
import { formatCurrencyInputBR, parseCurrencyBRToCents } from "@/lib/br-formatters";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  assetTypeLabels,
  conditionLabels,
  ownershipLabels,
  statusLabels,
} from "./equipamentos-data";
import { equipmentFormSchema, type EquipmentFormValues } from "./equipamentos-schema";
import type { EquipmentAsset } from "./equipamentos-types";
const empty: EquipmentFormValues = {
  internalCode: "",
  name: "",
  description: "",
  assetType: "TECHNICAL_EQUIPMENT",
  category: "",
  manufacturer: "",
  model: "",
  serialNumber: "",
  patrimonyNumber: "",
  ownership: "COMPANY",
  responsible: "",
  locationName: "",
  locationRoom: "",
  locationContainer: "",
  locationDescription: "",
  acquisitionDate: "",
  acquisitionValue: "0,00",
  supplier: "",
  invoiceNumber: "",
  purchaseReference: "",
  acquisitionNotes: "",
  depreciationMode: "NONE",
  depreciationStartDate: "",
  usefulLifeMonths: 0,
  residualValue: "0,00",
  status: "AVAILABLE",
  condition: "GOOD",
  notes: "",
  photoMetadata: "",
  documentMetadata: "",
};
const brl = (c: number) => formatCurrencyInputBR(c);
const fromAsset = (a: EquipmentAsset): EquipmentFormValues => ({
  internalCode: a.internalCode,
  name: a.name,
  description: a.description,
  assetType: a.assetType,
  category: a.category,
  manufacturer: a.manufacturer,
  model: a.model,
  serialNumber: a.serialNumber ?? "",
  patrimonyNumber: a.patrimonyNumber ?? "",
  ownership: a.ownership,
  responsible: a.responsible,
  locationName: a.location.name,
  locationRoom: a.location.room ?? "",
  locationContainer: a.location.container ?? "",
  locationDescription: a.location.description ?? "",
  acquisitionDate: a.acquisition.acquisitionDate ?? "",
  acquisitionValue: brl(a.acquisition.acquisitionValueCents),
  supplier: a.acquisition.supplier,
  invoiceNumber: a.acquisition.invoiceNumber,
  purchaseReference: a.acquisition.purchaseReference,
  acquisitionNotes: a.acquisition.notes,
  depreciationMode: a.depreciation.mode,
  depreciationStartDate: a.depreciation.startDate ?? "",
  usefulLifeMonths: a.depreciation.usefulLifeMonths ?? 0,
  residualValue: brl(a.depreciation.residualValueCents),
  status: a.status,
  condition: a.condition,
  notes: a.notes,
  photoMetadata: a.photos.map((x) => x.name).join("\n"),
  documentMetadata: a.documents.map((x) => x.name).join("\n"),
});
export function EquipmentFormDrawer({
  open,
  asset,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  asset?: EquipmentAsset | null;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (v: EquipmentFormValues) => Promise<void>;
}) {
  const [v, setV] = useState(empty),
    [validation, setValidation] = useState("");
  useEffect(() => {
    if (open)
      queueMicrotask(() => {
        setV(asset ? fromAsset(asset) : empty);
        setValidation("");
      });
  }, [asset, open]);
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [busy, onClose, open]);
  if (!open) return null;
  const set = <K extends keyof EquipmentFormValues>(
    k: K,
    value: EquipmentFormValues[K],
  ) => setV((x) => ({ ...x, [k]: value }));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const p = equipmentFormSchema.safeParse(v);
    if (!p.success) {
      setValidation(p.error.issues[0]?.message ?? "Revise os campos.");
      return;
    }
    await onSubmit(p.data);
  };
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-form-title"
        onSubmit={submit}
        className="h-[100dvh] w-full overflow-y-auto border-l bg-background pb-[max(0px,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-3xl"
      >
        <header className="border-b p-5">
          <h2 id="asset-form-title" className="text-lg font-bold">
            {asset ? "Editar equipamento" : "Novo equipamento"}
          </h2>
          <p className="text-xs text-muted-foreground">Ativo ou patrimônio durável.</p>
        </header>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <NameText
            id="asset-name"
            label="Nome"
            value={v.name}
            onChange={(x) => set("name", x)}
            autoFocus
          />
          <Text
            id="asset-code"
            label="Código interno"
            value={v.internalCode}
            onChange={(x) => set("internalCode", x)}
          />
          <Choice
            id="asset-type"
            label="Tipo"
            value={v.assetType}
            options={assetTypeLabels}
            onChange={(x) => set("assetType", x as EquipmentFormValues["assetType"])}
          />
          <Text
            id="asset-category"
            label="Categoria"
            value={v.category}
            onChange={(x) => set("category", x)}
          />
          <Text
            id="asset-manufacturer"
            label="Fabricante"
            value={v.manufacturer}
            onChange={(x) => set("manufacturer", x)}
          />
          <Text
            id="asset-model"
            label="Modelo"
            value={v.model}
            onChange={(x) => set("model", x)}
          />
          <Text
            id="asset-serial"
            label="Número de série"
            value={v.serialNumber}
            onChange={(x) => set("serialNumber", x)}
          />
          <Text
            id="asset-patrimony"
            label="Patrimônio"
            value={v.patrimonyNumber}
            onChange={(x) => set("patrimonyNumber", x)}
          />
          <Choice
            id="asset-owner"
            label="Propriedade"
            value={v.ownership}
            options={ownershipLabels}
            onChange={(x) => set("ownership", x as EquipmentFormValues["ownership"])}
          />
          <NameText
            id="asset-responsible"
            label="Responsável"
            value={v.responsible}
            onChange={(x) => set("responsible", x)}
          />
          <Text
            id="asset-location"
            label="Localização"
            value={v.locationName}
            onChange={(x) => set("locationName", x)}
          />
          <Text
            id="asset-room"
            label="Sala/área"
            value={v.locationRoom}
            onChange={(x) => set("locationRoom", x)}
          />
          <Text
            id="asset-container"
            label="Recipiente/case"
            value={v.locationContainer}
            onChange={(x) => set("locationContainer", x)}
          />
          <Text
            id="asset-acquisition-date"
            label="Aquisição"
            value={v.acquisitionDate}
            type="date"
            onChange={(x) => set("acquisitionDate", x)}
          />
          <MoneyText
            id="asset-value"
            label="Valor de aquisição"
            value={v.acquisitionValue}
            onChange={(x) => set("acquisitionValue", x)}
          />
          <NameText
            id="asset-supplier"
            label="Fornecedor"
            value={v.supplier}
            onChange={(x) => set("supplier", x)}
          />
          <Choice
            id="asset-depreciation"
            label="Depreciação"
            value={v.depreciationMode}
            options={{ LINEAR: "Linear", NONE: "Não depreciável" }}
            onChange={(x) => set("depreciationMode", x as "LINEAR" | "NONE")}
          />
          {v.depreciationMode === "LINEAR" && (
            <>
              <Text
                id="asset-dep-start"
                label="Início da depreciação"
                type="date"
                value={v.depreciationStartDate}
                onChange={(x) => set("depreciationStartDate", x)}
              />
              <Text
                id="asset-life"
                label="Vida útil (meses)"
                type="number"
                value={String(v.usefulLifeMonths)}
                onChange={(x) => set("usefulLifeMonths", Number(x))}
              />
              <MoneyText
                id="asset-residual"
                label="Valor residual"
                value={v.residualValue}
                onChange={(x) => set("residualValue", x)}
              />
            </>
          )}
          <Choice
            id="asset-status"
            label="Status"
            value={v.status}
            options={statusLabels}
            onChange={(x) => set("status", x as EquipmentFormValues["status"])}
          />
          <Choice
            id="asset-condition"
            label="Condição"
            value={v.condition}
            options={conditionLabels}
            onChange={(x) => set("condition", x as EquipmentFormValues["condition"])}
          />
          <Area
            id="asset-description"
            label="Descrição"
            value={v.description}
            onChange={(x) => set("description", x)}
          />
          <Area
            id="asset-notes"
            label="Observações"
            value={v.notes}
            onChange={(x) => set("notes", x)}
          />
          <Area
            id="asset-photos"
            label="Fotos — um nome por linha"
            value={v.photoMetadata}
            onChange={(x) => set("photoMetadata", x)}
          />
          <Area
            id="asset-documents"
            label="Documentos — um nome por linha"
            value={v.documentMetadata}
            onChange={(x) => set("documentMetadata", x)}
          />
          {(validation || error) && (
            <p
              role="alert"
              className="sm:col-span-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
            >
              {validation || error}
            </p>
          )}
        </div>
        <footer className="flex justify-end gap-2 border-t p-5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Salvando..." : "Salvar"}
          </Button>
        </footer>
      </form>
    </div>
  );
}
function Text({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
function NameText({
  id,
  label,
  value,
  onChange,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <ProperNameInput
        id={id}
        value={value}
        onValueChange={onChange}
        autoFocus={autoFocus}
      />
    </div>
  );
}

function MoneyText({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const cents = parseCurrencyBRToCents(value);
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <CurrencyCentsInput
        id={id}
        value={cents}
        onValueChange={(nextCents) => onChange(formatCurrencyInputBR(nextCents))}
      />
    </div>
  );
}

function Area({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
function Choice({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Record<string, string>;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {Object.entries(options).map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </Select>
    </div>
  );
}
