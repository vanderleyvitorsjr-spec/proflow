import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import type { ReportSourceStatus } from "./relatorios-types";
import { formatDateTimeBR } from "@/lib/br-formatters";
export function RelatoriosSourceStatus({
  statuses,
  generatedAt,
  executionTimeMs,
}: {
  statuses: ReportSourceStatus[];
  generatedAt: string;
  executionTimeMs: number;
}) {
  const unavailable = statuses.filter((item) => !item.available);
  return (
    <aside
      className={`flex flex-col gap-2 rounded-lg border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between ${unavailable.length ? "border-amber-500/25 bg-amber-500/5" : "bg-card"}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {unavailable.length ? (
          <>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>
              {unavailable.length} fonte(s) indisponível(is); os demais dados continuam
              visíveis.
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Todas as fontes consultadas.</span>
          </>
        )}
        {statuses.map((item) => (
          <span
            key={item.source}
            title={item.error ?? item.warnings.join(" · ")}
            className={`rounded-full border px-2 py-0.5 ${item.available ? "text-muted-foreground" : "border-amber-500/30 text-amber-700 dark:text-amber-300"}`}
          >
            {item.source}: {item.recordCount}
          </span>
        ))}
      </div>
      <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
        <Clock3 className="h-3.5 w-3.5" />
        {formatDateTimeBR(generatedAt)} · {executionTimeMs} ms
      </span>
    </aside>
  );
}
