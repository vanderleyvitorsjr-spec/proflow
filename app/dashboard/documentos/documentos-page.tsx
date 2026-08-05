"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader, PageHeaderContent, PageHeaderHeading, PageHeaderIcon, PageHeaderIdentity, PageHeaderToolbar } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTimeBR } from "@/lib/br-formatters";
import { archiveDocumentAction, listDocumentsAction } from "./documentos-actions";
import { deleteStoredDocumentAction, listStoredDocumentsAction, uploadStoredDocumentAction } from "./document-file-actions";
import type { DocumentMetadata } from "./documentos-domain";
import type { ProfessionalDocumentType } from "@/components/documents/professional-document-domain";
const types: Array<[ProfessionalDocumentType, string]> = [["QUOTE","Orçamento"],["COMMERCIAL_PROPOSAL","Proposta Comercial"],["SERVICE_ORDER","Ordem de Serviço"],["TECHNICAL_REPORT","Relatório Técnico"],["PURCHASE_ORDER","Pedido de Compra"],["QUOTATION","Cotação"],["EQUIPMENT_RECORD","Ficha do Equipamento"],["MAINTENANCE_HISTORY","Histórico de Manutenção"],["RECEIPT","Recibo"]];
export function DocumentosPage() {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<ProfessionalDocumentType | "ALL">("ALL");
  const [stored, setStored] = useState<Array<{ id: string; name: string; mimeType: string | null; size: number | null; createdAt: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const refreshStored = () => listStoredDocumentsAction().then(setStored);
  useEffect(() => { void listDocumentsAction({ search, type }).then(setDocuments); }, [search, type]);
  useEffect(() => { void refreshStored(); }, []);
  async function upload(file: File | null) {
    if (!file) return;
    setUploading(true); setFeedback("");
    try { const formData = new FormData(); formData.set("file", file); await uploadStoredDocumentAction(formData); await refreshStored(); setFeedback("Arquivo armazenado com segurança."); }
    catch (error) { setFeedback(error instanceof Error ? error.message : "Não foi possível enviar o arquivo."); }
    finally { setUploading(false); }
  }
  return <div className="space-y-3"><PageHeader><PageHeaderContent><PageHeaderIdentity><PageHeaderIcon><FileText className="size-4" /></PageHeaderIcon><PageHeaderHeading title="Central de Documentos" description="Visualize e regenere documentos a partir das entidades originais. Nenhum arquivo binário é armazenado localmente." /></PageHeaderIdentity></PageHeaderContent><PageHeaderToolbar><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por número, título ou entidade" aria-label="Pesquisar documentos" /><Select value={type} onChange={(event) => setType(event.target.value as typeof type)} aria-label="Filtrar tipo de documento"><option value="ALL">Todos os Tipos</option>{types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></PageHeaderToolbar></PageHeader>
    {documents.length ? <Table density="compact"><TableHeader><TableRow><TableHead>Documento</TableHead><TableHead>Tipo</TableHead><TableHead>Entidade</TableHead><TableHead>Gerado em</TableHead><TableHead>Situação</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader><TableBody>{documents.map((document) => <TableRow key={document.id}><TableCell><strong>{document.number ?? document.title}</strong><p className="text-xs text-muted-foreground">{document.title}</p></TableCell><TableCell>{types.find(([value]) => value === document.type)?.[1] ?? document.type}</TableCell><TableCell>{document.entity}</TableCell><TableCell>{formatDateTimeBR(document.generatedAt)}</TableCell><TableCell>{document.status === "AVAILABLE" ? "Disponível" : "Arquivado"}</TableCell><TableCell><div className="flex gap-1"><Button asChild size="sm" variant="secondary"><Link href={document.link}>Visualizar</Link></Button>{document.status === "AVAILABLE" ? <Button size="sm" variant="ghost" onClick={() => archiveDocumentAction(document.id).then(() => listDocumentsAction({ search, type }).then(setDocuments))}>Arquivar</Button> : null}</div></TableCell></TableRow>)}</TableBody></Table> : <EmptyState title="Nenhum Documento Gerado" description="Os metadados aparecerão quando um documento for visualizado ou gerado em sua entidade de origem." />}
    <section className="rounded-xl border bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Arquivos Armazenados</h2><p className="text-sm text-muted-foreground">PDF, imagens e documentos protegidos no armazenamento privado da empresa.</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Upload className="h-4 w-4" />{uploading ? "Enviando..." : "Enviar Arquivo"}<input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png,image/webp,.docx" disabled={uploading} onChange={(event) => { void upload(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} /></label></div>{feedback ? <p role="status" className="mt-3 rounded-lg bg-muted p-3 text-sm">{feedback}</p> : null}{stored.length ? <div className="mt-4 divide-y rounded-lg border">{stored.map((file) => <div key={file.id} className="flex flex-wrap items-center justify-between gap-3 p-3"><div><p className="text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{formatDateTimeBR(file.createdAt)} · {file.size ? `${(file.size / 1024).toFixed(1).replace(".", ",")} KB` : "Tamanho não informado"}</p></div><div className="flex gap-1"><Button asChild size="icon" variant="ghost"><a href={`/api/documentos-arquivos/${file.id}`} target="_blank" rel="noreferrer" aria-label={`Baixar ${file.name}`}><Download className="h-4 w-4" /></a></Button><Button size="icon" variant="ghost" aria-label={`Remover ${file.name}`} onClick={() => { if (window.confirm("Remover este arquivo definitivamente?")) void deleteStoredDocumentAction(file.id).then(refreshStored); }}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">Nenhum arquivo armazenado.</p>}</section>
  </div>;
}
