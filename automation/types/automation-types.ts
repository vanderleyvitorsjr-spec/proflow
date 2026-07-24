export const AUTOMATION_TRIGGER = {
  CLIENT_CREATED: "CLIENT_CREATED",
  LEAD_CREATED: "LEAD_CREATED",
  LEAD_UPDATED: "LEAD_UPDATED",
  SERVICE_ORDER_CREATED: "SERVICE_ORDER_CREATED",
  SERVICE_ORDER_COMPLETED: "SERVICE_ORDER_COMPLETED",
  PAYMENT_REGISTERED: "PAYMENT_REGISTERED",
  PAYMENT_OVERDUE: "PAYMENT_OVERDUE",
  EQUIPMENT_CREATED: "EQUIPMENT_CREATED",
  WARRANTY_EXPIRED: "WARRANTY_EXPIRED",
  STOCK_BELOW_MINIMUM: "STOCK_BELOW_MINIMUM",
  AGENDA_CREATED: "AGENDA_CREATED",
  AGENDA_COMPLETED: "AGENDA_COMPLETED",
} as const;

export type AutomationTriggerType =
  (typeof AUTOMATION_TRIGGER)[keyof typeof AUTOMATION_TRIGGER];

export const AUTOMATION_CONDITION = {
  ALWAYS: "ALWAYS",
  PREMIUM_CLIENT: "PREMIUM_CLIENT",
  VALUE_ABOVE: "VALUE_ABOVE",
  DAYS_WITHOUT_ACTIVITY: "DAYS_WITHOUT_ACTIVITY",
  CATEGORY: "CATEGORY",
  SERVICE_TYPE: "SERVICE_TYPE",
  RESPONSIBLE: "RESPONSIBLE",
  STATUS: "STATUS",
} as const;

export type AutomationConditionType =
  (typeof AUTOMATION_CONDITION)[keyof typeof AUTOMATION_CONDITION];

export const AUTOMATION_ACTION = {
  CREATE_TASK: "CREATE_TASK",
  CREATE_APPOINTMENT: "CREATE_APPOINTMENT",
  CREATE_FINANCIAL_ENTRY: "CREATE_FINANCIAL_ENTRY",
  UPDATE_STATUS: "UPDATE_STATUS",
  SEND_INTERNAL_NOTIFICATION: "SEND_INTERNAL_NOTIFICATION",
  CREATE_SUGGESTION: "CREATE_SUGGESTION",
  ADD_INSIGHT: "ADD_INSIGHT",
  REGISTER_LOG: "REGISTER_LOG",
} as const;

export type AutomationActionType =
  (typeof AUTOMATION_ACTION)[keyof typeof AUTOMATION_ACTION];

export type AutomationExecutionMode = "simulation" | "execution";
export type AutomationEventMetadata = Readonly<
  Record<string, string | number | boolean>
>;

export type AutomationTriggerPayloadMap = {
  CLIENT_CREATED: { clientId: string; name: string };
  LEAD_CREATED: { leadId: string; clientId?: string; status: string; createdAt: string };
  LEAD_UPDATED: { leadId: string; clientId?: string; status: string; updatedAt: string };
  SERVICE_ORDER_CREATED: {
    serviceOrderId: string;
    clientId: string;
    totalAmountCents?: number;
    createdAt: string;
  };
  SERVICE_ORDER_COMPLETED: {
    serviceOrderId: string;
    clientId: string;
    orderNumber: string;
    clientName: string;
    totalAmountCents: number;
    completedAt: string;
  };
  PAYMENT_REGISTERED: {
    financialEntryId: string;
    serviceOrderId?: string;
    amountCents: number;
    paidAt: string;
  };
  PAYMENT_OVERDUE: {
    financialEntryId: string;
    amountCents: number;
    dueDate: string;
  };
  EQUIPMENT_CREATED: { equipmentId: string; clientId?: string; createdAt: string };
  WARRANTY_EXPIRED: {
    equipmentId: string;
    clientId?: string;
    warrantyEndDate: string;
  };
  STOCK_BELOW_MINIMUM: {
    stockItemId: string;
    currentQuantity: number;
    minimumQuantity: number;
  };
  AGENDA_CREATED: {
    eventId: string;
    clientId?: string;
    serviceOrderId?: string;
    startAt: string;
  };
  AGENDA_COMPLETED: {
    eventId: string;
    clientId?: string;
    serviceOrderId?: string;
    completedAt: string;
  };
};

