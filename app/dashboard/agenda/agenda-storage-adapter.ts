import type { AgendaIndependentEvent, AgendaOsLink } from "./agenda-types";
export type AgendaStorageState = { events: AgendaIndependentEvent[]; osLinks: AgendaOsLink[] };
export interface AgendaStorageAdapter { read(): Promise<AgendaStorageState>; write(state: AgendaStorageState): Promise<void> }
const KEY = "proflow:agenda:v1"; const initial: AgendaStorageState = { events: [], osLinks: [] };
export class LocalAgendaStorageAdapter implements AgendaStorageAdapter { async read() { if (typeof window === "undefined") return initial; const raw = window.localStorage.getItem(KEY); if (!raw) { await this.write(initial); return structuredClone(initial); } try { return JSON.parse(raw) as AgendaStorageState; } catch { throw new Error("Não foi possível ler a Agenda armazenada."); } } async write(state: AgendaStorageState) { if (typeof window === "undefined") return; try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { throw new Error("Não foi possível salvar a Agenda."); } } }
export const agendaStorageAdapter: AgendaStorageAdapter = new LocalAgendaStorageAdapter();
