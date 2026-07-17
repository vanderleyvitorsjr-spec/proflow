"use client";

import { useEffect, useRef, useState } from "react";

import {
  BrazilianCepInput,
  BrazilianPhoneInput,
  CpfCnpjInput,
  CurrencyCentsInput,
  ProperNameInput,
} from "@/components/ui/br-masked-inputs";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormSectionIntro, RequiredFieldsNotice } from "@/components/ui/form-guidance";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { normalizeAddressText, normalizeUpperCode } from "@/lib/br-formatters";

import type { SupplierFormValues } from "./fornecedores-schema";
import type { SupplierCategory, SupplierRecord } from "./fornecedores-types";

const categoryLabels: Record<SupplierCategory, string> = {
  CLIMATIZATION: "Climatização",
  ELECTRICAL: "Elétrica",
  REFRIGERATION: "Refrigeração",
  TOOLS: "Ferramentas",
  SAFETY: "Segurança e EPI",
  LOGISTICS: "Logística",
  SERVICES: "Serviços terceirizados",
  OTHER: "Outros",
};

const empty: SupplierFormValues = {
  legalName: "",
  tradeName: "",
  document: "",
  stateRegistration: "",
  municipalRegistration: "",
  contactName: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  categories: ["CLIMATIZATION"],
  paymentTerms: "",
  preferredPaymentMethod: "",
  deliveryLeadTimeDays: 0,
  minimumOrderCents: 0,
  rating: 0,
  status: "ACTIVE",
  notes: "",
};

const toDraft = (supplier?: SupplierRecord): SupplierFormValues =>
  supplier
    ? {
        legalName: supplier.legalName,
        tradeName: supplier.tradeName,
        document: supplier.document ?? "",
        stateRegistration: supplier.stateRegistration ?? "",
        municipalRegistration: supplier.municipalRegistration ?? "",
        contactName: supplier.contactName ?? "",
        phone: supplier.phone ?? "",
        whatsapp: supplier.whatsapp ?? "",
        email: supplier.email ?? "",
        website: supplier.website ?? "",
        zipCode: supplier.zipCode ?? "",
        street: supplier.street ?? "",
        number: supplier.number ?? "",
        complement: supplier.complement ?? "",
        district: supplier.district ?? "",
        city: supplier.city ?? "",
        state: supplier.state ?? "",
        categories: supplier.categories,
        paymentTerms: supplier.paymentTerms ?? "",
        preferredPaymentMethod: supplier.preferredPaymentMethod ?? "",
        deliveryLeadTimeDays: supplier.deliveryLeadTimeDays ?? 0,
        minimumOrderCents: supplier.minimumOrderCents ?? 0,
        rating: supplier.rating ?? 0,
        status: supplier.status === "ARCHIVED" ? "INACTIVE" : supplier.status,
        notes: supplier.notes ?? "",
      }
    : empty;

