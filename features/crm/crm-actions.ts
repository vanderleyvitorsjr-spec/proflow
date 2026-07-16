import type { ClientFormValues } from "@/app/dashboard/clientes/cliente-schema";
import { CrmRepository } from "./crm-repository";
import type { CrmLeadFormValues } from "./crm-schema";
import { CrmService } from "./crm-service";
import { crmStorageAdapter } from "./crm-storage-adapter";
import type { CrmStageId } from "./crm-types";
import type { CrmPricingReference } from "@/lib/contracts/crm.contract";

const service = new CrmService(new CrmRepository(crmStorageAdapter));
export const listCrmLeadsAction = () => service.listLeads();
export const getCrmLeadAction = (id: string) => service.getLead(id);
export const createCrmLeadAction = (input: CrmLeadFormValues) => service.createLead(input);
export const updateCrmLeadAction = (id: string, input: CrmLeadFormValues) => service.updateLead(id, input);
export const moveCrmLeadAction = (id: string, stage: CrmStageId) => service.moveLead(id, stage);
export const archiveCrmLeadAction = (id: string) => service.archiveLead(id);
export const convertCrmLeadAction = (id: string, input: ClientFormValues) => service.convertLead(id, input);
const pricingReference = (lead: Awaited<ReturnType<typeof service.getLead>>): CrmPricingReference | null => lead ? ({ id: lead.id, title: lead.serviceInterest || lead.name, customerName: lead.name, stage: lead.stageId, converted: Boolean(lead.convertedAt), clientId: lead.convertedClientId, archived: Boolean(lead.archivedAt), updatedAt: lead.updatedAt }) : null;
export const listActiveCrmPricingReferencesAction = async () => (await service.listLeads()).filter((lead) => !lead.archivedAt).map((lead) => pricingReference(lead) as CrmPricingReference);
export const getCrmPricingReferenceAction = async (id: string) => pricingReference(await service.getLead(id));
