"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, Boxes, Copy, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableActionsCell, TableBody, TableCell, TableHead, TableHeader, TableNumericCell, TableRow } from "@/components/ui/table";
import { formatCurrencyBRLFromCents, parseCurrencyBRToCents } from "@/lib/br-formatters";
import { ptBrLabel } from "@/lib/pt-br-labels";
import type { StockPricingReference } from "@/lib/contracts/estoque.contract";
import type { CatalogService } from "@/app/dashboard/precificacao/catalogo-servicos-domain";
import { serviceSnapshot } from "@/app/dashboard/precificacao/catalogo-servicos-domain";
import {
  calculateQuoteItem, duplicateQuoteItem, reorderQuoteItems,
  type QuoteItem, type QuoteItemCategory, type QuoteUnit,
} from "./orcamentos-domain";

const units: QuoteUnit[] = ["UNIT", "HOUR", "DAY", "METER", "SQUARE_METER", "KILOGRAM", "LITER", "BOX", "ROLL", "SET", "SERVICE", "OTHER"];
const categories: QuoteItemCategory[] = ["SERVICE", "MATERIAL", "LABOR", "TRAVEL", "FEE", "EXPENSE", "DISCOUNT", "FREE"];
const normalizeSearch = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");
const stockUnit = (unit: string): QuoteUnit => {
  const value = normalizeSearch(unit);
  if (value.includes("metro")) return "METER";
  if (value.includes("quilo") || value === "kg") return "KILOGRAM";
  if (value.includes("litro")) return "LITER";
  if (value.includes("caixa")) return "BOX";
  if (value.includes("rolo")) return "ROLL";
  return "UNIT";
};

