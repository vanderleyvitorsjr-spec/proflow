"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";

import { listClientsAction } from "@/app/dashboard/clientes/actions";
import type { ClientRecord } from "@/app/dashboard/clientes/clientes-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { ProperNameInput } from "@/components/ui/br-masked-inputs";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

import { agendaEventSchema, type AgendaEventFormValues } from "./agenda-schema";
import type { AgendaDisplayEvent } from "./agenda-types";
import { getAgendaConfiguration } from "./agenda-configuracoes-gateway";
import type { TeamMemberPublicReference } from "@/lib/contracts/configuracoes.contract";
import { teamRoleLabel } from "@/lib/pt-br-labels";

type Props = { open: boolean; event?: AgendaDisplayEvent | null; busy?: boolean; error?: string; onClose: () => void; onSubmit: (value: AgendaEventFormValues) => Promise<void> };

const initial = (event?: AgendaDisplayEvent | null): AgendaEventFormValues => ({
  title: event?.title ?? "", type: event?.type ?? "MEETING", description: event?.description ?? "",
  responsible: event?.technician ?? "", clientId: event?.clientId ?? "",
  date: event?.startAt.slice(0, 10) ?? new Date().toISOString().slice(0, 10), startTime: event?.startAt.slice(11, 16) ?? "08:00",
  endTime: event?.endAt.slice(11, 16) ?? "09:00", address: event?.address ?? "", city: event?.city ?? "", state: event?.state ?? "BA",
  priority: event?.priority ?? "NORMAL", status: event?.status ?? "PENDING", notes: event?.notes ?? "", recurrence: "NONE", occurrences: 1,
});

