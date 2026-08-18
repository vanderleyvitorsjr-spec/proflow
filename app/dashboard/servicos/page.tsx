"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Wrench, X, Save, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PageHeaderActions, PageHeaderContent, PageHeaderHeading, PageHeaderIdentity } from "@/components/ui/page-header";
import { defaultProFlowServices, proFlowAreaLabels, type ProFlowArea, type ProFlowServiceCatalogItem } from "@/lib/proflow-service-catalog";

const STORAGE_KEY = "proflow:service-catalog:v1";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function loadCatalog() {
  if (typeof window === "undefined") return defaultProFlowServices;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProFlowServices;
    const parsed = JSON.parse(raw) as ProFlowServiceCatalogItem[];
    if (!Array.isArray(parsed)) return defaultProFlowServices;
    const storedIds = new Set(parsed.map((item) => item.id));
    const missingDefaults = defaultProFlowServices.filter((item) => !storedIds.has(item.id));
    return [...parsed, ...missingDefaults];
  } catch {
    return defaultProFlowServices;
  }
}

export default function ServicosPage() {
  const [items, setItems] = useState<ProFlowServiceCatalogItem[]>(defaultProFlowServices);
  const [search, setSearch] = useState("");
  const [area, setArea] = useState<"ALL" | ProFlowArea>("ALL");
  const [editing, setEditing] = useState<ProFlowServiceCatalogItem | null>(null);

  useEffect(() => setItems(loadCatalog()), []);
  function persist(next: ProFlowServiceCatalogItem[]) {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  const filtered = useMemo(() => items.filter((item) => {
    const matchesArea = area === "ALL" || item.area === area;
    const q = search.trim().toLocaleLowerCase("pt-BR");
    const matchesSearch = !q || `${item.name} ${item.description}`.toLocaleLowerCase("pt-BR").includes(q);
    return matchesArea && matchesSearch;
  }), [items, search, area]);

  return <div className="space-y-4 pb-20 lg:pb-0">
    <PageHeader><PageHeaderContent><PageHeaderIdentity><Wrench className="h-5 w-5"/><PageHeaderHeading title="Serviços" description="Catálogo operacional para Climatização, Elétrica e T.I., pronto para uso em orçamentos e ordens." /></PageHeaderIdentity><PageHeaderActions><Button size="sm" onClick={() => setEditing({ id: crypto.randomUUID(), name: "", area: "CLIMATIZATION", description: "", unit: "SERVICE", priceCents: 0, warrantyDays: 0, checklist: [], active: true })}><Plus className="h-4 w-4"/>Novo serviço</Button></PageHeaderActions></PageHeaderContent></PageHeader>

    <section className="grid gap-3 sm:grid-cols-3">
      {(["CLIMATIZATION", "ELECTRICAL", "IT"] as const).map((key) => <Card key={key}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{proFlowAreaLabels[key]}</p><p className="mt-1 text-2xl font-bold">{items.filter((item) => item.area === key && item.active).length}</p><p className="text-xs text-muted-foreground">serviços ativos</p></CardContent></Card>)}
    </section>

    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" placeholder="Buscar serviço..." value={search} onChange={(e) => setSearch(e.target.value)}/></div>
      <Select className="sm:w-52" value={area} onChange={(e) => setArea(e.target.value as "ALL" | ProFlowArea)}><option value="ALL">Todas as áreas</option><option value="CLIMATIZATION">Climatização</option><option value="ELECTRICAL">Elétrica</option><option value="IT">T.I.</option></Select>
    </div>

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <Card key={item.id} className="overflow-hidden"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Badge variant={item.area === "IT" ? "info" : item.area === "ELECTRICAL" ? "warning" : "success"}>{proFlowAreaLabels[item.area]}</Badge><h2 className="mt-2 font-semibold">{item.name}</h2></div><Button size="sm" variant="ghost" onClick={() => setEditing(item)}>Editar</Button></div><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p><div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-xs"><div><span className="text-muted-foreground">Preço padrão</span><p className="font-semibold">{item.priceCents ? money.format(item.priceCents / 100) : "Definir ao orçar"}</p></div><div><span className="text-muted-foreground">Garantia</span><p className="font-semibold">{item.warrantyDays ? `${item.warrantyDays} dias` : "Sem padrão"}</p></div></div><div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><ListChecks className="h-4 w-4"/>{item.checklist.length} itens de checklist</div></CardContent></Card>)}</div>

    {editing ? <ServiceDrawer item={editing} onClose={() => setEditing(null)} onSave={(item) => { const exists = items.some((entry) => entry.id === item.id); persist(exists ? items.map((entry) => entry.id === item.id ? item : entry) : [item, ...items]); setEditing(null); }} /> : null}
  </div>;
}

function ServiceDrawer({ item, onClose, onSave }: { item: ProFlowServiceCatalogItem; onClose: () => void; onSave: (item: ProFlowServiceCatalogItem) => void }) {
  const [draft, setDraft] = useState(item);
  const checklistText = draft.checklist.join("\n");
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/55"><section className="h-full w-full max-w-xl overflow-y-auto border-l bg-background shadow-2xl"><header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 px-4 py-3"><div><h2 className="font-semibold">{item.name ? "Editar serviço" : "Novo serviço"}</h2><p className="text-xs text-muted-foreground">Defina preço, garantia e checklist padrão.</p></div><Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4"/></Button></header><div className="space-y-4 p-4 sm:p-6">
    <label className="block text-sm font-medium">Nome<Input className="mt-1" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}/></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Área<Select className="mt-1" value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value as ProFlowArea })}><option value="CLIMATIZATION">Climatização</option><option value="ELECTRICAL">Elétrica</option><option value="IT">T.I.</option></Select></label><label className="text-sm font-medium">Unidade<Select className="mt-1" value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value as ProFlowServiceCatalogItem["unit"] })}><option value="SERVICE">Serviço</option><option value="HOUR">Hora</option><option value="UNIT">Unidade</option></Select></label></div>
    <label className="block text-sm font-medium">Descrição<textarea className="mt-1 min-h-24 w-full rounded-lg border bg-card p-3 text-sm" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}/></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Preço padrão (R$)<Input className="mt-1" type="number" step="0.01" min="0" value={(draft.priceCents / 100).toFixed(2)} onChange={(e) => setDraft({ ...draft, priceCents: Math.round(Number(e.target.value || 0) * 100) })}/></label><label className="text-sm font-medium">Garantia (dias)<Input className="mt-1" type="number" min="0" value={draft.warrantyDays} onChange={(e) => setDraft({ ...draft, warrantyDays: Number(e.target.value || 0) })}/></label></div>
    <label className="block text-sm font-medium">Checklist padrão<textarea className="mt-1 min-h-40 w-full rounded-lg border bg-card p-3 text-sm" value={checklistText} onChange={(e) => setDraft({ ...draft, checklist: e.target.value.split("\n").map((line) => line.trim()).filter(Boolean) })}/><span className="mt-1 block text-xs text-muted-foreground">Um item por linha.</span></label>
  </div><footer className="sticky bottom-0 flex justify-end gap-2 border-t bg-background/95 p-4"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={!draft.name.trim()} onClick={() => onSave(draft)}><Save className="h-4 w-4"/>Salvar serviço</Button></footer></section></div>;
}
