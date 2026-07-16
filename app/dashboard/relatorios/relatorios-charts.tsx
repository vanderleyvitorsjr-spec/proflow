import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ChartDataset } from "./relatorios-types";
const colors = ["bg-sky-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500"];
export function RelatoriosCharts({ charts }: { charts: ChartDataset[] }) {
  if (!charts.length) return null;
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {charts.map((chart) => {
        const maximum = Math.max(
          1,
          ...chart.series.flatMap((series) => series.values.map(Math.abs)),
        );
        return (
          <Card key={chart.id} className="shadow-xs">
            <CardHeader className="border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{chart.title}</CardTitle>
                <span className="text-[10px] uppercase text-muted-foreground">
                  {chart.source.join(" + ")}
                  {chart.partial ? " · parcial" : ""}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {chart.empty ? (
                <EmptyState
                  size="compact"
                  icon={<BarChart3 className="h-4 w-4" />}
                  title="Sem dados no período"
                />
              ) : (
                <>
                  <div className="mb-3 flex flex-wrap gap-3">
                    {chart.series.map((series, index) => (
                      <span
                        key={series.name}
                        className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${colors[index % colors.length]}`}
                        />
                        {series.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex h-44 items-end gap-2 border-b border-border">
                    {chart.labels.map((label, index) => (
                      <div
                        key={`${label}-${index}`}
                        className="flex h-full min-w-0 flex-1 flex-col justify-end"
                      >
                        <div className="flex h-full items-end justify-center gap-0.5">
                          {chart.series.map((series, seriesIndex) => (
                            <div
                              key={series.name}
                              title={`${series.name}: ${series.values[index]?.toLocaleString("pt-BR") ?? 0}`}
                              className={`w-full max-w-5 rounded-t-sm ${colors[seriesIndex % colors.length]}`}
                              style={{
                                height: `${Math.max(series.values[index] ? 4 : 0, ((series.values[index] ?? 0) / maximum) * 100)}%`,
                              }}
                            />
                          ))}
                        </div>
                        <span className="mt-2 truncate text-center text-[10px] text-muted-foreground">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
