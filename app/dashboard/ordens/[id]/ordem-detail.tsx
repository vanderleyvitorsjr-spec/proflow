"use client";
import Link from "next/link";
import { ArrowLeft, Archive, Ban, ClipboardList, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIcon,
  PageHeaderIdentity,
} from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { OrdemFormDrawer } from "../ordem-form-drawer";
import { OrdemChecklist } from "../ordem-checklist";
import { OrdemExecutionPanel } from "../ordem-execution-panel";
import { OrdemEvidencePanel } from "../ordem-evidence-panel";
import {
  addOrdemWorkNoteAction,
  archiveOrdemAction,
  cancelOrdemAction,
  changeOrdemStatusAction,
  completeOrdemExecutionAction,
  getOrdemAction,
  pauseOrdemExecutionAction,
  resumeOrdemExecutionAction,
  startOrdemExecutionAction,
  updateOrdemAction,
  updateOrdemChecklistAction,
  updateOrdemTeamAction,
} from "../ordens-actions";
import type { OrdemFormValues } from "../ordens-schema";
import type { OrdemRecord, OrdemWorkNote } from "../ordens-types";
import type { ServiceOrderStatus } from "../ordens-data";
import { ptBrLabel } from "@/lib/pt-br-labels";
import {
  formatCurrencyBRLFromCents,
  formatDateBR,
  formatDateTimeBR,
  normalizeProperName,
} from "@/lib/br-formatters";
const datetime = { format: (value: Date) => formatDateTimeBR(value.toISOString()) };
const statuses: Array<[ServiceOrderStatus, string]> = [
  ["OPEN", "Aberta"],
  ["SCHEDULED", "Agendada"],
  ["IN_TRANSIT", "Em deslocamento"],
  ["IN_PROGRESS", "Em execução"],
  ["WAITING_PART", "Aguardando peça"],
  ["COMPLETED", "Concluída"],
  ["CANCELED", "Cancelada"],
  ["OVERDUE", "Atrasada"],
];
export function OrdemDetail({ id }: { id: string }) {
  const [order, setOrder] = useState<OrdemRecord | null>(null),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [editing, setEditing] = useState(false),
    [canceling, setCanceling] = useState(false),
    [archiving, setArchiving] = useState(false),
    [reason, setReason] = useState(""),
    [error, setError] = useState<string | null>(null);
  async function reload() {
    const record = await getOrdemAction(id);
    setOrder(record);
    return record;
  }
  useEffect(() => {
    let active = true;
    void getOrdemAction(id)
      .then((record) => {
        if (active) setOrder(record);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Não foi possível carregar a Ordem.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (loading) return <div className="h-80 animate-pulse rounded-xl bg-muted" />;
  if (!order)
    return (
      <EmptyState
        title="Ordem não encontrada"
        description={error ?? "A Ordem pode ter sido arquivada."}
        action={
          <Button asChild>
            <Link href="/dashboard/ordens">Voltar</Link>
          </Button>
        }
      />
    );
  async function save(values: OrdemFormValues) {
    setSaving(true);
    try {
      await updateOrdemAction(id, values);
      await reload();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }
  async function status(value: ServiceOrderStatus) {
    setSaving(true);
    try {
      await changeOrdemStatusAction(id, value);
      await reload();
    } finally {
      setSaving(false);
    }
  }
  async function cancel() {
    setSaving(true);
    try {
      await cancelOrdemAction(id, reason);
      await reload();
      setCanceling(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível cancelar.");
    } finally {
      setSaving(false);
    }
  }
  async function archive() {
    setSaving(true);
    await archiveOrdemAction(id);
    window.location.assign("/dashboard/ordens");
  }
  return (
    <div className="space-y-3">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <PageHeaderIcon>
              <ClipboardList className="h-5 w-5" />
            </PageHeaderIcon>
            <PageHeaderHeading
              title={`${order.orderNumber} · ${order.title}`}
              description={order.clientName}
            />
          </PageHeaderIdentity>
          <PageHeaderActions>
            <Button asChild variant="secondary">
              <Link href="/dashboard/ordens">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="secondary"
              onClick={() => setCanceling(true)}
              disabled={order.status === "CANCELED"}
            >
              <Ban className="h-4 w-4" />
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => setArchiving(true)}
              disabled={saving}
            >
              <Archive className="h-4 w-4" />
              Arquivar
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/30 p-3 text-sm text-rose-600"
        >
          {error}
        </div>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Dados operacionais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
              <Info
                label="Cliente"
                value={order.clientName}
                link={`/dashboard/clientes/${order.clientId}`}
              />
              <Info
                label="Origem CRM"
                value={order.crmLeadId ? "Lead vinculado" : "Sem origem comercial"}
                link={order.crmLeadId ? `/dashboard/crm/${order.crmLeadId}` : undefined}
              />
              <Info label="Categoria" value={ptBrLabel(order.category)} />
              <Info label="Prioridade" value={ptBrLabel(order.priority)} />
              <div>
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  <Select
                    value={order.status}
                    onChange={(event) =>
                      void status(event.target.value as ServiceOrderStatus)
                    }
                    disabled={saving}
                  >
                    {statuses.map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </dd>
              </div>
              <Info label="Responsável" value={normalizeProperName(order.technician)} />
              <Info
                label="Endereço"
                value={`${order.address}, ${normalizeProperName(order.city)} - ${order.state.toUpperCase()}`}
              />
              <Info
                label="Agenda"
                value={`${formatDateBR(order.scheduledDate)} às ${order.scheduledTime}`}
              />
              <Info label="Duração" value={`${order.estimatedDurationMinutes} minutos`} />
              <Info
                label="Valor previsto"
                value={formatCurrencyBRLFromCents(Math.round(order.estimatedValue * 100))}
              />
              <Info label="Descrição" value={order.description} />
              <Info label="Observações" value={order.notes || "Sem observações"} />
            </CardContent>
          </Card>
          <OrdemExecutionPanel
            order={order}
            saving={saving}
            onStart={async () => {
              setSaving(true);
              try {
                await startOrdemExecutionAction(id);
                await reload();
              } finally {
                setSaving(false);
              }
            }}
            onPause={async () => {
              setSaving(true);
              try {
                await pauseOrdemExecutionAction(id);
                await reload();
              } finally {
                setSaving(false);
              }
            }}
            onResume={async () => {
              setSaving(true);
              try {
                await resumeOrdemExecutionAction(id);
                await reload();
              } finally {
                setSaving(false);
              }
            }}
            onComplete={async () => {
              setSaving(true);
              try {
                await completeOrdemExecutionAction(id);
                await reload();
              } finally {
                setSaving(false);
              }
            }}
            onAddNote={async (visibility: OrdemWorkNote["visibility"], text: string) => {
              setSaving(true);
              try {
                await addOrdemWorkNoteAction(id, visibility, text);
                await reload();
              } finally {
                setSaving(false);
              }
            }}
            onUpdateTeam={async (members: string[]) => {
              setSaving(true);
              try {
                await updateOrdemTeamAction(id, members);
                await reload();
              } finally {
                setSaving(false);
              }
            }}
          />
          <Card>
            <CardContent className="p-4">
              <OrdemChecklist
                items={order.checklist}
                saving={saving}
                onSave={async (items) => {
                  setSaving(true);
                  try {
                    await updateOrdemChecklistAction(id, items);
                    await reload();
                  } finally {
                    setSaving(false);
                  }
                }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recursos vinculados</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <List title="Equipamentos" values={order.equipment} />
              <List title="Materiais reservados" values={order.reservedMaterials} />
            </CardContent>
          </Card>
        </div>
        <OrdemEvidencePanel order={order} onChanged={setOrder} />
        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.history
              .slice()
              .reverse()
              .map((item) => (
                <div key={item.id} className="border-l-2 border-sky-500 pl-3">
                  <Badge variant="outline">{ptBrLabel(item.type)}</Badge>
                  <p className="mt-1 text-sm">{item.description}</p>
                  <time className="text-xs text-muted-foreground">
                    {datetime.format(new Date(item.createdAt))}
                  </time>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
      <OrdemFormDrawer
        open={editing}
        order={order}
        saving={saving}
        onClose={() => setEditing(false)}
        onSubmit={save}
      />
      {canceling ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
            className="w-full max-w-md rounded-xl border bg-card p-5"
          >
            <h2 id="cancel-title" className="font-semibold">
              Cancelar {order.orderNumber}?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              O motivo será preservado no histórico.
            </p>
            <Input
              className="mt-3"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Motivo obrigatório"
              aria-label="Motivo do cancelamento"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                autoFocus
                variant="secondary"
                onClick={() => setCanceling(false)}
                disabled={saving}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={() => void cancel()}
                disabled={saving}
              >
                {saving ? "Cancelando..." : "Confirmar cancelamento"}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
      {archiving ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="archive-detail-title"
            className="w-full max-w-md rounded-xl border bg-card p-5"
          >
            <h2 id="archive-detail-title" className="font-semibold">
              Arquivar {order.orderNumber}?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              O registro e o histórico serão preservados localmente.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                autoFocus
                variant="secondary"
                onClick={() => setArchiving(false)}
                disabled={saving}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={() => void archive()}
                disabled={saving}
              >
                {saving ? "Arquivando..." : "Confirmar arquivamento"}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
function Info({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">
        {link ? (
          <Link className="text-sky-600 hover:underline" href={link}>
            {value}
          </Link>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
function List({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {values.length ? (
        <ul className="mt-2 space-y-1 text-sm">
          {values.map((value) => (
            <li key={value}>• {value}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Nenhum item vinculado.</p>
      )}
    </div>
  );
}
