"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, Plus, Search, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader, PageHeaderActions, PageHeaderContent, PageHeaderHeading, PageHeaderIdentity } from "@/components/ui/page-header";
import type { ProFlowArea } from "@/lib/proflow-service-catalog";
import { proFlowAreaLabels } from "@/lib/proflow-service-catalog";

type Product = { id: string; name: string; category: ProFlowArea | "TOOLS" | "OTHER"; brand: string; priceCents: number; costCents: number; warrantyDays: number; notes: string; active: boolean };
const KEY = "proflow:products:v1";
const labels: Record<Product["category"], string> = { CLIMATIZATION: "Climatização", ELECTRICAL: "Elétrica", IT: "T.I.", TOOLS: "Ferramentas", OTHER: "Outros" };
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const seed: Product[] = [
  { id: "prd-1", name: "Ar-condicionado Split 12.000 BTUs", category: "CLIMATIZATION", brand: "", priceCents: 0, costCents: 0, warrantyDays: 365, notes: "Produto de climatização para composição de orçamento.", active: true },
  { id: "prd-2", name: "Disjuntor bipolar 32 A", category: "ELECTRICAL", brand: "", priceCents: 0, costCents: 0, warrantyDays: 90, notes: "Componente elétrico.", active: true },
  { id: "prd-3", name: "Roteador / access point", category: "IT", brand: "", priceCents: 0, costCents: 0, warrantyDays: 365, notes: "Equipamento de rede para projetos de T.I.", active: true },
];

export default function ProdutosPage() {
  const [items, setItems] = useState<Product[]>(seed);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"ALL" | Product["category"]>("ALL");
  const [editing, setEditing] = useState<Product | null>(null);
  useEffect(() => { try { const raw = localStorage.getItem(KEY); if (raw) setItems(JSON.parse(raw)); } catch {} }, []);
  const saveAll = (next: Product[]) => { setItems(next); localStorage.setItem(KEY, JSON.stringify(next)); };
  const filtered = useMemo(() => items.filter((item) => (category === "ALL" || item.category === category) && (!query.trim() || `${item.name} ${item.brand} ${item.notes}`.toLowerCase().includes(query.toLowerCase()))), [items, query, category]);
  return <div className="space-y-4 pb-20 lg:pb-0">
    <PageHeader><PageHeaderContent><PageHeaderIdentity><Boxes className="h-5 w-5"/><PageHeaderHeading title="Produtos" description="Catálogo de produtos para climatização, elétrica e T.I., com preço, custo e garantia." /></PageHeaderIdentity><PageHeaderActions><Button size="sm" onClick={() => setEditing({ id: crypto.randomUUID(), name: "", category: "CLIMATIZATION", brand: "", priceCents: 0, costCents: 0, warrantyDays: 0, notes: "", active: true })}><Plus className="h-4 w-4"/>Novo produto</Button></PageHeaderActions></PageHeaderContent></PageHeader>
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" placeholder="Buscar produto..." value={query} onChange={(e) => setQuery(e.target.value)}/></div><Select className="sm:w-52" value={category} onChange={(e) => setCategory(e.target.value as typeof category)}><option value="ALL">Todas as categorias</option>{Object.entries(labels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</Select></div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <Card key={item.id}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><Badge variant={item.category === "IT" ? "info" : item.category === "ELECTRICAL" ? "warning" : "neutral"}>{labels[item.category]}</Badge><h2 className="mt-2 font-semibold">{item.name}</h2><p className="text-xs text-muted-foreground">{item.brand || "Marca não informada"}</p></div><Button size="sm" variant="ghost" onClick={() => setEditing(item)}>Editar</Button></div><div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-xs"><div><span className="text-muted-foreground">Venda</span><p className="font-semibold">{item.priceCents ? money.format(item.priceCents/100) : "A definir"}</p></div><div><span className="text-muted-foreground">Garantia</span><p className="font-semibold">{item.warrantyDays ? `${item.warrantyDays} dias` : "Não informada"}</p></div></div></CardContent></Card>)}</div>
    {editing ? <ProductDrawer product={editing} onClose={() => setEditing(null)} onSave={(product) => { const exists = items.some((x) => x.id === product.id); saveAll(exists ? items.map((x) => x.id === product.id ? product : x) : [product, ...items]); setEditing(null); }}/>: null}
  </div>;
}
function ProductDrawer({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (p: Product) => void }) { const [draft,setDraft] = useState(product); return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/55"><section className="h-full w-full max-w-xl overflow-y-auto border-l bg-background shadow-2xl"><header className="sticky top-0 flex items-center justify-between border-b bg-card/95 p-4"><div><h2 className="font-semibold">{product.name ? "Editar produto" : "Novo produto"}</h2><p className="text-xs text-muted-foreground">Dados comerciais, categoria e garantia.</p></div><Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4"/></Button></header><div className="space-y-4 p-4 sm:p-6"><label className="block text-sm font-medium">Produto<Input className="mt-1" value={draft.name} onChange={(e)=>setDraft({...draft,name:e.target.value})}/></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Categoria<Select className="mt-1" value={draft.category} onChange={(e)=>setDraft({...draft,category:e.target.value as Product["category"]})}>{Object.entries(labels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</Select></label><label className="text-sm font-medium">Marca<Input className="mt-1" value={draft.brand} onChange={(e)=>setDraft({...draft,brand:e.target.value})}/></label></div><div className="grid gap-3 sm:grid-cols-3"><label className="text-sm font-medium">Custo (R$)<Input className="mt-1" type="number" min="0" step="0.01" value={(draft.costCents/100).toFixed(2)} onChange={(e)=>setDraft({...draft,costCents:Math.round(Number(e.target.value||0)*100)})}/></label><label className="text-sm font-medium">Venda (R$)<Input className="mt-1" type="number" min="0" step="0.01" value={(draft.priceCents/100).toFixed(2)} onChange={(e)=>setDraft({...draft,priceCents:Math.round(Number(e.target.value||0)*100)})}/></label><label className="text-sm font-medium">Garantia (dias)<Input className="mt-1" type="number" min="0" value={draft.warrantyDays} onChange={(e)=>setDraft({...draft,warrantyDays:Number(e.target.value||0)})}/></label></div><label className="block text-sm font-medium">Observações<textarea className="mt-1 min-h-28 w-full rounded-lg border bg-card p-3 text-sm" value={draft.notes} onChange={(e)=>setDraft({...draft,notes:e.target.value})}/></label></div><footer className="sticky bottom-0 flex justify-end gap-2 border-t bg-background/95 p-4"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={!draft.name.trim()} onClick={()=>onSave(draft)}><Save className="h-4 w-4"/>Salvar produto</Button></footer></section></div> }
