import {
  BookOpen,
  Boxes,
  Building2,
  CircuitBoard,
  ClipboardCheck,
  Eye,
  FileText,
  Film,
  MoreHorizontal,
  Star,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  categoryLabels,
  contentTypeLabels,
  type TechnicalContentType,
  type TechnicalDocument,
  type TechnicalLibraryView,
} from "./biblioteca-tecnica-data";

type BibliotecaTecnicaDocumentsProps = {
  documents: TechnicalDocument[];
  view: TechnicalLibraryView;
  favoriteIds: Set<string>;
  onToggleFavorite: (documentId: string) => void;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

const contentIcons: Record<TechnicalContentType, typeof BookOpen> = {
  MANUAL: BookOpen,
  DIAGRAM: CircuitBoard,
  PROCEDURE: ClipboardCheck,
  STANDARD: FileText,
  VIDEO: Film,
};

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function FavoriteButton({
  active,
  title,
  onClick,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`${active ? "Remover" : "Adicionar"} ${title} dos favoritos`}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground",
        active && "border-amber-300 bg-amber-50 text-amber-600 dark:bg-amber-500/10",
      )}
    >
      <Star className={cn("h-4 w-4", active && "fill-current")} aria-hidden="true" />
    </button>
  );
}

function DocumentMetadata({ document }: { document: TechnicalDocument }) {
  return (
    <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
      <span className="flex items-center gap-2">
        <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
        {document.manufacturer}
      </span>
      <span className="flex items-center gap-2">
        <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
        {document.equipment}
      </span>
      <span className="flex items-center gap-2">
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        {numberFormatter.format(document.views)} acessos
      </span>
      <span>Atualizado em {formatDate(document.updatedAt)}</span>
    </div>
  );
}

function DocumentCard({
  document,
  favorite,
  onToggleFavorite,
}: {
  document: TechnicalDocument;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const Icon = contentIcons[document.contentType];

  return (
    <Card className="flex h-full flex-col rounded-[var(--radius-card)] border-border bg-card shadow-xs">
      <CardContent className="flex h-full flex-col gap-2.5 p-3">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <FavoriteButton
            active={favorite}
            title={document.title}
            onClick={onToggleFavorite}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">{contentTypeLabels[document.contentType]}</Badge>
            <Badge variant="neutral">{document.format}</Badge>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {document.code}
            </p>
            <h3 className="mt-0.5 text-sm font-bold leading-5 text-foreground">
              {document.title}
            </h3>
          </div>
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
            {document.description}
          </p>
        </div>

        <DocumentMetadata document={document} />

        <div className="mt-auto space-y-2 border-t border-border pt-2.5">
          <div className="flex flex-wrap gap-1.5">
            {document.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{document.duration ?? document.fileSize} · versão {document.version}</span>
            <span>{categoryLabels[document.category]}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentRow({
  document,
  favorite,
  onToggleFavorite,
}: {
  document: TechnicalDocument;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const Icon = contentIcons[document.contentType];

  return (
    <Card className="rounded-[var(--radius-card)] border-border bg-card shadow-xs">
      <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-foreground">{document.title}</h3>
              <Badge variant="neutral">{contentTypeLabels[document.contentType]}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{document.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {document.code} · {document.equipment} · {document.manufacturer}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4 lg:w-[31rem]">
          <span>{categoryLabels[document.category]}</span>
          <span>{document.format} · v{document.version}</span>
          <span>{numberFormatter.format(document.views)} acessos</span>
          <span>{formatDate(document.updatedAt)}</span>
        </div>

        <div className="flex items-center gap-2">
          <FavoriteButton
            active={favorite}
            title={document.title}
            onClick={onToggleFavorite}
          />
          <Button type="button" size="icon" variant="ghost" aria-label={`Mais opções para ${document.title}`}>
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function BibliotecaTecnicaDocuments({
  documents,
  view,
  favoriteIds,
  onToggleFavorite,
}: BibliotecaTecnicaDocumentsProps) {
  return (
    <section aria-labelledby="technical-documents-title" className="space-y-2">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="technical-documents-title" className="text-base font-bold text-foreground">
            Documentos técnicos
          </h2>
          <p className="text-xs text-muted-foreground">
            {numberFormatter.format(documents.length)} resultado(s) no acervo
          </p>
        </div>
        <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <Boxes className="h-4 w-4" aria-hidden="true" />
          Vínculos técnicos preparados
        </span>
      </div>

      {documents.length === 0 ? (
        <Card className="rounded-[var(--radius-card)] border-dashed border-border bg-card">
          <CardContent className="flex min-h-48 flex-col items-center justify-center px-6 py-8 text-center">
            <FileText className="h-9 w-9 text-muted-foreground" aria-hidden="true" />
            <h3 className="mt-4 font-bold text-foreground">Nenhum documento encontrado</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste a busca ou os filtros para visualizar outros conteúdos.
            </p>
          </CardContent>
        </Card>
      ) : view === "cards" ? (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              favorite={favoriteIds.has(document.id)}
              onToggleFavorite={() => onToggleFavorite(document.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((document) => (
            <DocumentRow
              key={document.id}
              document={document}
              favorite={favoriteIds.has(document.id)}
              onToggleFavorite={() => onToggleFavorite(document.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
