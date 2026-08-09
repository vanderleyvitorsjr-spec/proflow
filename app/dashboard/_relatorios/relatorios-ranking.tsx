import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ReportSection } from "./relatorios-types";
export function RelatoriosRanking({ rankings }: { rankings: ReportSection["rankings"] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {rankings.map((ranking) => (
        <Card key={ranking.id} className="shadow-xs">
          <CardHeader className="border-b px-3 py-2.5">
            <CardTitle className="text-sm">{ranking.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {ranking.items.length ? (
              <ol className="divide-y">
                {ranking.items.map((item, index) => (
                  <li key={item.id} className="flex items-center gap-2 px-1 py-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      {item.link ? (
                        <Link
                          href={item.link}
                          className="block truncate text-xs font-medium hover:text-primary"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <p className="truncate text-xs font-medium">{item.label}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <strong className="shrink-0 text-xs tabular-nums">
                      {item.formattedValue}
                    </strong>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState
                size="compact"
                icon={<Trophy className="h-4 w-4" />}
                title="Sem ranking"
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
