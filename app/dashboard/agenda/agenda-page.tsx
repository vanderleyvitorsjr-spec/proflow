"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarCheck2, CheckCircle2, UsersRound } from "lucide-react";
import { MetricItem, MetricStrip } from "@/components/ui/metric-strip";
import { EmptyState } from "@/components/ui/empty-state";
import { AgendaCalendar } from "./agenda-calendar";
import { createAgendaEventAction, listAgendaEventsAction } from "./agenda-actions";
import { AgendaConflictError } from "./agenda-service";
import { AgendaEventFormDrawer } from "./agenda-event-form-drawer";
import { AgendaSidebar } from "./agenda-sidebar";
import { AgendaToolbar } from "./agenda-toolbar";
import type { AgendaEventFormValues } from "./agenda-schema";
import type { AgendaDisplayEvent } from "./agenda-types";
import type { AgendaEventType, AgendaTeam, AgendaView } from "./agenda-data";
import { getAgendaConfiguration } from "./agenda-configuracoes-gateway";

const periodFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const dayPeriodFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
const typeLabels: Record<AgendaEventType, string> = { INSTALLATION: "Instalação", PREVENTIVE: "Manutenção preventiva", CORRECTIVE: "Manutenção corretiva", ELECTRICAL: "Serviço elétrico", TECHNICAL_VISIT: "Visita técnica", BUDGET: "Orçamento", MEETING: "Reunião" };
function startOfWeek(date: Date) { const result = new Date(date), day = result.getDay(); result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day)); result.setHours(0, 0, 0, 0); return result; }
function getPeriodLabel(view: AgendaView, date: Date) { if (view === "day") return dayPeriodFormatter.format(date); if (view === "week") { const start = startOfWeek(date), end = new Date(start); end.setDate(end.getDate() + 6); const formatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }); return `${formatter.format(start)} – ${formatter.format(end)}`; } return periodFormatter.format(date); }
function movePeriod(date: Date, view: AgendaView, direction: number) { const result = new Date(date); if (view === "day") result.setDate(result.getDate() + direction); else if (view === "week") result.setDate(result.getDate() + 7 * direction); else result.setMonth(result.getMonth() + direction); return result; }
function conflicts(events: AgendaDisplayEvent[]) { return events.filter((event, index) => event.status !== "CANCELED" && events.slice(index + 1).some((other) => other.status !== "CANCELED" && event.technician.toLocaleLowerCase("pt-BR") === other.technician.toLocaleLowerCase("pt-BR") && event.startAt < other.endAt && event.endAt > other.startAt)).length; }

