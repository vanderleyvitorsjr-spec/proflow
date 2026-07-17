"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BrazilianCepInput, BrazilianPhoneInput, CpfCnpjInput, CurrencyReaisInput, ProperNameInput } from "@/components/ui/br-masked-inputs";
import { normalizeAddressText, normalizeUpperCode } from "@/lib/br-formatters";
import { crmStages } from "./crm-data";
import { crmLeadSchema, type CrmLeadFormInput, type CrmLeadFormValues } from "./crm-schema";
import type { CrmLeadRecord } from "./crm-types";
import { listCrmOwners } from "./crm-configuracoes-gateway";
import type { TeamMemberPublicReference } from "@/lib/contracts/configuracoes.contract";

const defaults: CrmLeadFormInput = { name: "", type: "COMPANY", document: "", phone: "", whatsapp: "", email: "", address: "", city: "", state: "BA", zipCode: "", source: "", serviceInterest: "", salesOwner: "", priority: "MEDIUM", estimatedValue: 0, contactDate: new Date().toISOString().slice(0, 10), notes: "", stageId: "new" };

const sourceOptions = [
  "Google",
  "Instagram",
  "Facebook",
  "WhatsApp",
  "Indicação",
  "Cliente antigo",
  "Site",
  "Tráfego pago",
  "Ligação",
  "Visita presencial",
  "Outro",
];

const roleLabels: Record<string, string> = {
  ADMINISTRATOR: "Administrador",
  MANAGER: "Gerente",
  ATTENDANT: "Atendimento",
  SELLER: "Comercial",
  TECHNICIAN: "Técnico",
  ASSISTANT: "Auxiliar",
  ELECTRICIAN: "Eletricista",
  SUPERVISOR: "Supervisor",
  FINANCIAL: "Financeiro",
  OTHER: "Outro",
};
const valuesFromLead = (lead?: CrmLeadRecord | null): CrmLeadFormInput => lead ? { name: lead.name, type: lead.type, document: lead.document, phone: lead.phone, whatsapp: lead.whatsapp, email: lead.email, address: lead.address, city: lead.city, state: lead.state, zipCode: lead.zipCode, source: lead.source, serviceInterest: lead.serviceInterest, salesOwner: lead.salesOwner, priority: lead.priority, estimatedValue: lead.estimatedValue, contactDate: lead.contactDate, notes: lead.notes, stageId: lead.stageId } : defaults;

