import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { modules } from "@/features/workspace/workspace-data";

type ModulePageProps = {
  moduleKey: keyof typeof modules;
};

export function ModulePage({ moduleKey }: ModulePageProps) {
  const pageModule = modules[moduleKey];
  const max = Math.max(...pageModule.pipeline.map((item) => item.value));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">
            {pageModule.title}
          </h2>
          <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            {pageModule.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pageModule.actions.map((action) => {
            const href = pageModule.actionLinks?.[action];
            const button = (
              <Button
                key={action}
                size="sm"
                variant={action === pageModule.actions[0] ? "default" : "secondary"}
              >
                {action}
              </Button>
            );

            if (!href) {
              return button;
            }

            return (
              <Button
                key={action}
                asChild
                size="sm"
                variant={action === pageModule.actions[0] ? "default" : "secondary"}
              >
                <Link href={href}>{action}</Link>
              </Button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {pageModule.metrics.map((metric) => (
          <Card key={metric.label} className="rounded-xl">
            <CardHeader className="space-y-2 p-5">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {metric.label}
              </p>
              <div className="flex items-end justify-between gap-3">
                <p className="text-2xl font-bold text-slate-950 dark:text-white">
                  {metric.value}
                </p>
                <Badge variant="success">{metric.trend}</Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="rounded-xl">
          <CardHeader className="border-b border-slate-200 p-5 dark:border-slate-800">
            <CardTitle>Registros principais</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
            {pageModule.records.map((record) => (
              <div
                key={record.title}
                className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {record.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {record.description}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  <Badge>{record.status}</Badge>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {record.value}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="p-5">
            <CardTitle>Indicadores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pageModule.pipeline.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {item.label}
                  </span>
                  <span className="font-bold text-slate-950 dark:text-white">
                    {item.value}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${Math.max(12, (item.value / max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
