import {
  clientArchivedPublicAction,
  clientExistsPublicAction,
  getClientPublicReferenceAction,
  listActiveClientPublicReferencesAction,
} from "@/app/dashboard/clientes/actions";
import {
  getServiceOrderTechnicalReferenceAction,
  listServiceOrderTechnicalReferencesAction,
} from "@/app/dashboard/ordens/ordens-actions";

export type EquipmentClientReference = { id: string; name: string; archived: boolean };
export type EquipmentServiceOrderReference = {
  id: string;
  number: string;
  title: string;
  clientId?: string;
  canceled: boolean;
  archived: boolean;
};

export const equipmentRelationsGateway = {
  async listActiveClients(): Promise<EquipmentClientReference[]> {
    return (await listActiveClientPublicReferencesAction()).map(({ id, name, archived }) => ({
      id,
      name,
      archived,
    }));
  },
  async getClient(id: string): Promise<EquipmentClientReference | null> {
    if (!(await clientExistsPublicAction(id))) return null;
    const reference = await getClientPublicReferenceAction(id);
    return reference
      ? { id: reference.id, name: reference.name, archived: await clientArchivedPublicAction(id) }
      : null;
  },
  async listEligibleServiceOrders(): Promise<EquipmentServiceOrderReference[]> {
    return (await listServiceOrderTechnicalReferencesAction()).filter(
      (order) => !order.archived && !order.canceled,
    );
  },
  async getServiceOrder(id: string): Promise<EquipmentServiceOrderReference | null> {
    return getServiceOrderTechnicalReferenceAction(id);
  },
};
