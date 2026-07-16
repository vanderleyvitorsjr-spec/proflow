import { syncAgendaOrderAction } from "@/app/dashboard/agenda/agenda-sync-actions"; import type { OrdemRecord } from "./ordens-types";
export interface OrdensAgendaPort { syncSchedule(order: OrdemRecord): Promise<{ synchronized: boolean; reason: string }> }
export class PendingAgendaIntegration implements OrdensAgendaPort { async syncSchedule(order: OrdemRecord) { await syncAgendaOrderAction(order.id); return { synchronized: true, reason: "Vínculo idempotente sincronizado; dados operacionais permanecem na OS." }; } }
