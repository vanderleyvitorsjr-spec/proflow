"use client";
import { calculateNextMaintenance, type PreventiveFrequency, type TechnicalMeasurement } from "./equipamento-tecnico-domain";
import { equipmentTechnicalRepository } from "./equipamento-tecnico-repository";
export const equipmentTechnicalService = {
  listAll: () => equipmentTechnicalRepository.read(),
  list(equipmentId: string) {
    const state = equipmentTechnicalRepository.read();
    return { measurements: state.measurements.filter((item) => item.equipmentId === equipmentId), events: state.events.filter((item) => item.equipmentId === equipmentId).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)), plans: state.preventivePlans.filter((item) => item.equipmentId === equipmentId) };
  },
  addMeasurement(input: Omit<TechnicalMeasurement, "id" | "measuredAt"> & { measuredAt?: string }) {
    if (!Number.isFinite(input.value)) throw new Error("Informe uma medição válida.");
    const state = equipmentTechnicalRepository.read(), measuredAt = input.measuredAt ?? new Date().toISOString();
    const measurement = { ...input, id: crypto.randomUUID(), measuredAt };
    equipmentTechnicalRepository.save({ ...state, measurements: [...state.measurements, measurement], events: [...state.events, { id: crypto.randomUUID(), equipmentId: input.equipmentId, serviceOrderId: input.serviceOrderId, type: "MEASUREMENT", title: `Medição registrada: ${input.value} ${input.unit}`, responsible: input.responsible, occurredAt: measuredAt }] });
    return measurement;
  },
  addEvent(input: { equipmentId: string; serviceOrderId?: string; type: "INSTALLATION" | "MAINTENANCE" | "DIAGNOSIS" | "PART_REPLACEMENT" | "WARRANTY"; title: string; description?: string; responsible?: string; occurredAt?: string }) {
    const state = equipmentTechnicalRepository.read();
    const event = { ...input, id: crypto.randomUUID(), occurredAt: input.occurredAt ?? new Date().toISOString() };
    equipmentTechnicalRepository.save({ ...state, events: [...state.events, event] }); return event;
  },
  schedulePreventive(equipmentId: string, baseDate: string, frequency: PreventiveFrequency, interval = 1) {
    const state = equipmentTechnicalRepository.read();
    const plan = { id: crypto.randomUUID(), equipmentId, frequency, interval, nextMaintenanceAt: calculateNextMaintenance(baseDate, frequency, interval), active: true };
    equipmentTechnicalRepository.save({ ...state, preventivePlans: [...state.preventivePlans, plan] }); return plan;
  },
  setPreventiveActive(planId: string, active: boolean) {
    const state = equipmentTechnicalRepository.read(), current = state.preventivePlans.find((item) => item.id === planId);
    if (!current) throw new Error("Plano preventivo não encontrado.");
    const updated = { ...current, active };
    equipmentTechnicalRepository.save({ ...state, preventivePlans: state.preventivePlans.map((item) => item.id === planId ? updated : item) }); return updated;
  },
  completePreventive(planId: string, completedAt = new Date().toISOString()) {
    const state = equipmentTechnicalRepository.read(), current = state.preventivePlans.find((item) => item.id === planId);
    if (!current) throw new Error("Plano preventivo não encontrado.");
    const updated = { ...current, lastMaintenanceAt: completedAt, nextMaintenanceAt: calculateNextMaintenance(completedAt, current.frequency, current.interval) };
    equipmentTechnicalRepository.save({ ...state, preventivePlans: state.preventivePlans.map((item) => item.id === planId ? updated : item), events: [...state.events, { id: crypto.randomUUID(), equipmentId: current.equipmentId, type: "MAINTENANCE", title: "Manutenção Preventiva Realizada", occurredAt: completedAt }] }); return updated;
  },
  linkServiceOrder(equipmentId: string, serviceOrderId: string, number: string, title: string) {
    const state = equipmentTechnicalRepository.read();
    if (state.events.some((item) => item.equipmentId === equipmentId && item.serviceOrderId === serviceOrderId)) return state;
    return equipmentTechnicalRepository.save({ ...state, events: [...state.events, { id: crypto.randomUUID(), equipmentId, serviceOrderId, type: "MAINTENANCE", title: `${number} — ${title}`, occurredAt: new Date().toISOString() }] });
  },
};
