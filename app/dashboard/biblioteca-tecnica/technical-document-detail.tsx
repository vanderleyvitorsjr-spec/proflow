"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  attachTechnicalFileAction,
  getTechnicalDocumentAction,
  openTechnicalFileAction,
  removeTechnicalFileAction,
} from "./biblioteca-tecnica-actions";
import type { TechnicalDocument } from "./biblioteca-tecnica-types";
import { ptBrLabel } from "@/lib/pt-br-labels";
export function TechnicalDocumentDetail({ id }: { id: string }) {
  const [document, setDocument] = useState<TechnicalDocument | null | undefined>();
  const load = useCallback(() => getTechnicalDocumentAction(id).then(setDocument), [id]);
  useEffect(() => {
    void load();
  }, [load]);
  if (document === undefined) return <p>Carregando documento...</p>;
  if (!document)
    return (
      <EmptyState
        title="Documento não encontrado"
        description="O registro não existe ou foi removido."
      />
    );
  async function open() {
    const url = await openTechnicalFileAction(id);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  }
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs text-muted-foreground">
          {document.code} · {document.status}
        </p>
        <h1 className="text-xl font-bold">{document.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{document.description}</p>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <Info label="Tipo" value={document.contentType} />
          <Info label="Categoria" value={document.category} />
          <Info
            label="Versão"
            value={`${document.version} · revisão ${document.revision}`}
          />
          <Info label="Fabricante" value={document.manufacturer || "Não informado"} />
          <Info
            label="Validade"
            value={
              document.expiresAt
                ? new Date(`${document.expiresAt}T12:00:00`).toLocaleDateString("pt-BR")
                : "Sem validade"
            }
          />
          <Info label="Acessos" value={String(document.accessCount)} />
        </div>
      </div>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Arquivo</h2>
        {document.fileMetadata ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm">
              {document.fileMetadata.name} ·{" "}
              {(document.fileMetadata.size / 1024 / 1024).toLocaleString("pt-BR", {
                maximumFractionDigits: 2,
              })}{" "}
              MB
            </span>
            <Button size="sm" onClick={() => void open()}>
              <Download className="h-4 w-4" />
              Abrir/baixar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() =>
                confirm("Remover o arquivo local?") &&
                void removeTechnicalFileAction(id).then(load)
              }
            >
              <Trash2 className="h-4 w-4" />
              Remover
            </Button>
          </div>
        ) : (
          <label className="mt-2 inline-flex cursor-pointer rounded-md border px-3 py-2 text-sm font-medium">
            Adicionar arquivo
            <input
              className="sr-only"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.docx,.xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  void attachTechnicalFileAction(id, file)
                    .then(load)
                    .catch((error) =>
                      alert(error instanceof Error ? error.message : "Falha no arquivo."),
                    );
              }}
            />
          </label>
        )}
      </section>
      <Relations title="Equipamentos" items={document.equipmentSnapshots} />
      <Relations title="Ordens de Serviço" items={document.serviceOrderSnapshots} />
      <Relations title="Clientes" items={document.clientSnapshots} />
      <section className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Histórico</h2>
        {document.history.length ? (
          <ol className="mt-2 space-y-2">
            {[...document.history].reverse().map((h) => (
              <li key={h.id} className="text-sm">
                <strong>{ptBrLabel(h.type)}</strong> ·{" "}
                {new Date(h.occurredAt).toLocaleString("pt-BR")}
                <p className="text-muted-foreground">{h.description}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Sem alterações registradas.
          </p>
        )}
      </section>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  );
}
function Relations({
  title,
  items,
}: {
  title: string;
  items: TechnicalDocument["equipmentSnapshots"];
}) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length ? (
          items.map((x) => (
            <Button asChild size="sm" variant="secondary" key={x.id}>
              <Link href={x.link}>{x.label}</Link>
            </Button>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">Nenhum vínculo.</span>
        )}
      </div>
    </section>
  );
}