export function AgendaEventFormDrawer({ open, event, busy, error, onClose, onSubmit }: Props) {
  const [values, setValues] = useState<AgendaEventFormValues>(() => initial(event));
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [validation, setValidation] = useState("");
  const [team, setTeam] = useState<TeamMemberPublicReference[]>([]), [configurationWarning, setConfigurationWarning] = useState("");
  useEffect(() => { if (open) { queueMicrotask(() => { setValues(initial(event)); setValidation(""); }); void listClientsAction().then(setClients); void getAgendaConfiguration().then((result) => { setTeam(result.team); setConfigurationWarning(result.warning ?? ""); if (!event) setValues((current) => ({ ...current, responsible: result.team.length === 1 ? result.team[0].name : current.responsible, startTime: result.settings.startTime, endTime: addMinutes(result.settings.startTime, result.settings.defaultDurationMinutes) })); }); } }, [event, open]);
  useEffect(() => { if (!open) return; const listener = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); }; window.addEventListener("keydown", listener); return () => window.removeEventListener("keydown", listener); }, [busy, onClose, open]);
  if (!open) return null;
  const set = <K extends keyof AgendaEventFormValues>(key: K, value: AgendaEventFormValues[K]) => setValues((current) => ({ ...current, [key]: value }));
  const submit = async (e: FormEvent) => { e.preventDefault(); const parsed = agendaEventSchema.safeParse(values); if (!parsed.success) { setValidation(parsed.error.issues[0]?.message ?? "Revise os campos."); return; } setValidation(""); await onSubmit(parsed.data); };
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45" role="presentation" onMouseDown={(e) => { if (e.currentTarget === e.target && !busy) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="agenda-form-title" className="h-[100dvh] w-full overflow-hidden border-l border-border bg-background shadow-2xl sm:max-w-2xl">
      <form onSubmit={submit} className="flex h-full min-h-0 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-5 py-4"><div><h2 id="agenda-form-title" className="text-lg font-bold">{event ? "Editar evento" : "Novo evento"}</h2><p className="text-xs text-muted-foreground">{event?.origin === "SERVICE_ORDER" ? "Dados operacionais serão atualizados na Ordem de Serviço." : "Compromisso independente persistido na Agenda."}</p></div><Button type="button" variant="ghost" size="icon" onClick={onClose} disabled={busy} aria-label="Fechar"><X className="h-4 w-4" /></Button></header>
        <div className="grid flex-1 gap-4 overflow-y-auto p-4 pb-28 sm:grid-cols-2 sm:p-5">
          <Field className="sm:col-span-2" label="Compromisso ou serviço" description="Dê um nome objetivo ao evento para facilitar a identificação na agenda." htmlFor="event-title" required><ProperNameInput id="event-title" autoFocus placeholder="Ex.: Visita técnica para avaliação de ar-condicionado" value={values.title} onValueChange={(value) => set("title", value)} /></Field>
          <Field label="Tipo de compromisso" description="Escolha o tipo de atividade que será realizada."><Select value={values.type} onChange={(e) => set("type", e.target.value as AgendaEventFormValues["type"])}><option value="MEETING">Reunião</option><option value="TECHNICAL_VISIT">Visita técnica</option><option value="BUDGET">Orçamento</option><option value="INSTALLATION">Instalação</option><option value="PREVENTIVE">Preventiva</option><option value="CORRECTIVE">Corretiva</option><option value="ELECTRICAL">Elétrica</option></Select></Field>
          <Field label="Cliente vinculado" description="Vincule um cliente quando este compromisso estiver relacionado a um atendimento."><Select value={values.clientId} onChange={(e) => set("clientId", e.target.value)} disabled={event?.origin === "SERVICE_ORDER"}><option value="">Sem cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</Select></Field>
          <Field className="sm:col-span-2" label="Descrição" description="Explique o objetivo do compromisso e o que deve ser realizado."><textarea className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={values.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <Field label="Responsável pelo compromisso" description="Selecione quem deverá executar ou acompanhar esta atividade."><Select value={values.responsible} onChange={(e) => set("responsible", e.target.value)}><option value="">Selecione</option>{event?.technician && !team.some((item) => item.name === event.technician) ? <option value={event.technician}>{event.technician} (legado)</option> : null}{team.map((item) => <option key={item.id} value={item.name}>{item.name} · {teamRoleLabel(item.role)}</option>)}</Select>{configurationWarning ? <p className="mt-1 text-[11px] text-amber-600">{configurationWarning}</p> : null}</Field>
          <Field label="Data do compromisso" help="Dia em que a atividade deverá acontecer."><Input type="date" value={values.date} onChange={(e) => set("date", e.target.value)} /></Field>
          <Field label="Horário de início" help="Horário previsto para começar."><Input type="time" value={values.startTime} onChange={(e) => set("startTime", e.target.value)} /></Field><Field label="Horário de término" help="Horário previsto para finalizar."><Input type="time" value={values.endTime} onChange={(e) => set("endTime", e.target.value)} /></Field>
          <Field className="sm:col-span-2" label="Local do compromisso" help="Informe o endereço ou ponto de referência do atendimento."><ProperNameInput placeholder="Ex.: Rua Central, 150, Sala 2" value={values.address} onValueChange={(value) => set("address", value)} /></Field><Field label="Cidade"><ProperNameInput placeholder="Ex.: Porto Seguro" value={values.city} onValueChange={(value) => set("city", value)} /></Field><Field label="Estado (UF)" help="Use a sigla com duas letras. Ex.: BA."><Input maxLength={2} value={values.state} onChange={(e) => set("state", e.target.value.toUpperCase())} /></Field>
          <Field label="Prioridade do compromisso" help="Use Urgente apenas quando houver risco operacional ou necessidade de atendimento imediato."><Select value={values.priority} onChange={(e) => set("priority", e.target.value as AgendaEventFormValues["priority"])}><option value="LOW">Baixa</option><option value="NORMAL">Normal</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option></Select></Field><Field label="Situação do compromisso" help="Indique se a atividade está agendada, confirmada, em andamento ou concluída."><Select value={values.status} onChange={(e) => set("status", e.target.value as AgendaEventFormValues["status"])}><option value="PENDING">Agendado</option><option value="CONFIRMED">Confirmado</option><option value="IN_PROGRESS">Em andamento</option><option value="COMPLETED">Concluído</option><option value="CANCELED">Cancelado</option></Select></Field>
          {event?.origin !== "SERVICE_ORDER" && <><Field label="Repetição do compromisso" help="Use quando a mesma atividade deve ser criada semanal ou mensalmente."><Select value={values.recurrence} onChange={(e) => set("recurrence", e.target.value as AgendaEventFormValues["recurrence"])}><option value="NONE">Não repetir</option><option value="WEEKLY">Toda semana</option><option value="MONTHLY">Todo mês</option></Select></Field><Field label="Quantidade de repetições" help="Número total de compromissos que serão criados."><Input type="number" min={1} max={24} disabled={values.recurrence === "NONE"} value={values.occurrences} onChange={(e) => set("occurrences", Number(e.target.value))} /></Field></>}
          <div className="sm:col-span-2"><Label>Observações</Label><textarea className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={values.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          {(validation || error) && <div role="alert" className="sm:col-span-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">{validation || error}</div>}
        </div>
        <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background px-5 py-4"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar evento"}</Button></footer>
      </form>
    </section>
  </div>;
}
function addMinutes(time: string, minutes: number) { const [hour, minute] = time.split(":").map(Number), total = hour * 60 + minute + minutes; return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`; }