export type AutomationTriggerEvent<
  TType extends AutomationTriggerType = AutomationTriggerType,
> = TType extends AutomationTriggerType
  ? {
      id: string;
      type: TType;
      occurredAt: string;
      source: string;
      mode: AutomationExecutionMode;
      payload: Readonly<AutomationTriggerPayloadMap[TType]>;
      metadata?: AutomationEventMetadata;
    }
  : never;

export type AutomationConditionParameters = {
  ALWAYS: Record<string, never>;
  PREMIUM_CLIENT: Record<string, never>;
  VALUE_ABOVE: { amountCents: number };
  DAYS_WITHOUT_ACTIVITY: { days: number };
  CATEGORY: { category: string };
  SERVICE_TYPE: { serviceType: string };
  RESPONSIBLE: { responsibleId: string };
  STATUS: { status: string };
};

export type AutomationConditionConfiguration = {
  [TType in AutomationConditionType]: {
    type: TType;
    parameters: AutomationConditionParameters[TType];
  };
}[AutomationConditionType];

export type AutomationActionParameters = {
  CREATE_TASK: { title: string; description?: string };
  CREATE_APPOINTMENT: { title: string; scheduledAt?: string };
  CREATE_FINANCIAL_ENTRY: { title: string; amountCents?: number };
  UPDATE_STATUS: { status: string };
  SEND_INTERNAL_NOTIFICATION: { title: string; message: string };
  CREATE_SUGGESTION: { title: string; description: string };
  ADD_INSIGHT: {
    title: string;
    description: string;
    priority: "CRITICAL" | "WARNING" | "INFO";
  };
  REGISTER_LOG: { message: string };
};

export type AutomationActionConfiguration = {
  [TType in AutomationActionType]: {
    type: TType;
    parameters: AutomationActionParameters[TType];
  };
}[AutomationActionType];

export type AutomationWorkflow = {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: { type: AutomationTriggerType };
  conditions: AutomationConditionConfiguration[];
  actions: AutomationActionConfiguration[];
};

export type AutomationDefinition<TType extends string> = {
  type: TType;
  label: string;
  description: string;
  parameterKeys: readonly string[];
};

export type AutomationValidationIssue = {
  path: string;
  message: string;
};

export type AutomationDryRunRecord = {
  id: string;
  workflowId: string;
  workflowName: string;
  triggerType: AutomationTriggerType;
  eventId: string;
  receivedAt: string;
  status: "REGISTERED" | "REJECTED";
  conditionCount: number;
  actionCount: number;
  issues: AutomationValidationIssue[];
};

export type AutomationDryRunResult =
  | { ok: true; record: AutomationDryRunRecord }
  | {
      ok: false;
      record: AutomationDryRunRecord;
      issues: AutomationValidationIssue[];
    };

export type AutomationPlannedAction = {
  workflowId: string;
  workflowName: string;
  type: AutomationActionType;
  parameters: Readonly<Record<string, unknown>>;
};

export type AutomationSimulationRejection = {
  workflowId: string;
  workflowName: string;
  reasons: AutomationValidationIssue[];
};

export type AutomationSimulationReport = {
  id: string;
  event: AutomationTriggerEvent;
  simulatedAt: string;
  evaluatedWorkflows: number;
  acceptedWorkflows: string[];
  rejectedWorkflows: AutomationSimulationRejection[];
  plannedActions: AutomationPlannedAction[];
};

export type AutomationPublishIssue = {
  path: string;
  message: string;
};

export type AutomationPublishResult =
  | {
      ok: true;
      deliveredListeners: number;
      simulation?: AutomationSimulationReport;
      listenerErrors?: string[];
    }
  | { ok: false; issues: AutomationPublishIssue[]; deliveredListeners: 0 };

export interface AutomationClock {
  now(): Date;
}

export interface AutomationIdGenerator {
  next(): string;
}
