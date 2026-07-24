import type {
  ServiceOrderCategory,
  ServiceOrderPriority,
  ServiceOrderStatus,
} from "./ordens-data";
import type { ServiceOrderAppliedPricing } from "@/lib/contracts/ordens.contract";

export type OrdemChecklistItem = {
  id: string;
  serviceOrderId: string;
  title: string;
  description?: string;
  category:
    | "PRE_SERVICE"
    | "MATERIALS"
    | "INSTALLATION"
    | "ELECTRICAL"
    | "TESTS"
    | "DOCUMENTATION"
    | "DELIVERY"
    | "POST_SERVICE";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "SKIPPED";
  required: boolean;
  responsible: string;
  dueDate?: string;
  completedAt?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};
export type OrdemExecutionStatus = "NOT_STARTED" | "IN_PROGRESS" | "PAUSED" | "COMPLETED";
export type OrdemExecutionSession = {
  id: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes?: number;
  technician: string;
};
export type OrdemWorkNote = {
  id: string;
  visibility: "INTERNAL" | "CLIENT";
  text: string;
  createdAt: string;
};

export type OrdemMediaKind = "BEFORE" | "AFTER" | "GENERAL" | "CLIENT_SIGNATURE" | "TECHNICIAN_SIGNATURE";
export type OrdemMedia = {
  id: string;
  kind: OrdemMediaKind;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  createdBy?: string;
};
export type OrdemTechnicalReport = {
  diagnosis: string;
  servicePerformed: string;
  recommendations: string;
  clientAcknowledgement?: string;
  updatedAt?: string;
};

export type OrdemExecution = {
  status: OrdemExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  accumulatedMinutes: number;
  sessions: OrdemExecutionSession[];
  workNotes: OrdemWorkNote[];
};
export type OrdemHistory = {
  id: string;
  type:
    | "CREATED"
    | "UPDATED"
    | "STATUS"
    | "PRIORITY"
    | "TECHNICIAN"
    | "SCHEDULE"
    | "VALUE"
    | "CHECKLIST"
    | "CANCELED"
    | "ARCHIVED"
    | "PRICING"
    | "EXECUTION"
    | "TEAM"
    | "NOTE"
    | "MEDIA"
    | "REPORT"
    | "SIGNATURE";
  description: string;
  createdAt: string;
};
export type OrdemRecord = {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  crmLeadId?: string;
  title: string;
  description: string;
  category: ServiceOrderCategory;
  priority: ServiceOrderPriority;
  status: ServiceOrderStatus;
  technician: string;
  teamMembers?: string[];
  address: string;
  city: string;
  state: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedDurationMinutes: number;
  estimatedValue: number;
  notes: string;
  internalNotes?: string;
  clientNotes?: string;
  checklist: OrdemChecklistItem[];
  equipment: string[];
  reservedMaterials: string[];
  execution?: OrdemExecution;
  media?: OrdemMedia[];
  technicalReport?: OrdemTechnicalReport;
  createdAt: string;
  updatedAt: string;
  canceledAt?: string;
  cancellationReason?: string;
  archivedAt?: string;
  appliedPricing?: ServiceOrderAppliedPricing;
  history: OrdemHistory[];
};
