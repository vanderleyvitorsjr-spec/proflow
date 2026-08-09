"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader, PageHeaderContent, PageHeaderHeading, PageHeaderIcon, PageHeaderIdentity, PageHeaderToolbar } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTimeBR } from "@/lib/br-formatters";
import { archiveDocumentAction, listDocumentsAction } from "./documentos-actions";
import type { DocumentMetadata } from "./documentos-domain";
import type { ProfessionalDocumentType } from "@/components/documents/professional-document-domain";
const types: Array<[ProfessionalDocumentType, string]> = [["QUOTE","Orçamento"],["COMMERCIAL_PROPOSAL","Proposta Comercial"],["SERVICE_ORDER","Ordem de Serviço"],["TECHNICAL_REPORT","Relatório Técnico"],["PURCHASE_ORDER","Pedido de Compra"],["QUOTATION","Cotação"],["EQUIPMENT_RECORD","Ficha do Equipamento"],["MAINTENANCE_HISTORY","Histórico de Manutenção"],["RECEIPT","Recibo"]];
export function DocumentosPage() {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<ProfessionalDocumentType | "ALL">("ALL");
  useEffect(() => { void listDocumentsAction({ search, type }).then(setDocuments); }, [search, type]);
  return <div className="space-y-3"><PageHeader><PageHeaderContent><PageHeaderIdentity><PageHeaderIcon><FileText className="size-4" /></PageHeaderIcon><PageHeaderHeading title="Central de Documentos" description="Visualize e regenere documentos a partir das entidades originais. Nenhum arquivo binário é armazenado localmente." /></PageHeaderIdentity></PageHeaderContent><PageHeaderToolbar><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por número, título ou entidade" aria-label="Pesquisar documentos" /><Select value={type} onChange={(event) => setType(event.target.value as typeof type)} aria-label="Filtrar tipo de documento"><option value="ALL">Todos os Tipos</option>{types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></PageHeaderToolbar></PageHeader>
    {documents.length ? <Table density="compact"><TableHeader><TableRow><TableHead>Documento</TableHead><TableHead>Tipo</TableHead><TableHead>Entidade</TableHead><TableHead>Gerado em</TableHead><TableHead>Situação</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader><TableBody>{documents.map((document) => <TableRow key={document.id}><TableCell><strong>{document.number ?? document.title}</strong><p className="text-xs text-muted-foreground">{document.title}</p></TableCell><TableCell>{types.find(([value]) => value === document.type)?.[1] ?? document.type}</TableCell><TableCell>{document.entity}</TableCell><TableCell>{formatDateTimeBR(document.generatedAt)}</TableCell><TableCell>{document.status === "AVAILABLE" ? "Disponível" : "Arquivado"}</TableCell><TableCell><div className="flex gap-1"><Button asChild size="sm" variant="secondary"><Link href={document.link}>Visualizar</Link></Button>{document.status === "AVAILABLE" ? <Button size="sm" variant="ghost" onClick={() => archiveDocumentAction(document.id).then(() => listDocumentsAction({ search, type }).then(setDocuments))}>Arquivar</Button> : null}</div></TableCell></TableRow>)}</TableBody></Table> : <EmptyState title="Nenhum Documento Registrado" description="Os metadados aparecerão quando um documento for visualizado ou gerado em sua entidade de origem." />}
  </div>;
}