export function AgendaPageContent() {
  const [view, setView] = useState<AgendaView>("week"); const [currentDate, setCurrentDate] = useState(new Date());
  const [configuredTechnicians, setConfiguredTechnicians] = useState<string[]>([]);
  const [events, setEvents] = useState<AgendaDisplayEvent[]>([]); const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); const [typeFilter, setTypeFilter] = useState("ALL"); const [technicianFilter, setTechnicianFilter] = useState("ALL");
  const [drawer, setDrawer] = useState(false); const [saving, setSaving] = useState(false); const [formError, setFormError] = useState(""); const [notice, setNotice] = useState("");
  const load = useCallback(async () => { setLoading(true); setLoadError(""); try { setEvents(await listAgendaEventsAction()); } catch (error) { setLoadError(error instanceof Error ? error.message : "Não foi possível carregar a Agenda."); } finally { setLoading(false); } }, []);
  useEffect(() => { void listAgendaEventsAction().then(setEvents).catch((error: unknown) => setLoadError(error instanceof Error ? error.message : "Não foi possível carregar a Agenda.")).finally(() => setLoading(false)); }, []);
  useEffect(() => { void getAgendaConfiguration().then((result) => { setConfiguredTechnicians(result.team.map((item) => item.name)); if (["day","week","month"].includes(result.settings.initialView)) setView(result.settings.initialView as AgendaView); }); }, []);
  const technicians = useMemo(() => Array.from(new Set([...configuredTechnicians, ...events.map((event) => event.technician)])).sort((a, b) => a.localeCompare(b, "pt-BR")), [configuredTechnicians, events]);
  const eventTypes = useMemo(() => Object.entries(typeLabels).map(([value, label]) => ({ value, label })), []);
  const filteredEvents = useMemo(() => { const term = searchTerm.trim().toLocaleLowerCase("pt-BR"); return events.filter((event) => (!term || [event.title, event.customer, event.serviceOrderNumber, event.technician, event.city, typeLabels[event.type]].filter(Boolean).some((value) => String(value).toLocaleLowerCase("pt-BR").includes(term))) && (typeFilter === "ALL" || event.type === typeFilter) && (technicianFilter === "ALL" || event.technician === technicianFilter)); }, [events, searchTerm, technicianFilter, typeFilter]);
  const teams = useMemo<AgendaTeam[]>(() => technicians.map((name) => { const active = events.some((event) => event.technician === name && event.status !== "CANCELED" && new Date(event.startAt) <= new Date() && new Date(event.endAt) > new Date()); return { id: `team-${name.toLocaleLowerCase("pt-BR").replaceAll(" ", "-")}`, name, specialty: "Responsável da Agenda", status: active ? "BUSY" : "AVAILABLE" }; }), [events, technicians]);
  const submit = async (value: AgendaEventFormValues) => { setSaving(true); setFormError(""); try { await createAgendaEventAction(value); await load(); setDrawer(false); setNotice(value.recurrence === "NONE" ? "Evento salvo com sucesso." : "Série recorrente salva com sucesso."); } catch (error) { setFormError(error instanceof AgendaConflictError ? `${error.message} Conflitos: ${error.conflicts.map((item) => `${item.title} (${item.startAt.slice(11, 16)}–${item.endAt.slice(11, 16)})`).join(", ")}. Ajuste o horário ou o responsável.` : error instanceof Error ? error.message : "Não foi possível salvar."); } finally { setSaving(false); } };
  const metrics = [{ label: "Eventos no período", value: filteredEvents.length, icon: CalendarCheck2, tone: "info" as const }, { label: "Conflitos detectados", value: conflicts(filteredEvents), icon: AlertTriangle, tone: "warning" as const }, { label: "Concluídos", value: filteredEvents.filter((e) => e.status === "COMPLETED").length, icon: CheckCircle2, tone: "success" as const }, { label: "Responsáveis disponíveis", value: teams.filter((t) => t.status === "AVAILABLE").length, icon: UsersRound, tone: "violet" as const }];
  return <div className="space-y-3">
    <AgendaToolbar view={view} searchTerm={searchTerm} typeFilter={typeFilter} technicianFilter={technicianFilter} periodLabel={getPeriodLabel(view, currentDate)} eventTypes={eventTypes} technicians={technicians} onViewChange={setView} onSearchChange={setSearchTerm} onTypeFilterChange={setTypeFilter} onTechnicianFilterChange={setTechnicianFilter} onPreviousPeriod={() => setCurrentDate((date) => movePeriod(date, view, -1))} onNextPeriod={() => setCurrentDate((date) => movePeriod(date, view, 1))} onToday={() => setCurrentDate(new Date())} onNewEvent={() => { setFormError(""); setDrawer(true); }} />
    {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">{notice}</div>}
    <MetricStrip className="sm:min-w-0 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores da agenda">{metrics.map((metric) => { const Icon = metric.icon; return <MetricItem key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} icon={<Icon className="h-4 w-4" aria-hidden="true" />} />; })}</MetricStrip>
    {loading ? <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Carregando Agenda...</div> : loadError ? <EmptyState title="Não foi possível carregar" description={loadError} /> : <section className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_18rem]"><div className="min-w-0"><AgendaCalendar view={view} currentDate={currentDate} events={filteredEvents} /></div><AgendaSidebar events={filteredEvents} teams={teams} currentDate={currentDate} /></section>}
    <AgendaEventFormDrawer open={drawer} busy={saving} error={formError} onClose={() => setDrawer(false)} onSubmit={submit} />
  </div>;
}
export default AgendaPageContent;
