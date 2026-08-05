"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calculator, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader, PageHeaderActions, PageHeaderContent, PageHeaderHeading, PageHeaderIcon, PageHeaderIdentity } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableNumericCell, TableRow } from "@/components/ui/table";
import { formatCurrencyBRLFromCents, formatPercentageFromBasisPoints, normalizeProperNameInput } from "@/lib/br-formatters";
import { ptBrLabel } from "@/lib/pt-br-labels";
import { createCatalogServiceAction, listCatalogServicesAction } from "../catalogo-servicos-actions";
import { serviceCategories, type CatalogService, type ServiceCategory } from "../catalogo-servicos-domain";

export function CatalogoServicosPage() {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("INSTALLATION");
  const [price, setPrice] = useState("0");
  const [creating, setCreating] = useState(false);
  const refresh = () => listCatalogServicesAction().then(setServices);
  useEffect(() => { void refresh(); }, []);
  const active = useMemo(() => services.filter((item) => item.active), [services]);
  async function create() {
    const cents = Math.round(Number(price.replace(",", ".")) * 100);
    await createCatalogServiceAction({
      name, category, description: "", attendanceType: "RESIDENTIAL", unit: "Serviço",
      basePriceCents: Number.isFinite(cents) ? cents : 0, estimatedCostCents: 0,
      desiredMarginBasisPoints: 3000, estimatedDurationMinutes: 60, suggestedMaterials: [],
      suggestedTeam: [], suggestedChecklist: [], active: true,
    });
    setName(""); setPrice("0"); setCreating(false); await refresh();
  }
  return <div className="space-y-3">
    <PageHeader><PageHeaderContent><PageHeaderIdentity><PageHeaderIcon><Calculator className="size-4" /></PageHeaderIcon><PageHeaderHeading title="Catálogo de Serviços" description="Mantenha preços, custos e informações operacionais reutilizáveis nos orçamentos." /></PageHeaderIdentity><PageHeaderActions><Button asChild size="sm" variant="secondary"><Link href="/dashboard/precificacao">Abrir Precificação</Link></Button><Button size="sm" onClick={() => setCreating((value) => !value)}><Plus className="size-4" />Novo Serviço</Button></PageHeaderActions></PageHeaderContent></PageHeader>
    {creating ? <section className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-4">
      <Input value={name} onChange={(event) => setName(normalizeProperNameInput(event.target.value))} placeholder="Ex.: Manutenção Preventiva" aria-label="Nome do serviço" />
      <Select value={category} onChange={(event) => setCategory(event.target.value as ServiceCategory)} aria-label="Categoria do serviço">{serviceCategories.map((item) => <option key={item} value={item}>{ptBrLabel(item)}</option>)}</Select>
      <Input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" placeholder="Ex.: 350,00" aria-label="Preço base em reais" />
      <Button onClick={() => void create()} disabled={!name.trim()}>Salvar Serviço</Button>
    </section> : null}
    {active.length ? <Table density="compact"><TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Serviço</TableHead><TableHead>Categoria</TableHead><TableHead data-align="right">Preço Base</TableHead><TableHead data-align="right">Margem Desejada</TableHead></TableRow></TableHeader><TableBody>{active.map((service) => <TableRow key={service.id}><TableCell>{service.code}</TableCell><TableCell className="font-medium">{service.name}</TableCell><TableCell>{ptBrLabel(service.category)}</TableCell><TableNumericCell>{formatCurrencyBRLFromCents(service.basePriceCents)}</TableNumericCell><TableNumericCell>{formatPercentageFromBasisPoints(service.desiredMarginBasisPoints)}</TableNumericCell></TableRow>)}</TableBody></Table> : <EmptyState title="Catálogo vazio" description="Cadastre o primeiro serviço para reutilizá-lo em simulações e orçamentos." />}
  </div>;
}
