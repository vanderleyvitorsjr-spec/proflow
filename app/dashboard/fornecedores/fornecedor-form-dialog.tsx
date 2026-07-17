"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BrazilianCepInput, BrazilianPhoneInput, CpfCnpjInput, CurrencyCentsInput, ProperNameInput } from "@/components/ui/br-masked-inputs";
import { normalizeAddressText, normalizeUpperCode } from "@/lib/br-formatters";
import type { SupplierFormValues } from "./fornecedores-schema";
import type { SupplierRecord, SupplierCategory } from "./fornecedores-types";

const categoryLabels: Record<SupplierCategory, string> = {
  CLIMATIZATION: "Climatização", ELECTRICAL: "Elétrica", REFRIGERATION: "Refrigeração", TOOLS: "Ferramentas", SAFETY: "Segurança e EPI", LOGISTICS: "Logística", SERVICES: "Serviços terceirizados", OTHER: "Outros",
};

const empty: SupplierFormValues = {
  legalName: "", tradeName: "", document: "", stateRegistration: "", municipalRegistration: "", contactName: "", phone: "", whatsapp: "", email: "", website: "",
  zipCode: "", street: "", number: "", complement: "", district: "", city: "", state: "", categories: ["CLIMATIZATION"], paymentTerms: "", preferredPaymentMethod: "",
  deliveryLeadTimeDays: 0, minimumOrderCents: 0, rating: 0, status: "ACTIVE", notes: "",
};

const toDraft = (supplier?: SupplierRecord): SupplierFormValues => supplier ? {
  legalName: supplier.legalName, tradeName: supplier.tradeName, document: supplier.document ?? "", stateRegistration: supplier.stateRegistration ?? "", municipalRegistration: supplier.municipalRegistration ?? "",
  contactName: supplier.contactName ?? "", phone: supplier.phone ?? "", whatsapp: supplier.whatsapp ?? "", email: supplier.email ?? "", website: supplier.website ?? "", zipCode: supplier.zipCode ?? "",
  street: supplier.street ?? "", number: supplier.number ?? "", complement: supplier.complement ?? "", district: supplier.district ?? "", city: supplier.city ?? "", state: supplier.state ?? "",
  categories: supplier.categories, paymentTerms: supplier.paymentTerms ?? "", preferredPaymentMethod: supplier.preferredPaymentMethod ?? "", deliveryLeadTimeDays: supplier.deliveryLeadTimeDays ?? 0,
  minimumOrderCents: supplier.minimumOrderCents ?? 0, rating: supplier.rating ?? 0, status: supplier.status === "ARCHIVED" ? "INACTIVE" : supplier.status, notes: supplier.notes ?? "",
} : empty;

