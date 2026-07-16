"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Archive, BookOpen, Copy, Grid2X2, List, Plus, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIdentity,
  PageHeaderToolbar,
} from "@/components/ui/page-header";
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
export function BibliotecaTecnicaPageContent() {
  const [documents, setDocuments] = useState<TechnicalDocument[]>([]),
    [loading, setLoading] = useState(true),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("ALL"),
    [view, setView] = useState<"cards" | "list">("cards"),
    [editing, setEditing] = useState<TechnicalDocument | null>(null),
    [form, setForm] = useState(false);
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
        (d) =>
          !d.archivedAt &&
          (status === "ALL" || d.status === status) &&
          [d.title, d.code, d.manufacturer, ...d.tags]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase()),
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
        <PageHeaderToolbar className="grid gap-2 lg:grid-cols-[1fr_12rem_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar documentos..."
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">Todos os status</option>
            {["DRAFT", "ACTIVE", "OUTDATED", "EXPIRED"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
          <div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView("cards")}
              aria-pressed={view === "cards"}
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </PageHeaderToolbar>
      </PageHeader>
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando documentos...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhum documento encontrado"
          description="Ajuste os filtros ou cadastre um novo documento."
        />
      ) : (
        <div
          className={
            view === "cards" ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3" : "space-y-2"
          }
        >
          {filtered.map((d) => (
            <article key={d.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {d.code} · {d.contentType} · {d.status}
                  </p>
                  <Link
                    href={`/dashboard/biblioteca-tecnica/${d.id}`}
                    className="font-semibold hover:underline"
                  >
                    {d.title}
                  </Link>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void action(() => toggleTechnicalFavoriteAction(d.id))}
                >
                  <Star
                    className={
                      d.favorite ? "h-4 w-4 fill-amber-400 text-amber-500" : "h-4 w-4"
                    }
                  />
                </Button>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {d.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1 text-xs">
                <span>{d.manufacturer || "Multimarcas"}</span>
                <span>· versão {d.version}</span>
                <span>· {d.accessCount} acessos</span>
              </div>
              <div className="mt-3 flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(d);
                    setForm(true);
                  }}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    void action(() => duplicateTechnicalDocumentAction(d.id))
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    confirm("Arquivar este documento?") &&
                    void action(() => archiveTechnicalDocumentAction(d.id))
                  }
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
