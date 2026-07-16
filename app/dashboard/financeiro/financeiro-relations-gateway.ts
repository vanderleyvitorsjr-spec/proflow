import {
  getClientPublicReferenceAction,
  listActiveClientPublicReferencesAction,
} from "@/app/dashboard/clientes/actions";
import {
  getServiceOrderFinancialSnapshotAction,
  listServiceOrderFinancialSnapshotsAction,
} from "@/app/dashboard/ordens/ordens-actions";
import type { ClientPublicReference } from "@/lib/contracts/clientes.contract";
import type { ServiceOrderFinancialSnapshot } from "@/lib/contracts/ordens.contract";

export type FinancialRelationOrder = ServiceOrderFinancialSnapshot & {
  client: ClientPublicReference;
};
export class FinancialRelationsGateway {
  listClients() {
    return listActiveClientPublicReferencesAction();
  }
  async requireClient(id: string) {
    const client = await getClientPublicReferenceAction(id);
    if (!client) throw new Error("Cliente não encontrado.");
    if (client.archived)
      throw new Error("Cliente arquivado não pode receber novo vínculo financeiro.");
    return client;
  }
  async getOrder(id: string) {
    return getServiceOrderFinancialSnapshotAction(id);
  }
  async requireEligibleOrder(id: string): Promise<FinancialRelationOrder> {
    const order = await getServiceOrderFinancialSnapshotAction(id);
    if (!order) throw new Error("Ordem de Serviço não encontrada.");
    if (order.archived) throw new Error("A Ordem de Serviço está arquivada.");
    if (order.canceled) throw new Error("A Ordem de Serviço está cancelada.");
    if (order.estimatedValueCents <= 0)
      throw new Error("A Ordem de Serviço não possui valor previsto válido.");
    const client = await this.requireClient(order.clientId);
    return { ...order, client };
  }
  async listOrders(): Promise<FinancialRelationOrder[]> {
    const orders = await listServiceOrderFinancialSnapshotsAction();
    const result: FinancialRelationOrder[] = [];
    for (const order of orders) {
      if (order.archived || order.canceled || order.estimatedValueCents <= 0) continue;
      const client = await getClientPublicReferenceAction(order.clientId);
      if (client && !client.archived) result.push({ ...order, client });
    }
    return result;
  }
}
export const financialRelationsGateway = new FinancialRelationsGateway();