export function SupplierFormDialog({ open, supplier, onClose, onSave }: { open: boolean; supplier?: SupplierRecord; onClose: () => void; onSave: (value: SupplierFormValues, id?: string) => Promise<string | null>; }) {
  const [draft, setDraft] = useState<SupplierFormValues>(empty), [saving, setSaving] = useState(false), [error, setError] = useState("");
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) queueMicrotask(() => { setDraft(toDraft(supplier)); setError(""); first.current?.focus(); }); }, [open, supplier]);
  if (!open) return null;
  const update = <K extends keyof SupplierFormValues>(key: K, value: SupplierFormValues[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const toggleCategory = (category: SupplierCategory) => update("categories", draft.categories.includes(category) ? draft.categories.filter((item) => item !== category) : [...draft.categories, category]);

  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/55" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
    <form className="h-full w-full overflow-y-auto border-l bg-background shadow-2xl sm:max-w-3xl" onSubmit={async (event) => { event.preventDefault(); setSaving(true); setError(""); const result = await onSave(draft, supplier?.id); setSaving(false); if (result) setError(result); }}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-5 py-4 backdrop-blur">
        <div><h2 className="text-lg font-semibold">{supplier ? "Editar fornecedor" : "Novo fornecedor"}</h2><p className="text-xs text-muted-foreground">Dados cadastrais, comerciais e de atendimento.</p></div>
        <Button type="button" variant="ghost" onClick={onClose}>Fechar</Button>
      </div>
      <div className="space-y-6 p-5">
        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">{error}</div> : null}
        <section><h3 className="text-sm font-semibold">Identificação</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">Razão social ou nome completo<ProperNameInput ref={first} className="mt-1" value={draft.legalName} onValueChange={(value) => update("legalName", value)} required /></label>
          <label className="text-xs font-medium">Nome fantasia ou exibição<ProperNameInput className="mt-1" value={draft.tradeName} onValueChange={(value) => update("tradeName", value)} required /></label>
          <label className="text-xs font-medium">CPF/CNPJ<CpfCnpjInput className="mt-1" value={draft.document} onValueChange={(value) => update("document", value)} placeholder="00.000.000/0000-00" /></label>
          <label className="text-xs font-medium">Contato principal<ProperNameInput className="mt-1" value={draft.contactName} onValueChange={(value) => update("contactName", value)} /></label>
          <label className="text-xs font-medium">Inscrição estadual<Input className="mt-1" value={draft.stateRegistration} onChange={(e) => update("stateRegistration", e.target.value)} /></label>
          <label className="text-xs font-medium">Inscrição municipal<Input className="mt-1" value={draft.municipalRegistration} onChange={(e) => update("municipalRegistration", e.target.value)} /></label>
        </div></section>
        <section><h3 className="text-sm font-semibold">Contato</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">Telefone<BrazilianPhoneInput className="mt-1" value={draft.phone} onValueChange={(value) => update("phone", value)} placeholder="(00) 0 0000-0000" /></label>
          <label className="text-xs font-medium">WhatsApp<BrazilianPhoneInput className="mt-1" value={draft.whatsapp} onValueChange={(value) => update("whatsapp", value)} placeholder="(00) 0 0000-0000" /></label>
          <label className="text-xs font-medium">E-mail<Input className="mt-1" type="email" value={draft.email} onChange={(e) => update("email", e.target.value)} /></label>
          <label className="text-xs font-medium">Site<Input className="mt-1" value={draft.website} onChange={(e) => update("website", e.target.value)} placeholder="https://" /></label>
        </div></section>
        <section><h3 className="text-sm font-semibold">Endereço</h3><div className="mt-3 grid gap-3 sm:grid-cols-6">
          <label className="text-xs font-medium sm:col-span-2">CEP<BrazilianCepInput className="mt-1" value={draft.zipCode} onValueChange={(value) => update("zipCode", value)} /></label>
          <label className="text-xs font-medium sm:col-span-3">Logradouro<Input className="mt-1" value={draft.street} onChange={(e) => update("street", e.target.value)} onBlur={() => update("street", normalizeAddressText(draft.street))} /></label>
          <label className="text-xs font-medium">Número<Input className="mt-1" value={draft.number} onChange={(e) => update("number", e.target.value)} /></label>
          <label className="text-xs font-medium sm:col-span-2">Bairro<ProperNameInput className="mt-1" value={draft.district} onValueChange={(value) => update("district", value)} /></label>
          <label className="text-xs font-medium sm:col-span-2">Cidade<ProperNameInput className="mt-1" value={draft.city} onValueChange={(value) => update("city", value)} /></label>
          <label className="text-xs font-medium">UF<Input className="mt-1" maxLength={2} value={draft.state} onChange={(e) => update("state", normalizeUpperCode(e.target.value).slice(0, 2))} /></label>
          <label className="text-xs font-medium">Complemento<Input className="mt-1" value={draft.complement} onChange={(e) => update("complement", e.target.value)} onBlur={() => update("complement", normalizeAddressText(draft.complement))} /></label>
        </div></section>
        <section><h3 className="text-sm font-semibold">Categorias de fornecimento</h3><div className="mt-3 flex flex-wrap gap-2">{Object.entries(categoryLabels).map(([value, label]) => <label key={value} className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs"><input type="checkbox" checked={draft.categories.includes(value as SupplierCategory)} onChange={() => toggleCategory(value as SupplierCategory)} />{label}</label>)}</div></section>
        <section><h3 className="text-sm font-semibold">Condições comerciais</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">Condição de pagamento<Input className="mt-1" value={draft.paymentTerms} onChange={(e) => update("paymentTerms", e.target.value)} placeholder="Ex.: 28 dias" /></label>
          <label className="text-xs font-medium">Forma preferencial<Input className="mt-1" value={draft.preferredPaymentMethod} onChange={(e) => update("preferredPaymentMethod", e.target.value)} placeholder="Ex.: Boleto" /></label>
          <label className="text-xs font-medium">Prazo médio de entrega (dias)<Input className="mt-1" type="number" min={0} value={draft.deliveryLeadTimeDays ?? 0} onChange={(e) => update("deliveryLeadTimeDays", Number(e.target.value))} /></label>
          <label className="text-xs font-medium">Pedido mínimo (R$)<CurrencyCentsInput className="mt-1" value={draft.minimumOrderCents ?? 0} onValueChange={(value) => update("minimumOrderCents", value)} aria-label="Pedido mínimo em reais" /></label>
          <label className="text-xs font-medium">Avaliação<Select className="mt-1" value={String(draft.rating ?? 0)} onChange={(e) => update("rating", Number(e.target.value))}>{[0,1,2,3,4,4.5,5].map((rating) => <option key={rating} value={rating}>{rating === 0 ? "Sem avaliação" : `${String(rating).replace(".", ",")} de 5`}</option>)}</Select></label>
          <label className="text-xs font-medium">Status<Select className="mt-1" value={draft.status} onChange={(e) => update("status", e.target.value as SupplierFormValues["status"])}><option value="ACTIVE">Ativo</option><option value="ATTENTION">Requer atenção</option><option value="INACTIVE">Inativo</option></Select></label>
          <label className="text-xs font-medium sm:col-span-2">Observações<textarea className="mt-1 min-h-24 w-full rounded-md border bg-card p-3 text-sm" value={draft.notes} onChange={(e) => update("notes", e.target.value)} /></label>
        </div></section>
      </div>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur"><Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={saving}>{saving ? "Salvando..." : supplier ? "Salvar alterações" : "Cadastrar fornecedor"}</Button></div>
    </form>
  </div>;
}
