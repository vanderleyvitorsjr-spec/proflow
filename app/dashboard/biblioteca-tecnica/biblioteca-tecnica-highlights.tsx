import { Clock3, Eye, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  contentTypeLabels,
  type TechnicalDocument,
} from "./biblioteca-tecnica-data";

type BibliotecaTecnicaHighlightsProps = {
  recent: TechnicalDocument[];
  favorites: TechnicalDocument[];
  mostViewed: TechnicalDocument[];
};

const numberFormatter = new Intl.NumberFormat("pt-BR");

function HighlightColumn({
  title,
  icon: Icon,
  documents,
}: {
  title: string;
  icon: typeof Clock3;
  documents: TechnicalDocument[];
}) {
  return (
    <Card className="rounded-[var(--radius-card)] border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center gap-2 px-3 py-2.5">
        <span className="rounded-lg bg-muted p-2 text-foreground">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 px-3 pb-3 pt-0">
        {documents.slice(0, 3).map((document) => (
          <div key={document.id} className="rounded-lg border border-border px-2.5 py-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {document.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {document.code} · {numberFormatter.format(document.views)} acessos
                </p>
              </div>
              <Badge variant="neutral">{contentTypeLabels[document.contentType]}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function BibliotecaTecnicaHighlights({
  recent,
  favorites,
  mostViewed,
}: BibliotecaTecnicaHighlightsProps) {
  return (
    <section aria-labelledby="library-highlights-title" className="space-y-2">
      <div>
        <h2 id="library-highlights-title" className="text-base font-bold text-foreground">
          Acesso rápido
        </h2>
        <p className="text-xs text-muted-foreground">
          Conteúdos recentes, marcados e consultados com frequência.
        </p>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <HighlightColumn title="Recentes" icon={Clock3} documents={recent} />
        <HighlightColumn title="Favoritos" icon={Star} documents={favorites} />
        <HighlightColumn title="Mais acessados" icon={Eye} documents={mostViewed} />
      </div>
    </section>
  );
}
