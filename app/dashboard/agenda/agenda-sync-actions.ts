import { AgendaRepository } from "./agenda-repository"; import { AgendaService } from "./agenda-service"; import { agendaStorageAdapter } from "./agenda-storage-adapter";
const syncService = new AgendaService(new AgendaRepository(agendaStorageAdapter));
export const syncAgendaOrderAction = (orderId: string) => syncService.syncOrder(orderId);
