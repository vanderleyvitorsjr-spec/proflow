import type { ServiceOrderCategory, ServiceOrderPriority, ServiceOrderStatus } from "./ordens-data";
import type { ServiceOrderAppliedPricing } from "@/lib/contracts/ordens.contract";
export type OrdemChecklistItem = { id: string; title: string; responsible: string; completedAt?: string };
export type OrdemHistory = { id: string; type: "CREATED" | "UPDATED" | "STATUS" | "PRIORITY" | "TECHNICIAN" | "SCHEDULE" | "VALUE" | "CHECKLIST" | "CANCELED" | "ARCHIVED" | "PRICING"; description: string; createdAt: string };
export type OrdemRecord = {
  id: string; orderNumber: string; clientId: string; clientName: string; crmLeadId?: string; title: string; description: string;
  category: ServiceOrderCategory; priority: ServiceOrderPriority; status: ServiceOrderStatus; technician: string;
  address: string; city: string; state: string; scheduledDate: string; scheduledTime: string; estimatedDurationMinutes: number;
  estimatedValue: number; notes: string; checklist: OrdemChecklistItem[]; equipment: string[]; reservedMaterials: string[];
  createdAt: string; updatedAt: string; canceledAt?: string; cancellationReason?: string; archivedAt?: string; appliedPricing?: ServiceOrderAppliedPricing; history: OrdemHistory[];
};
