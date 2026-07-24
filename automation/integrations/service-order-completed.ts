import type { OrdemRecord } from "../../app/dashboard/ordens/ordens-types";
import { automationEventBus } from "../runtime/automation-runtime";
import {
  AUTOMATION_TRIGGER,
  type AutomationTriggerEvent,
} from "../types/automation-types";

export async function publishServiceOrderCompleted(
  order: OrdemRecord,
): Promise<void> {
  const completedAt = order.execution?.completedAt ?? order.updatedAt;
  const event: AutomationTriggerEvent<"SERVICE_ORDER_COMPLETED"> = {
    id: `service-order-completed:${order.id}:${completedAt}`,
    type: AUTOMATION_TRIGGER.SERVICE_ORDER_COMPLETED,
    occurredAt: completedAt,
    source: "service-orders",
    mode: "execution",
    payload: {
      serviceOrderId: order.id,
      clientId: order.clientId,
      orderNumber: order.orderNumber,
      clientName: order.clientName,
      totalAmountCents: Math.round(order.estimatedValue * 100),
      completedAt,
    },
  };
  const result = await automationEventBus.publish(event);
  if (!result.ok) {
    throw new Error(
      result.issues[0]?.message ??
        "Não foi possível processar a automação da Ordem concluída.",
    );
  }
}
