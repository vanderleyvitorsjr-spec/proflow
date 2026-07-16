import {
  getServiceOrderStockReferenceAction,
  listServiceOrderStockReferencesAction,
} from "../ordens/ordens-actions";

export type StockOrderReference = {
  id: string;
  number: string;
  title: string;
  clientId: string;
  status: string;
  canceled: boolean;
  archived: boolean;
  updatedAt: string;
  reservationAllowed: boolean;
};
const adapt = (
  order: Awaited<ReturnType<typeof getServiceOrderStockReferenceAction>> extends infer T
    ? NonNullable<T>
    : never,
): StockOrderReference => ({
  ...order,
  reservationAllowed: order.stockReservationAllowed,
});
export const stockOrdersGateway = {
  async list() {
    return (await listServiceOrderStockReferencesAction()).map(adapt);
  },
  async get(id: string) {
    const order = await getServiceOrderStockReferenceAction(id);
    return order ? adapt(order) : null;
  },
  async requireEligible(id: string) {
    const order = await this.get(id);
    if (!order) throw new Error("Ordem de Serviço não encontrada.");
    if (order.canceled) throw new Error("A Ordem de Serviço está cancelada.");
    if (order.archived) throw new Error("A Ordem de Serviço está arquivada.");
    if (!order.reservationAllowed)
      throw new Error("A Ordem de Serviço não aceita novas reservas.");
    return order;
  },
};