type Props = { lead?: CrmLeadRecord | null; saving: boolean; onSubmit: (values: CrmLeadFormValues) => Promise<void>; submitLabel?: string };
export function CrmLeadForm({ lead, saving, onSubmit, submitLabel = "Salvar lead" }: Props) {
  const [owners, setOwners] = useState<TeamMemberPublicReference[]>([]), [configurationWarning, setConfigurationWarning] = useState("");
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CrmLeadFormInput, unknown, CrmLeadFormValues>({ resolver: zodResolver(crmLeadSchema), defaultValues: defaults, mode: "onBlur" });
  useEffect(() => { reset(valuesFromLead(lead)); }, [lead, reset]);
  useEffect(() => { void listCrmOwners().then((result) => { setOwners(result.items); setConfigurationWarning(result.warning ?? ""); }); }, []);
  const values = watch();
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <fieldset className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><legend className="col-span-full text-sm font-semibold">Dados e contato</legend>
        <Field label="Nome ou razão social" htmlFor="lead-name" error={errors.name?.message} required><ProperNameInput id="lead-name" autoFocus value={values.name} onValueChange={(value) => setValue("name", value, { shouldValidate: true, shouldDirty: true })} /></Field>
        <Field label="Tipo" htmlFor="lead-type" error={errors.type?.message}><Select id="lead-type" {...register("type")}><option value="INDIVIDUAL">Pessoa física</option><option value="COMPANY">Pessoa jurídica</option></Select></Field>
        <Field label="CPF ou CNPJ" htmlFor="lead-document" error={errors.document?.message}><CpfCnpjInput id="lead-document" value={values.document ?? ""} onValueChange={(value) => setValue("document", value, { shouldValidate: true, shouldDirty: true })} /></Field>
        <Field label="Telefone" htmlFor="lead-phone" error={errors.phone?.message} required><BrazilianPhoneInput id="lead-phone" placeholder="(73) 9 8893-6763" value={values.phone} onValueChange={(value) => setValue("phone", value, { shouldValidate: true, shouldDirty: true })} /></Field>
        <Field label="WhatsApp" htmlFor="lead-whatsapp" error={errors.whatsapp?.message}><BrazilianPhoneInput id="lead-whatsapp" value={values.whatsapp ?? ""} onValueChange={(value) => setValue("whatsapp", value, { shouldValidate: true, shouldDirty: true })} /></Field>
        <Field label="E-mail" htmlFor="lead-email" error={errors.email?.message}><Input id="lead-email" type="email" {...register("email")} /></Field>
      </fieldset>
      <fieldset className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><legend className="col-span-full text-sm font-semibold">Endereço</legend>
        <Field label="Endereço" htmlFor="lead-address" error={errors.address?.message} required className="xl:col-span-2"><Input id="lead-address" {...register("address")} onBlur={(event) => setValue("address", normalizeAddressText(event.currentTarget.value), { shouldValidate: true, shouldDirty: true })} /></Field>
        <Field label="Cidade" htmlFor="lead-city" error={errors.city?.message} required><ProperNameInput id="lead-city" value={values.city} onValueChange={(value) => setValue("city", value, { shouldValidate: true, shouldDirty: true })} /></Field>
        <Field label="UF" htmlFor="lead-state" error={errors.state?.message} required><Input id="lead-state" maxLength={2} {...register("state")} onChange={(event) => setValue("state", normalizeUpperCode(event.target.value).slice(0, 2), { shouldValidate: true, shouldDirty: true })} /></Field>
        <Field label="CEP" htmlFor="lead-zip" error={errors.zipCode?.message}><BrazilianCepInput id="lead-zip" value={values.zipCode ?? ""} onValueChange={(value) => setValue("zipCode", value, { shouldValidate: true, shouldDirty: true })} /></Field>
      </fieldset>
      <fieldset className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><legend className="col-span-full text-sm font-semibold">Informações da oportunidade</legend>
        <Field label="Como conheceu a empresa?" htmlFor="lead-source" error={errors.source?.message} description="Selecione por onde este contato chegou até sua empresa." required>
          <Select id="lead-source" {...register("source")}>
            <option value="">Selecione uma opção</option>
            {values.source && !sourceOptions.includes(values.source) ? <option value={values.source}>{values.source}</option> : null}
            {sourceOptions.map((source) => <option key={source} value={source}>{source}</option>)}
          </Select>
        </Field>
        <Field label="Serviço de interesse" htmlFor="lead-interest" error={errors.serviceInterest?.message} description="Informe o serviço ou a necessidade principal apresentada pelo contato." required><ProperNameInput id="lead-interest" placeholder="Ex.: Instalação de ar-condicionado" value={values.serviceInterest} onValueChange={(value) => setValue("serviceInterest", value, { shouldValidate: true, shouldDirty: true })} /></Field>
        <Field label="Responsável pelo atendimento" htmlFor="lead-owner" error={errors.salesOwner?.message} description="Escolha a pessoa da equipe que acompanhará este contato." required><Select id="lead-owner" {...register("salesOwner")}><option value="">Selecione um integrante da equipe</option>{lead?.salesOwner && !owners.some((item) => item.name === lead.salesOwner) ? <option value={lead.salesOwner}>{lead.salesOwner} (cadastro anterior)</option> : null}{owners.map((item) => <option key={item.id} value={item.name}>{item.name} · {roleLabels[item.role] ?? item.role}</option>)}</Select>{configurationWarning ? <p className="mt-1 text-[11px] text-amber-600">{configurationWarning}</p> : null}{!configurationWarning && owners.length === 0 ? <p className="mt-1 text-[11px] text-amber-600">Nenhum integrante apto foi encontrado. Cadastre ou ative a equipe em Configurações.</p> : null}</Field>
        <Field label="Prioridade" htmlFor="lead-priority" error={errors.priority?.message}><Select id="lead-priority" {...register("priority")}><option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option></Select></Field>
        <Field label="Valor estimado" htmlFor="lead-value" error={errors.estimatedValue?.message}><CurrencyReaisInput id="lead-value" value={Number(values.estimatedValue ?? 0)} onValueChange={(value) => setValue("estimatedValue", value, { shouldValidate: true, shouldDirty: true })} aria-label="Valor estimado em reais" /></Field>
        <Field label="Data de contato" htmlFor="lead-date" error={errors.contactDate?.message}><Input id="lead-date" type="date" {...register("contactDate")} /></Field>
        <Field label="Etapa" htmlFor="lead-stage" error={errors.stageId?.message}><Select id="lead-stage" {...register("stageId")}>{crmStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.title}</option>)}</Select></Field>
        <Field label="Observações" htmlFor="lead-notes" error={errors.notes?.message} className="md:col-span-2"><textarea id="lead-notes" className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm" {...register("notes")} /></Field>
      </fieldset>
      <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Salvando..." : submitLabel}</Button></div>
    </form>
  );
}
