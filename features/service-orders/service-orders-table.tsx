import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { serviceOrders } from "@/features/service-orders/service-orders-data";
import { ptBrLabel } from "@/lib/pt-br-labels";

export function ServiceOrdersTable() {
  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Ordens de Serviço
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gerencie execuções, manutenções e chamados técnicos
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">Filtrar</Button>
          <Button>Nova OS</Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-12 gap-4 border-b border-slate-200 bg-slate-50/70 p-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-400 lg:grid">
          <div className="col-span-2">Número / Data</div>
          <div className="col-span-3">Cliente / Local</div>
          <div className="col-span-3">Serviço</div>
          <div className="col-span-2">Equipe / Veículo</div>
          <div className="col-span-2">Status</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {serviceOrders.map((order) => (
            <div
              key={order.id}
              className="grid gap-4 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 lg:grid-cols-12 lg:items-center"
            >
              <div className="lg:col-span-2">
                <p className="font-bold text-slate-900 dark:text-white">{order.id}</p>
                <p className="mt-0.5 text-xs text-slate-500">{order.scheduledFor}</p>
              </div>
              <div className="lg:col-span-3">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {order.customer}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{order.location}</p>
              </div>
              <div className="lg:col-span-3">
                <Badge>{ptBrLabel(order.category)}</Badge>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {order.service}
                </p>
              </div>
              <div className="lg:col-span-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {order.technician}
                </p>
                {order.vehicle && (
                  <p className="mt-0.5 text-xs text-slate-500">{order.vehicle}</p>
                )}
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Sup: {order.supervisor}
                </p>
              </div>
              <div className="lg:col-span-2">
                <Badge variant={order.tone}>{ptBrLabel(order.status)}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
