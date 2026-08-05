"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDateBR, formatDateTimeBR } from "@/lib/br-formatters";
import { addEquipmentMeasurementAction, addEquipmentTechnicalEventAction, completeEquipmentPreventiveAction, listEquipmentTechnicalHistoryAction, scheduleEquipmentPreventiveAction, setEquipmentPreventiveActiveAction } from "./equipamento-tecnico-actions";
import { maintenanceSituation, type EquipmentTechnicalEvent, type PreventiveFrequency, type PreventivePlan, type TechnicalMeasurement, type TechnicalMeasurementType } from "./equipamento-tecnico-domain";
export function EquipmentTechnicalPanel({ equipmentId }: { equipmentId: string }) {
  const [measurements, setMeasurements] = useState<TechnicalMeasurement[]>([]);
  const [events, setEvents] = useState<EquipmentTechnicalEvent[]>([]);
  const [plans, setPlans] = useState<PreventivePlan[]>([]);
  const [measurementType, setMeasurementType] = useState<TechnicalMeasurementType>("TEMPERATURE");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("°C");
  const [eventTitle, setEventTitle] = useState("");
  const [frequency, setFrequency] = useState<PreventiveFrequency>("MONTHLY");
  const [baseDate, setBaseDate] = useState(new Date().toISOString().slice(0, 10));
  const refresh = () => listEquipmentTechnicalHistoryAction(equipmentId).then((data) => { setMeasurements(data.measurements); setEvents(data.events); setPlans(data.plans); });
  useEffect(() => {
    void listEquipmentTechnicalHistoryAction(equipmentId).then((data) => {
      setMeasurements(data.measurements);
      setEvents(data.events);
      setPlans(data.plans);
    });
  }, [equipmentId]);
  const lastByType = useMemo(() => new Map(measurements.slice().sort((a, b) => a.measuredAt.localeCompare(b.measuredAt)).map((item) => [item.type, item])), [measurements]);
  async function addMeasurement() {
    await addEquipmentMeasurementAction({ equipmentId, type: measurementType, value: Number(value.replace(",", ".")), unit });
    setValue(""); await refresh();
  }
  async function addEvent() {
    if (!eventTitle.trim()) return;
    await addEquipmentTechnicalEventAction({ equipmentId, type: "DIAGNOSIS", title: eventTitle });
    setEventTitle(""); await refresh();
  }
  async function addPlan() { await scheduleEquipmentPreventiveAction(equipmentId, baseDate, frequency); await refresh(); }
  return <section className="space-y-4 rounded-xl border bg-card p-4">
    <div><h2 className="font-semibold">Ficha Técnica e Manutenção Preventiva</h2><p className="text-xs text-muted-foreground">Registre somente medições e informações técnicas verificadas.</p></div>
    <div className="grid gap-3 lg:grid-cols-3">
      <div className="space-y-2 rounded-lg bg-muted/40 p-3"><h3 className="text-sm font-semibold">Nova Medição</h3><Select value={measurementType} onChange={(event) => setMeasurementType(event.target.value as TechnicalMeasurementType)}><option value="TEMPERATURE">Temperatura</option><option value="PRESSURE">Pressão</option><option value="VOLTAGE">Tensão</option><option value="CURRENT">Corrente</option><option value="RESISTANCE">Resistência</option><option value="INSULATION">Isolamento</option><option value="OTHER">Outra</option></Select><div className="flex gap-2"><Input value={value} onChange={(event) => setValue(event.target.value)} inputMode="decimal" placeholder="Valor medido" /><Input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="Unidade" /></div><Button size="sm" onClick={() => void addMeasurement()} disabled={!value}>Registrar Medição</Button></div>
      <div className="space-y-2 rounded-lg bg-muted/40 p-3"><h3 className="text-sm font-semibold">Diagnóstico ou Evento</h3><Input value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} placeholder="Ex.: Pressão abaixo do recomendado" /><Button size="sm" onClick={() => void addEvent()} disabled={!eventTitle.trim()}>Registrar Evento</Button></div>
      <div className="space-y-2 rounded-lg bg-muted/40 p-3"><h3 className="text-sm font-semibold">Plano Preventivo</h3><Select value={frequency} onChange={(event) => setFrequency(event.target.value as PreventiveFrequency)}><option value="WEEKLY">Semanal</option><option value="MONTHLY">Mensal</option><option value="BIMONTHLY">Bimestral</option><option value="QUARTERLY">Trimestral</option><option value="SEMIANNUAL">Semestral</option><option value="ANNUAL">Anual</option></Select><Input type="date" value={baseDate} onChange={(event) => setBaseDate(event.target.value)} /><Button size="sm" onClick={() => void addPlan()}>Criar Plano</Button></div>
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      <div><h3 className="mb-2 text-sm font-semibold">Últimas Medições</h3>{lastByType.size ? [...lastByType.values()].map((item) => <div key={item.id} className="border-b py-2 text-sm"><strong>{item.value.toLocaleString("pt-BR")} {item.unit}</strong><p className="text-xs text-muted-foreground">{formatDateTimeBR(item.measuredAt)}</p></div>) : <EmptyState title="Sem Medições" description="Registre a primeira medição técnica." />}</div>
      <div><h3 className="mb-2 text-sm font-semibold">Planos Preventivos</h3>{plans.length ? plans.map((plan) => <div key={plan.id} className="border-b py-2 text-sm"><div className="flex justify-between"><strong>{plan.active ? "Ativo" : "Pausado"}</strong><span>{maintenanceSituation(plan.nextMaintenanceAt) === "OVERDUE" ? "Vencida" : formatDateBR(plan.nextMaintenanceAt)}</span></div><div className="mt-2 flex gap-1"><Button size="sm" variant="ghost" onClick={() => setEquipmentPreventiveActiveAction(plan.id, !plan.active).then(refresh)}>{plan.active ? "Pausar" : "Reativar"}</Button><Button size="sm" variant="ghost" onClick={() => completeEquipmentPreventiveAction(plan.id).then(refresh)}>Marcar Realizada</Button></div></div>) : <EmptyState title="Sem Plano Preventivo" description="Crie um plano para acompanhar a próxima manutenção." />}</div>
      <div><h3 className="mb-2 text-sm font-semibold">Histórico Técnico Local</h3>{events.length ? events.slice(0, 12).map((event) => <div key={event.id} className="border-b py-2 text-sm"><strong>{event.title}</strong><p className="text-xs text-muted-foreground">{formatDateTimeBR(event.occurredAt)}</p></div>) : <EmptyState title="Sem Histórico Adicional" description="Eventos técnicos aparecerão aqui." />}</div>
    </div>
  </section>;
}
