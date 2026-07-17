"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BrazilianCepInput, BrazilianPhoneInput, CpfCnpjInput, ProperNameInput } from "@/components/ui/br-masked-inputs";
import { normalizeAddressText, normalizeProperName, normalizeUpperCode } from "@/lib/br-formatters";

import { clientSchema, type ClientFormInput, type ClientFormValues } from "./cliente-schema";
import type { ClientRecord } from "./clientes-data";

type ClientFormDrawerProps = {
  open: boolean;
  client?: ClientRecord | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: ClientFormValues) => Promise<void>;
};

const defaultValues: ClientFormInput = {
  name: "",
  document: "",
  phone: "",
  whatsapp: "",
  email: "",
  type: "RESIDENTIAL",
  segment: "CLIMATIZATION",
  status: "ACTIVE",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "BA",
  zipCode: "",
  notes: "",
};

function valuesFromClient(client?: ClientRecord | null): ClientFormInput {
  if (!client) return defaultValues;
  return {
    name: client.name,
    document: client.document ?? "",
    phone: client.phone ?? "",
    whatsapp: client.whatsapp ?? "",
    email: client.email ?? "",
    type: client.type,
    segment: client.segment,
    status: client.status,
    street: client.street ?? "Endereço não informado",
    number: client.number ?? "",
    complement: client.complement ?? "",
    district: client.district ?? "",
    city: client.city,
    state: client.state,
    zipCode: client.zipCode ?? "",
    notes: client.notes ?? "",
  };
}

export function ClientFormDrawer({ open, client, saving, onClose, onSubmit }: ClientFormDrawerProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormInput, unknown, ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues,
    mode: "onBlur",
  });

  useEffect(() => {
    if (open) reset(valuesFromClient(client));
  }, [client, open, reset]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open, saving]);

  const values = watch();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" onClick={onClose} aria-label="Fechar formulário" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-form-title"
        className="proflow-scrollbar relative h-full w-full overflow-y-auto border-l border-border bg-background shadow-2xl sm:max-w-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-card/95 px-4 py-3 backdrop-blur sm:px-6">
          <div>
            <h2 id="client-form-title" className="text-base font-semibold text-foreground">
              {client ? "Editar cliente" : "Novo cliente"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Dados cadastrais, contato, classificação e endereço.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} disabled={saving} aria-label="Fechar">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-4 sm:p-6">
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="col-span-full mb-1 text-sm font-semibold text-foreground">Identificação</legend>
            <Field label="Nome ou razão social" htmlFor="client-name" error={errors.name?.message} required className="sm:col-span-2">
              <ProperNameInput id="client-name" autoFocus value={values.name} onValueChange={(value) => setValue("name", value, { shouldValidate: true, shouldDirty: true })} aria-invalid={Boolean(errors.name)} />
            </Field>
            <Field label="Tipo" htmlFor="client-type" error={errors.type?.message} required>
              <Select id="client-type" {...register("type")}><option value="RESIDENTIAL">Residencial</option><option value="COMPANY">Empresa</option><option value="CONDOMINIUM">Condomínio</option></Select>
            </Field>
            <Field label="CPF ou CNPJ" htmlFor="client-document" error={errors.document?.message} description="Usado para prevenir duplicidades.">
              <CpfCnpjInput id="client-document" value={values.document ?? ""} onValueChange={(value) => setValue("document", value, { shouldValidate: true, shouldDirty: true })} aria-invalid={Boolean(errors.document)} />
            </Field>
            <Field label="Segmento" htmlFor="client-segment" error={errors.segment?.message} required>
              <Select id="client-segment" {...register("segment")}><option value="CLIMATIZATION">Climatização</option><option value="ELECTRICAL">Elétrica</option><option value="BOTH">Climatização e elétrica</option></Select>
            </Field>
            <Field label="Status" htmlFor="client-status" error={errors.status?.message} required>
              <Select id="client-status" {...register("status")}><option value="ACTIVE">Ativo</option><option value="RECURRING">Recorrente</option><option value="ATTENTION">Requer atenção</option><option value="INACTIVE">Inativo</option></Select>
            </Field>
          </fieldset>

          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="col-span-full mb-1 text-sm font-semibold text-foreground">Contato</legend>
            <Field label="Telefone" htmlFor="client-phone" error={errors.phone?.message} required><BrazilianPhoneInput id="client-phone" placeholder="(73) 9 8893-6763" value={values.phone} onValueChange={(value) => setValue("phone", value, { shouldValidate: true, shouldDirty: true })} aria-invalid={Boolean(errors.phone)} /></Field>
            <Field label="WhatsApp" htmlFor="client-whatsapp" error={errors.whatsapp?.message}><BrazilianPhoneInput id="client-whatsapp" placeholder="(73) 9 8893-6763" value={values.whatsapp ?? ""} onValueChange={(value) => setValue("whatsapp", value, { shouldValidate: true, shouldDirty: true })} /></Field>
            <Field label="E-mail" htmlFor="client-email" error={errors.email?.message} className="sm:col-span-2"><Input id="client-email" type="email" {...register("email")} aria-invalid={Boolean(errors.email)} /></Field>
          </fieldset>

          <fieldset className="grid gap-3 sm:grid-cols-6">
            <legend className="col-span-full mb-1 text-sm font-semibold text-foreground">Endereço</legend>
            <Field label="Endereço" htmlFor="client-street" error={errors.street?.message} required className="sm:col-span-4"><Input id="client-street" {...register("street")} onBlur={(event) => setValue("street", normalizeAddressText(event.currentTarget.value), { shouldValidate: true, shouldDirty: true })} aria-invalid={Boolean(errors.street)} /></Field>
            <Field label="Número" htmlFor="client-number" error={errors.number?.message} className="sm:col-span-2"><Input id="client-number" {...register("number")} /></Field>
            <Field label="Complemento" htmlFor="client-complement" error={errors.complement?.message} className="sm:col-span-3"><Input id="client-complement" {...register("complement")} /></Field>
            <Field label="Bairro" htmlFor="client-district" error={errors.district?.message} className="sm:col-span-3"><Input id="client-district" {...register("district")} onBlur={(event) => setValue("district", normalizeProperName(event.currentTarget.value), { shouldDirty: true })} /></Field>
            <Field label="Cidade" htmlFor="client-city" error={errors.city?.message} required className="sm:col-span-3"><ProperNameInput id="client-city" value={values.city} onValueChange={(value) => setValue("city", value, { shouldValidate: true, shouldDirty: true })} aria-invalid={Boolean(errors.city)} /></Field>
            <Field label="UF" htmlFor="client-state" error={errors.state?.message} required className="sm:col-span-1"><Input id="client-state" maxLength={2} {...register("state")} onChange={(event) => setValue("state", normalizeUpperCode(event.target.value).slice(0, 2), { shouldValidate: true, shouldDirty: true })} aria-invalid={Boolean(errors.state)} /></Field>
            <Field label="CEP" htmlFor="client-zip" error={errors.zipCode?.message} className="sm:col-span-2"><BrazilianCepInput id="client-zip" value={values.zipCode ?? ""} onValueChange={(value) => setValue("zipCode", value, { shouldValidate: true, shouldDirty: true })} /></Field>
          </fieldset>

          <Field label="Observações" htmlFor="client-notes" error={errors.notes?.message}>
            <textarea id="client-notes" className="min-h-24 w-full rounded-[var(--radius-control)] border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" {...register("notes")} />
          </Field>

          <footer className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-6 sm:px-6">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              {saving ? "Salvando..." : "Salvar cliente"}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