export function OrcamentoItensEditor({ items, services, materials, locked, onChange, onMessage }: {
  items: QuoteItem[];
  services: CatalogService[];
  materials: StockPricingReference[];
  locked: boolean;
  onChange: (items: QuoteItem[]) => void;
  onMessage: (message: string) => void;
}) {
  const [picker, setPicker] = useState<"services" | "materials" | null>(null);
  const [search, setSearch] = useState("");
  const filteredServices = useMemo(() => services.filter((service) => normalizeSearch([service.name, service.category, service.description].join(" ")).includes(normalizeSearch(search))), [search, services]);
  const filteredMaterials = useMemo(() => materials.filter((material) => normalizeSearch([material.internalCode, material.name, material.unit].join(" ")).includes(normalizeSearch(search))), [materials, search]);

  const update = (id: string, changes: Partial<QuoteItem>) => {
    try {
      onChange(items.map((item) => item.id === id ? calculateQuoteItem({ ...item, ...changes } as Omit<QuoteItem, "totalCents">) : item));
      onMessage("");
    } catch (cause) { onMessage(cause instanceof Error ? cause.message : "Não foi possível atualizar o item."); }
  };
  const addManual = (category: QuoteItemCategory, description: string, unit: QuoteUnit) => {
    const item = calculateQuoteItem({ id: crypto.randomUUID(), description, category, quantity: 1, unit, unitPriceCents: 0, estimatedCostCents: 0, marginBasisPoints: 0, discountCents: 0, notes: "", order: items.length });
    onChange([...items, item]);
  };
  const addService = (service: CatalogService) => {
    const snapshot = serviceSnapshot(service);
    const item = calculateQuoteItem({
      id: crypto.randomUUID(), sourceId: service.id,
      sourceSnapshot: { kind: "CATALOG_SERVICE", code: service.code, name: service.name, description: service.description, unit: service.unit, unitPriceCents: service.basePriceCents, estimatedCostCents: service.estimatedCostCents, capturedAt: snapshot.capturedAt },
      description: service.name, notes: service.description, category: "SERVICE", quantity: 1, unit: "SERVICE",
      unitPriceCents: service.basePriceCents, estimatedCostCents: service.estimatedCostCents,
      marginBasisPoints: service.desiredMarginBasisPoints, discountCents: 0, order: items.length,
    });
    onChange([...items, item]); setPicker(null); setSearch("");
  };
  const addMaterial = (material: StockPricingReference) => {
    const item = calculateQuoteItem({
      id: crypto.randomUUID(), sourceId: material.id,
      sourceSnapshot: { kind: "STOCK_ITEM", code: material.internalCode, name: material.name, unit: material.unit, estimatedCostCents: material.averageCostCents, capturedAt: new Date().toISOString() },
      description: material.name, category: "MATERIAL", quantity: 1, unit: stockUnit(material.unit),
      unitPriceCents: 0, estimatedCostCents: material.averageCostCents, marginBasisPoints: 0, discountCents: 0,
      notes: "", order: items.length,
    });
    onChange([...items, item]); setPicker(null); setSearch("");
  };
  const actions = (item: QuoteItem) => <div className="flex justify-end gap-1">
    <Button variant="ghost" size="icon" disabled={locked || item.order === 0} aria-label="Mover item para cima" onClick={() => onChange(reorderQuoteItems(items, item.id, -1))}><ArrowUp className="size-3" /></Button>
    <Button variant="ghost" size="icon" disabled={locked || item.order === items.length - 1} aria-label="Mover item para baixo" onClick={() => onChange(reorderQuoteItems(items, item.id, 1))}><ArrowDown className="size-3" /></Button>
    <Button variant="ghost" size="icon" disabled={locked} aria-label="Duplicar item" onClick={() => onChange(duplicateQuoteItem(items, item.id, crypto.randomUUID()))}><Copy className="size-3" /></Button>
    <Button variant="ghost" size="icon" disabled={locked} aria-label="Remover item" onClick={() => onChange(items.filter((entry) => entry.id !== item.id).map((entry, order) => ({ ...entry, order })))}><Trash2 className="size-3" /></Button>
  </div>;

  return <section className="space-y-4 rounded-xl border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-sm font-semibold">Itens do Orçamento</h2><p className="text-xs text-muted-foreground">Adicione itens cadastrados ou monte o orçamento livremente.</p></div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={locked} onClick={() => { setPicker("services"); setSearch(""); }}><BookOpen className="size-3" />Serviço do Catálogo</Button>
        <Button size="sm" variant="secondary" disabled={locked} onClick={() => addManual("SERVICE", "Novo Serviço", "SERVICE")}><Plus className="size-3" />Serviço Manual</Button>
        <Button size="sm" variant="secondary" disabled={locked} onClick={() => { setPicker("materials"); setSearch(""); }}><Boxes className="size-3" />Material</Button>
        <Button size="sm" variant="secondary" disabled={locked} onClick={() => addManual("FREE", "Novo Item", "UNIT")}><Plus className="size-3" />Item Livre</Button>
      </div>
    </div>
    {locked ? <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">Este orçamento já foi emitido. Crie uma nova versão para alterar seus itens sem destruir o histórico comercial.</p> : null}
    {picker ? <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={picker === "services" ? "Buscar serviço..." : "Buscar material..."} autoFocus /></div><Button size="sm" variant="ghost" onClick={() => setPicker(null)}>Fechar</Button></div>
      {picker === "services" ? services.length ? <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">{filteredServices.map((service) => <button type="button" key={service.id} onClick={() => addService(service)} className="rounded-lg border bg-card p-3 text-left hover:border-primary"><strong className="block text-sm">{service.name}</strong><span className="text-xs text-muted-foreground">{ptBrLabel(service.category)} · {service.unit}</span><p className="line-clamp-2 text-xs text-muted-foreground">{service.description}</p><span className="mt-2 block text-sm font-semibold">{formatCurrencyBRLFromCents(service.basePriceCents)}</span></button>)}</div> : <div className="rounded-lg border border-dashed p-5 text-center"><strong className="block text-sm">Nenhum serviço cadastrado.</strong><p className="mt-1 text-xs text-muted-foreground">Você pode continuar criando o orçamento manualmente.</p><div className="mt-3 flex justify-center gap-2"><Button asChild size="sm" variant="secondary"><Link href="/dashboard/precificacao/servicos">Cadastrar serviço</Link></Button><Button size="sm" onClick={() => { addManual("SERVICE", "Novo Serviço", "SERVICE"); setPicker(null); }}>Adicionar serviço manual</Button></div></div>
      : materials.length ? <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">{filteredMaterials.map((material) => <button type="button" key={material.id} onClick={() => addMaterial(material)} className="rounded-lg border bg-card p-3 text-left hover:border-primary"><strong className="block text-sm">{material.name}</strong><span className="text-xs text-muted-foreground">{material.internalCode} · {material.unit}</span><p className="mt-2 text-xs">Custo médio interno: {formatCurrencyBRLFromCents(material.averageCostCents)}</p></button>)}</div> : <div className="rounded-lg border border-dashed p-5 text-center"><strong className="block text-sm">Nenhum material cadastrado no estoque.</strong><p className="mt-1 text-xs text-muted-foreground">Adicione um material manual sem movimentar o estoque.</p><Button className="mt-3" size="sm" onClick={() => { addManual("MATERIAL", "Novo Material", "UNIT"); setPicker(null); }}>Adicionar material manual</Button></div>}
    </div> : null}
    {!items.length ? <div className="rounded-lg border border-dashed p-6 text-center"><strong className="text-sm">O orçamento ainda não possui itens.</strong><p className="mt-1 text-xs text-muted-foreground">Use uma das opções acima. O catálogo vazio não impede a criação manual.</p></div> : null}
    <div className="hidden md:block"><Table density="compact" scrollHint><TableHeader><TableRow><TableHead>Descrição e detalhes</TableHead><TableHead>Tipo</TableHead><TableHead>Quantidade</TableHead><TableHead>Unidade</TableHead><TableHead>Valor Unitário</TableHead><TableHead>Desconto</TableHead><TableHead data-align="right">Total</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}>
      <TableCell><div className="min-w-56 space-y-1"><Input value={item.description} disabled={locked} onChange={(event) => update(item.id, { description: event.target.value })} /><textarea className="min-h-16 w-full rounded-md border bg-background p-2 text-xs" disabled={locked} value={item.notes ?? ""} onChange={(event) => update(item.id, { notes: event.target.value })} placeholder="Detalhes que aparecerão no orçamento" /></div></TableCell>
      <TableCell><Select value={item.category} disabled={locked} onChange={(event) => update(item.id, { category: event.target.value as QuoteItemCategory })}>{categories.map((value) => <option key={value} value={value}>{ptBrLabel(value)}</option>)}</Select></TableCell>
      <TableCell><Input className="w-24" type="number" min="0.01" step="0.01" disabled={locked} value={item.quantity} onChange={(event) => update(item.id, { quantity: Number(event.target.value) })} /></TableCell>
      <TableCell><Select value={item.unit} disabled={locked} onChange={(event) => update(item.id, { unit: event.target.value as QuoteUnit })}>{units.map((value) => <option key={value} value={value}>{ptBrLabel(value)}</option>)}</Select></TableCell>
      <TableCell><Input className="w-32" disabled={locked} defaultValue={(item.unitPriceCents / 100).toFixed(2).replace(".", ",")} onBlur={(event) => update(item.id, { unitPriceCents: parseCurrencyBRToCents(event.target.value) })} /></TableCell>
      <TableCell><Input className="w-28" disabled={locked} defaultValue={(item.discountCents / 100).toFixed(2).replace(".", ",")} onBlur={(event) => update(item.id, { discountCents: parseCurrencyBRToCents(event.target.value) })} /></TableCell>
      <TableNumericCell>{formatCurrencyBRLFromCents(item.totalCents)}</TableNumericCell><TableActionsCell>{actions(item)}</TableActionsCell>
    </TableRow>)}</TableBody></Table></div>
    <div className="grid gap-3 md:hidden">{items.map((item) => <article key={item.id} className="space-y-3 rounded-lg border p-3"><div className="flex items-start justify-between gap-2"><div><strong className="text-sm">{item.description || "Item sem descrição"}</strong><p className="text-xs text-muted-foreground">{ptBrLabel(item.category)}</p></div>{actions(item)}</div><Input value={item.description} disabled={locked} onChange={(event) => update(item.id, { description: event.target.value })} placeholder="Descrição" /><textarea className="min-h-20 w-full rounded-md border bg-background p-2 text-sm" disabled={locked} value={item.notes ?? ""} onChange={(event) => update(item.id, { notes: event.target.value })} placeholder="Detalhes do item" /><div className="grid grid-cols-2 gap-2"><label className="text-xs">Quantidade<Input type="number" min="0.01" step="0.01" disabled={locked} value={item.quantity} onChange={(event) => update(item.id, { quantity: Number(event.target.value) })} /></label><label className="text-xs">Unidade<Select value={item.unit} disabled={locked} onChange={(event) => update(item.id, { unit: event.target.value as QuoteUnit })}>{units.map((value) => <option key={value} value={value}>{ptBrLabel(value)}</option>)}</Select></label><label className="text-xs">Valor unitário<Input disabled={locked} defaultValue={(item.unitPriceCents / 100).toFixed(2).replace(".", ",")} onBlur={(event) => update(item.id, { unitPriceCents: parseCurrencyBRToCents(event.target.value) })} /></label><label className="text-xs">Desconto<Input disabled={locked} defaultValue={(item.discountCents / 100).toFixed(2).replace(".", ",")} onBlur={(event) => update(item.id, { discountCents: parseCurrencyBRToCents(event.target.value) })} /></label></div><div className="flex justify-between border-t pt-2 text-sm"><span>Total</span><strong>{formatCurrencyBRLFromCents(item.totalCents)}</strong></div></article>)}</div>
  </section>;
}