export function SupplierFormDialog({
  open,
  supplier,
  onClose,
  onSave,
}: {
  open: boolean;
  supplier?: SupplierRecord;
  onClose: () => void;
  onSave: (value: SupplierFormValues, id?: string) => Promise<string | null>;
}) {
  const [draft, setDraft] = useState<SupplierFormValues>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setDraft(toDraft(supplier));
        setError("");
        first.current?.focus();
      });
    }
  }, [open, supplier]);

  if (!open) return null;

  const update = <K extends keyof SupplierFormValues>(
    key: K,
    value: SupplierFormValues[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  const toggleCategory = (category: SupplierCategory) =>
    update(
      "categories",
      draft.categories.includes(category)
        ? draft.categories.filter((item) => item !== category)
        : [...draft.categories, category],
    );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/55"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !saving) onClose();
      }}
    >
      <form
        className="flex h-[100dvh] w-full flex-col overflow-hidden border-l bg-background shadow-2xl sm:max-w-3xl"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          setError("");
          const result = await onSave(draft, supplier?.id);
          setSaving(false);
          if (result) setError(result);
        }}
      >
        <div className="flex items-center justify-between border-b bg-background/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 className="text-lg font-semibold">
              {supplier ? "Editar fornecedor" : "Novo fornecedor"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Cadastre quem fornece materiais, equipamentos ou serviços para a empresa.
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Fechar
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5 pb-28">
          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          ) : null}

          <RequiredFieldsNotice />

          <section>
            <FormSectionIntro
              title="Identificação"
              description="Informe os dados usados em compras, contas a pagar e documentos internos."
            />
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field
                label="Razão social ou nome completo"
                required
                help="Use a razão social da empresa ou o nome completo quando o fornecedor for pessoa física."
              >
                <ProperNameInput
                  ref={first}
                  value={draft.legalName}
                  onValueChange={(value) => update("legalName", value)}
                  required
                />
              </Field>
              <Field
                label="Nome fantasia ou nome de exibição"
                required
                help="Nome curto que aparecerá nas pesquisas e seleções do sistema."
              >
                <ProperNameInput
                  value={draft.tradeName}
                  onValueChange={(value) => update("tradeName", value)}
                  required
                />
              </Field>
              <Field
                label="CPF ou CNPJ"
                help="Documento usado para identificar o fornecedor e evitar cadastros duplicados."
              >
                <CpfCnpjInput
                  value={draft.document}
                  onValueChange={(value) => update("document", value)}
                  placeholder="00.000.000/0000-00"
                />
              </Field>
              <Field
                label="Pessoa de contato"
                help="Nome de quem normalmente atende sua empresa neste fornecedor."
              >
                <ProperNameInput
                  value={draft.contactName}
                  onValueChange={(value) => update("contactName", value)}
                  placeholder="Ex.: Mariana Souza"
                />
              </Field>
              <Field
                label="Inscrição estadual"
                help="Preencha quando a empresa possuir inscrição estadual."
              >
                <Input
                  value={draft.stateRegistration}
                  onChange={(event) => update("stateRegistration", event.target.value)}
                />
              </Field>
              <Field
                label="Inscrição municipal"
                help="Preencha quando a empresa possuir inscrição municipal."
              >
                <Input
                  value={draft.municipalRegistration}
                  onChange={(event) => update("municipalRegistration", event.target.value)}
                />
              </Field>
            </div>
          </section>

          <section>
            <FormSectionIntro
              title="Contato"
              description="Canais usados para solicitar preços, fazer pedidos e acompanhar entregas."
            />
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Telefone" help="Número para ligações comerciais.">
                <BrazilianPhoneInput
                  value={draft.phone}
                  onValueChange={(value) => update("phone", value)}
                  placeholder="(00) 0 0000-0000"
                />
              </Field>
              <Field label="WhatsApp" help="Número usado para orçamentos e acompanhamento de pedidos.">
                <BrazilianPhoneInput
                  value={draft.whatsapp}
                  onValueChange={(value) => update("whatsapp", value)}
                  placeholder="(00) 0 0000-0000"
                />
              </Field>
              <Field label="E-mail" help="E-mail comercial para pedidos, cobranças e documentos.">
                <Input
                  type="email"
                  value={draft.email}
                  onChange={(event) => update("email", event.target.value)}
                  placeholder="compras@fornecedor.com.br"
                />
              </Field>
              <Field label="Site" help="Página oficial ou catálogo on-line do fornecedor.">
                <Input
                  value={draft.website}
                  onChange={(event) => update("website", event.target.value)}
                  placeholder="https://"
                />
              </Field>
            </div>
          </section>

          <section>
            <FormSectionIntro
              title="Endereço"
              description="Local usado para referência comercial, retirada ou devolução de materiais."
            />
            <div className="mt-3 grid gap-4 sm:grid-cols-6">
              <Field className="sm:col-span-2" label="CEP" help="CEP do endereço principal.">
                <BrazilianCepInput
                  value={draft.zipCode}
                  onValueChange={(value) => update("zipCode", value)}
                />
              </Field>
              <Field className="sm:col-span-3" label="Rua, avenida ou logradouro">
                <Input
                  value={draft.street}
                  onChange={(event) => update("street", event.target.value)}
                  onBlur={() => update("street", normalizeAddressText(draft.street))}
                />
              </Field>
              <Field label="Número">
                <Input
                  value={draft.number}
                  onChange={(event) => update("number", event.target.value)}
                />
              </Field>
              <Field className="sm:col-span-2" label="Bairro">
                <ProperNameInput
                  value={draft.district}
                  onValueChange={(value) => update("district", value)}
                />
              </Field>
              <Field className="sm:col-span-2" label="Cidade">
                <ProperNameInput
                  value={draft.city}
                  onValueChange={(value) => update("city", value)}
                />
              </Field>
              <Field label="Estado (UF)" help="Informe a sigla com duas letras. Ex.: BA.">
                <Input
                  maxLength={2}
                  value={draft.state}
                  onChange={(event) =>
                    update("state", normalizeUpperCode(event.target.value).slice(0, 2))
                  }
                />
              </Field>
              <Field label="Complemento">
                <Input
                  value={draft.complement}
                  onChange={(event) => update("complement", event.target.value)}
                  onBlur={() => update("complement", normalizeAddressText(draft.complement))}
                />
              </Field>
            </div>
          </section>

          <section>
            <FormSectionIntro
              title="O que este fornecedor oferece?"
              description="Marque todas as categorias que podem ser compradas ou contratadas."
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(categoryLabels).map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={draft.categories.includes(value as SupplierCategory)}
                    onChange={() => toggleCategory(value as SupplierCategory)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section>
            <FormSectionIntro
              title="Condições comerciais"
              description="Registre condições usuais para comparar fornecedores e planejar compras."
            />
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field
                label="Condição de pagamento"
                help="Prazo normalmente oferecido. Ex.: à vista, 28 dias ou 30/60 dias."
              >
                <Input
                  value={draft.paymentTerms}
                  onChange={(event) => update("paymentTerms", event.target.value)}
                  placeholder="Ex.: 28 dias"
                />
              </Field>
              <Field
                label="Forma de pagamento preferida"
                help="Meio normalmente usado para pagar este fornecedor."
              >
                <Input
                  value={draft.preferredPaymentMethod}
                  onChange={(event) => update("preferredPaymentMethod", event.target.value)}
                  placeholder="Ex.: Boleto ou Pix"
                />
              </Field>
              <Field
                label="Prazo médio de entrega"
                help="Quantidade média de dias entre o pedido e a entrega."
              >
                <Input
                  type="number"
                  min={0}
                  value={draft.deliveryLeadTimeDays ?? 0}
                  onChange={(event) => update("deliveryLeadTimeDays", Number(event.target.value))}
                />
              </Field>
              <Field
                label="Valor mínimo do pedido"
                help="Menor valor aceito pelo fornecedor. Deixe R$ 0,00 quando não houver mínimo."
              >
                <CurrencyCentsInput
                  value={draft.minimumOrderCents ?? 0}
                  onValueChange={(value) => update("minimumOrderCents", value)}
                  aria-label="Valor mínimo do pedido em reais"
                />
              </Field>
              <Field
                label="Avaliação do fornecedor"
                help="Nota interna baseada em preço, qualidade, prazo e atendimento."
              >
                <Select
                  value={String(draft.rating ?? 0)}
                  onChange={(event) => update("rating", Number(event.target.value))}
                >
                  {[0, 1, 2, 3, 4, 4.5, 5].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating === 0
                        ? "Sem avaliação"
                        : `${String(rating).replace(".", ",")} de 5`}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Situação do fornecedor"
                help="Use Requer atenção quando houver atrasos, problemas de qualidade ou pendências."
              >
                <Select
                  value={draft.status}
                  onChange={(event) =>
                    update("status", event.target.value as SupplierFormValues["status"])
                  }
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="ATTENTION">Requer atenção</option>
                  <option value="INACTIVE">Inativo</option>
                </Select>
              </Field>
              <Field
                className="sm:col-span-2"
                label="Observações internas"
                help="Registre contatos alternativos, restrições, acordos ou cuidados importantes."
              >
                <textarea
                  className="min-h-24 w-full rounded-md border bg-card p-3 text-sm"
                  value={draft.notes}
                  onChange={(event) => update("notes", event.target.value)}
                />
              </Field>
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-2 border-t bg-background/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button disabled={saving}>
            {saving ? "Salvando..." : supplier ? "Salvar alterações" : "Cadastrar fornecedor"}
          </Button>
        </div>
      </form>
    </div>
  );
}
