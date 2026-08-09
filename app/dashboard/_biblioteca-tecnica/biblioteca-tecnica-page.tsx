"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BookOpen,
  Copy,
  FileText,
  Grid2X2,
  List,
  Plus,
  Search,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIdentity,
  PageHeaderToolbar,
} from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateBR, formatNumberBR } from "@/lib/br-formatters";
import {
  archiveTechnicalDocumentAction,
  duplicateTechnicalDocumentAction,
  listTechnicalDocumentsAction,
  saveTechnicalDocumentAction,
  toggleTechnicalFavoriteAction,
} from "./biblioteca-tecnica-actions";
import { TechnicalDocumentForm } from "./biblioteca-tecnica-form";
import type {
  TechnicalDocument,
  TechnicalDocumentInput,
} from "./biblioteca-tecnica-types";

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  OUTDATED: "Desatualizado",
  EXPIRED: "Expirado",
};
const statusVariants: Record<string, "neutral" | "success" | "warning" | "destructive"> =
  {
    DRAFT: "neutral",
    ACTIVE: "success",
    OUTDATED: "warning",
    EXPIRED: "destructive",
  };

export function BibliotecaTecnicaPageContent() {
  const [documents, setDocuments] = useState<TechnicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [view, setView] = useState<"cards" | "list">("cards");
  const [editing, setEditing] = useState<TechnicalDocument | null>(null);
  const [form, setForm] = useState(false);

  const load = async () => {
    setDocuments(listTechnicalDocumentsAction().documents);
    setLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => void load());
  }, []);

  const filtered = useMemo(
    () =>
      documents.filter(
        (document) =>
          !document.archivedAt &&
          (status === "ALL" || document.status === status) &&
          [
            document.title,
            document.code,
            document.manufacturer,
            document.description,
            ...document.tags,
          ]
            .join(" ")
            .toLocaleLowerCase("pt-BR")
            .includes(search.toLocaleLowerCase("pt-BR")),
      ),
    [documents, search, status],
  );

  const action = async (work: () => Promise<unknown>) => {
    await work();
    await load();
  };

  async function save(input: TechnicalDocumentInput) {
    await saveTechnicalDocumentAction(input, editing?.id);
    setForm(false);
    setEditing(null);
    await load();
  }

  return (
    <div className="space-y-3">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <BookOpen className="h-5 w-5" />
            <PageHeaderHeading
              title="Biblioteca Técnica"
              description="Documentos, arquivos e vínculos técnicos persistidos localmente."
            />
          </PageHeaderIdentity>
          <PageHeaderActions>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Novo documento
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>
        <PageHeaderToolbar className="grid gap-2 lg:grid-cols-[1fr_12rem_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar documentos..."
            />
          </div>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="ALL">Todos os status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Badge variant="secondary" className="justify-center whitespace-nowrap">
            {loading ? "Carregando" : `${filtered.length} documento(s)`}
          </Badge>
          <div className="flex justify-end">
            <Button
              variant={view === "cards" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setView("cards")}
              aria-label="Visualização em cartões"
              aria-pressed={view === "cards"}
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setView("list")}
              aria-label="Visualização em lista"
              aria-pressed={view === "list"}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </PageHeaderToolbar>
      </PageHeader>

      {loading ? (
        <div
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          aria-label="Carregando documentos"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-xl border bg-card p-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="mt-2 h-5 w-3/4" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-4/5" />
              <Skeleton className="mt-4 h-8 w-40" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="Nenhum documento encontrado"
          description="Ajuste os filtros ou cadastre um novo documento técnico."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Novo documento
            </Button>
          }
        />
      ) : (
        <div
          className={
            view === "cards" ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3" : "space-y-2"
          }
        >
          {filtered.map((document) => (
            <article
              key={document.id}
              className={`rounded-xl border bg-card p-4 transition-colors hover:border-primary/25 ${
                view === "list" ? "sm:flex sm:items-center sm:gap-4" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline">{document.code}</Badge>
                      <Badge variant={statusVariants[document.status] ?? "neutral"}>
                        {statusLabels[document.status] ?? document.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {document.contentType}
                      </span>
                    </div>
                    <Link
                      href={`/dashboard/biblioteca-tecnica/${document.id}`}
                      className="font-semibold hover:underline"
                    >
                      {document.title}
                    </Link>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      void action(() => toggleTechnicalFavoriteAction(document.id))
                    }
                    aria-label={
                      document.favorite
                        ? "Remover dos favoritos"
                        : "Adicionar aos favoritos"
                    }
                  >
                    <Star
                      className={
                        document.favorite
                          ? "h-4 w-4 fill-amber-400 text-amber-500"
                          : "h-4 w-4"
                      }
                    />
                  </Button>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {document.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>{document.manufacturer || "Multimarcas"}</span>
                  <span>Versão {document.version}</span>
                  <span>{formatNumberBR(document.accessCount, 0)} acessos</span>
                  <span>Atualizado em {formatDateBR(document.updatedAt)}</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1 sm:mt-0 sm:shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(document);
                    setForm(true);
                  }}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    void action(() => duplicateTechnicalDocumentAction(document.id))
                  }
                  aria-label="Duplicar documento"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    confirm("Arquivar este documento?") &&
                    void action(() => archiveTechnicalDocumentAction(document.id))
                  }
                  aria-label="Arquivar documento"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <TechnicalDocumentForm
        open={form}
        document={editing}
        onClose={() => setForm(false)}
        onSave={save}
      />
    </div>
  );
}

export default BibliotecaTecnicaPageContent;
