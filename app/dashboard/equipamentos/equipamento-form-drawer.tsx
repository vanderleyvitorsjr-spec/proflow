"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
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
import { listEquipmentResponsibles } from "./equipamentos-configuracoes-gateway";
import type { TeamMemberPublicReference } from "@/lib/contracts/configuracoes.contract";
import { teamRoleLabel } from "@/lib/pt-br-labels";
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
  const [team, setTeam] = useState<TeamMemberPublicReference[]>([]);
  const [teamWarning, setTeamWarning] = useState("");
  useEffect(() => {
    if (open)
      queueMicrotask(() => {
        setV(asset ? fromAsset(asset) : empty);
        setValidation("");
      });
    if (open) {
      void listEquipmentResponsibles().then((result) => {
        setTeam(result.items);
        setTeamWarning(result.warning ?? "");
        if (!asset && result.items.length === 1) {
          setV((current) => ({ ...current, responsible: result.items[0].name }));
        }
      });
    }
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
          <p className="text-xs text-muted-foreground">Cadastre ferramentas, instrumentos e equipamentos usados ou acompanhados pela empresa.</p>
        </header>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <NameText
            id="asset-name"
            label="Nome"
            help="Nome pelo qual o equipamento será identificado nas listas e Ordens de Serviço."
            placeholder="Ex.: Bomba de vácuo 12 CFM"
            value={v.name}
            onChange={(x) => set("name", x)}
            autoFocus
          />
          <Text
            id="asset-code"
            label="Código interno"
            help="Código curto usado pela empresa para localizar o equipamento."
            placeholder="Ex.: EQP-0042"
            value={v.internalCode}
            onChange={(x) => set("internalCode", x)}
          />
          <Choice
            id="asset-type"
            label="Tipo"
            help="Escolha o grupo que melhor representa o uso do item."
            value={v.assetType}
            options={assetTypeLabels}
            onChange={(x) => set("assetType", x as EquipmentFormValues["assetType"])}
          />
          <Text
            id="asset-category"
            label="Grupo do equipamento"
            help="Informe uma classificação prática para pesquisa e relatórios."
            placeholder="Ex.: Ferramentas de refrigeração"
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
            help="Código único informado pelo fabricante. Não altere letras ou números."
            placeholder="Ex.: SN-A18472"
            value={v.serialNumber}
            onChange={(x) => set("serialNumber", x)}
          />
          <Text
            id="asset-patrimony"
            label="Patrimônio"
            help="Número usado no controle patrimonial interno, quando existir."
            placeholder="Ex.: PAT-2026-018"
            value={v.patrimonyNumber}
            onChange={(x) => set("patrimonyNumber", x)}
          />
          <Choice
            id="asset-owner"
            label="Propriedade"
            help="Indique se o equipamento pertence à empresa, ao cliente ou a terceiros."
            value={v.ownership}
            options={ownershipLabels}
            onChange={(x) => set("ownership", x as EquipmentFormValues["ownership"])}
          />
          <Field label="Responsável pelo equipamento" htmlFor="asset-responsible" help="Integrante que utiliza, guarda ou acompanha este equipamento.">
            <Select id="asset-responsible" value={v.responsible} onChange={(event) => set("responsible", event.target.value)}>
              <option value="">Sem responsável definido</option>
              {asset?.responsible && !team.some((item) => item.name === asset.responsible) ? <option value={asset.responsible}>{asset.responsible} · cadastro anterior</option> : null}
              {team.map((item) => <option key={item.id} value={item.name}>{item.name} · {teamRoleLabel(item.role)}</option>)}
            </Select>
            {teamWarning ? <p className="text-xs text-amber-600">{teamWarning}</p> : null}
          </Field>
          <Text
            id="asset-location"
            label="Localização"
            help="Local principal onde o equipamento fica guardado ou instalado."
            placeholder="Ex.: Almoxarifado central"
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
            help="Depreciação representa a redução contábil do valor do equipamento ao longo do tempo."
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
                help="Período estimado de uso antes de o equipamento atingir seu valor residual."
                type="number"
                value={String(v.usefulLifeMonths)}
                onChange={(x) => set("usefulLifeMonths", Number(x))}
              />
              <MoneyText
                id="asset-residual"
                label="Valor residual"
                help="Valor estimado do equipamento ao final da vida útil."
                value={v.residualValue}
                onChange={(x) => set("residualValue", x)}
              />
            </>
          )}
          <Choice
            id="asset-status"
            label="Status"
            help="Situação atual de disponibilidade e uso do equipamento."
            value={v.status}
            options={statusLabels}
            onChange={(x) => set("status", x as EquipmentFormValues["status"])}
          />
          <Choice
            id="asset-condition"
            label="Condição"
            help="Estado físico e operacional observado no momento."
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
  help,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoFocus?: boolean;
  help?: string;
  placeholder?: string;
}) {
  return (
    <Field label={label} htmlFor={id} help={help}>
      <Input
        id={id}
        type={type}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
function NameText({
  id,
  label,
  value,
  onChange,
  autoFocus,
  help,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  help?: string;
  placeholder?: string;
}) {
  return (
    <Field label={label} htmlFor={id} help={help}>
      <ProperNameInput
        id={id}
        value={value}
        onValueChange={onChange}
        autoFocus={autoFocus}
        placeholder={placeholder}
      />
    </Field>
  );
}

function MoneyText({
  id,
  label,
  value,
  onChange,
  help,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  help?: string;
}) {
  const cents = parseCurrencyBRToCents(value);
  return (
    <Field label={label} htmlFor={id} help={help}>
      <CurrencyCentsInput
        id={id}
        value={cents}
        onValueChange={(nextCents) => onChange(formatCurrencyInputBR(nextCents))}
      />
    </Field>
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
  help,
}: {
  id: string;
  label: string;
  value: string;
  options: Record<string, string>;
  onChange: (v: string) => void;
  help?: string;
}) {
  return (
    <Field label={label} htmlFor={id} help={help}>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {Object.entries(options).map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </Select>
    </Field>
  );
}
