"use client";

import { Download, FileSignature, ImagePlus, Printer, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDateTimeBR } from "@/lib/br-formatters";
import { addOrdemMediaAction, removeOrdemMediaAction, updateOrdemTechnicalReportAction } from "./ordens-actions";
import { deleteOrdemMediaBlob, getOrdemMediaBlob, saveOrdemMediaBlob } from "./ordens-media-adapter";
import type { OrdemMediaKind, OrdemRecord, OrdemTechnicalReport } from "./ordens-types";

type Props = {
  order: OrdemRecord;
  onChanged: (order: OrdemRecord) => void;
};

const kindLabels: Record<OrdemMediaKind, string> = {
  BEFORE: "Antes",
  AFTER: "Depois",
  GENERAL: "Geral",
  CLIENT_SIGNATURE: "Assinatura do cliente",
  TECHNICIAN_SIGNATURE: "Assinatura do técnico",
};

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];

export function OrdemEvidencePanel({ order, onChanged }: Props) {
  const [kind, setKind] = useState<OrdemMediaKind>("BEFORE");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [report, setReport] = useState<OrdemTechnicalReport>(() => order.technicalReport ?? {
    diagnosis: "",
    servicePerformed: "",
    recommendations: "",
    clientAcknowledgement: "",
  });

  const media = useMemo(() => order.media ?? [], [order.media]);

  async function upload(file: File | null) {
    if (!file) return;
    setFeedback("");
    if (!acceptedImageTypes.includes(file.type)) {
      setFeedback("Use uma imagem JPG, PNG ou WEBP.");
      return;
    }
    const maxSize = kind.includes("SIGNATURE") ? 3 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setFeedback(kind.includes("SIGNATURE") ? "A assinatura deve ter até 3 MB." : "A foto deve ter até 10 MB.");
      return;
    }
    setBusy(true);
    const id = crypto.randomUUID();
    try {
      await saveOrdemMediaBlob(id, file);
      const updated = await addOrdemMediaAction(order.id, {
        id,
        kind,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        createdAt: new Date().toISOString(),
        createdBy: order.technician,
      });
      onChanged(updated);
      setFeedback("Arquivo adicionado com sucesso.");
    } catch (error) {
      await deleteOrdemMediaBlob(id).catch(() => undefined);
      setFeedback(error instanceof Error ? error.message : "Não foi possível salvar o arquivo.");
    } finally {
      setBusy(false);
    }
  }

  async function openMedia(id: string, fileName: string, download: boolean) {
    const blob = await getOrdemMediaBlob(id);
    if (!blob) {
      setFeedback("O arquivo local não está disponível neste dispositivo.");
      return;
    }
    const url = URL.createObjectURL(blob);
    if (download) {
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const updated = await removeOrdemMediaAction(order.id, id);
      await deleteOrdemMediaBlob(id);
      onChanged(updated);
      setFeedback("Arquivo removido.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível remover o arquivo.");
    } finally {
      setBusy(false);
    }
  }

  async function saveReport() {
    setBusy(true);
    try {
      const updated = await updateOrdemTechnicalReportAction(order.id, report);
      onChanged(updated);
      setFeedback("Relatório técnico salvo.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível salvar o relatório.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><ImagePlus className="h-4 w-4" />Fotos e assinaturas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[220px_1fr] sm:items-end">
            <Field label="Tipo de arquivo" htmlFor="ordem-media-kind">
              <Select id="ordem-media-kind" value={kind} onChange={(event) => setKind(event.target.value as OrdemMediaKind)}>
                {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
            </Field>
            <Field label="Selecionar imagem" htmlFor="ordem-media-file">
              <Input id="ordem-media-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => { void upload(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} />
            </Field>
          </div>
          {media.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{media.map((item) => (
            <div key={item.id} className="rounded-xl border p-3">
              <div className="flex items-start justify-between gap-2"><Badge variant="outline">{kindLabels[item.kind]}</Badge><span className="text-[11px] text-muted-foreground">{formatBytes(item.size)}</span></div>
              <p className="mt-2 line-clamp-1 text-sm font-medium">{item.fileName}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDateTimeBR(item.createdAt)}{item.createdBy ? ` · ${item.createdBy}` : ""}</p>
              <div className="mt-3 flex gap-2"><Button type="button" size="sm" variant="secondary" onClick={() => void openMedia(item.id, item.fileName, false)}>Abrir</Button><Button type="button" size="icon" variant="ghost" onClick={() => void openMedia(item.id, item.fileName, true)} aria-label="Baixar arquivo"><Download className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" onClick={() => void remove(item.id)} disabled={busy} aria-label="Remover arquivo"><Trash2 className="h-4 w-4" /></Button></div>
            </div>
          ))}</div> : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Nenhuma foto ou assinatura adicionada.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><FileSignature className="h-4 w-4" />Relatório técnico</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Diagnóstico" htmlFor="technical-diagnosis"><textarea id="technical-diagnosis" className="min-h-28 w-full rounded-lg border bg-background px-3 py-2 text-sm" value={report.diagnosis} onChange={(event) => setReport((current) => ({ ...current, diagnosis: event.target.value }))} /></Field>
            <Field label="Serviço executado" htmlFor="technical-service"><textarea id="technical-service" className="min-h-28 w-full rounded-lg border bg-background px-3 py-2 text-sm" value={report.servicePerformed} onChange={(event) => setReport((current) => ({ ...current, servicePerformed: event.target.value }))} /></Field>
            <Field label="Recomendações" htmlFor="technical-recommendations"><textarea id="technical-recommendations" className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm" value={report.recommendations} onChange={(event) => setReport((current) => ({ ...current, recommendations: event.target.value }))} /></Field>
            <Field label="Ciência do cliente" htmlFor="technical-acknowledgement"><textarea id="technical-acknowledgement" className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm" value={report.clientAcknowledgement ?? ""} onChange={(event) => setReport((current) => ({ ...current, clientAcknowledgement: event.target.value }))} /></Field>
          </div>
          <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Imprimir OS</Button><Button type="button" onClick={() => void saveReport()} disabled={busy}><Save className="h-4 w-4" />Salvar relatório</Button></div>
        </CardContent>
      </Card>
      {feedback ? <div role="status" className="rounded-lg border bg-muted/30 p-3 text-sm">{feedback}</div> : null}
    </div>
  );
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1).replace(".", ",")} KB`;
  return `${(size / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}
