import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { MaintenanceRecord } from "./equipamentos-types";
const status = {
  SCHEDULED: "Programada",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  CANCELED: "Cancelada",
} as const;
const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
const date = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("pt-BR").format(
        new Date(value.length === 10 ? `${value}T12:00:00` : value),
      )
    : "Não informado";
export function EquipmentMaintenanceList({
  records,
  busyId,
  onEdit,
  onStart,
  onComplete,
  onCancel,
  onFinancial,
}: {
  records: MaintenanceRecord[];
  busyId?: string;
  onEdit: (record: MaintenanceRecord) => void;
  onStart: (record: MaintenanceRecord) => void;
  onComplete: (record: MaintenanceRecord) => void;
  onCancel: (record: MaintenanceRecord) => void;
  onFinancial: (record: MaintenanceRecord) => void;
}) {
  if (!records.length)
    return (
      <EmptyState
        title="Nenhuma manutenção registrada"
        description="Registre a primeira manutenção preventiva ou corretiva."
      />
    );
  return (
    <div className="divide-y">
      {records.map((record) => (
        <article
          key={record.id}
          className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{record.title}</p>
              <Badge
                variant={
                  record.status === "CANCELED"
                    ? "outline"
                    : record.status === "IN_PROGRESS"
                      ? "warning"
                      : "neutral"
                }
              >
                {status[record.status]}
              </Badge>
              <Badge variant="outline">
                {record.type === "PREVENTIVE" ? "Preventiva" : "Corretiva"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {date(record.scheduledAt)} · {record.supplier || "Sem fornecedor"} ·{" "}
              {money(record.costCents)}
              {record.serviceOrderId ? (
                <>
                  {" "}
                  ·{" "}
                  <Link
                    className="text-primary hover:underline"
                    href={`/dashboard/ordens/${record.serviceOrderId}`}
                  >
                    {record.serviceOrderNumberSnapshot}
                  </Link>
                </>
              ) : null}
              {record.financialTransactionId ? (
                <>
                  {" "}
                  ·{" "}
                  <Link
                    className="text-primary hover:underline"
                    href={`/dashboard/financeiro/${record.financialTransactionId}`}
                  >
                    {record.financialSnapshot?.number ?? "Financeiro"}
                  </Link>
                </>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {record.status === "SCHEDULED" ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === record.id}
                  onClick={() => onEdit(record)}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  disabled={busyId === record.id}
                  onClick={() => onStart(record)}
                >
                  Iniciar
                </Button>
              </>
            ) : null}
            {record.status === "IN_PROGRESS" ? (
              <Button
                size="sm"
                disabled={busyId === record.id}
                onClick={() => onComplete(record)}
              >
                Concluir
              </Button>
            ) : null}
            {record.status === "COMPLETED" ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === record.id}
                  onClick={() => onEdit(record)}
                >
                  Ajustar custo
                </Button>
                {record.costCents > 0 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyId === record.id}
                    onClick={() => onFinancial(record)}
                  >
                    {record.financialTransactionId ? "Ver financeiro" : "Gerar despesa"}
                  </Button>
                ) : null}
              </>
            ) : null}
            {record.status !== "COMPLETED" && record.status !== "CANCELED" ? (
              <Button
                size="sm"
                variant="destructive"
                disabled={busyId === record.id}
                onClick={() => onCancel(record)}
              >
                Cancelar
              </Button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
