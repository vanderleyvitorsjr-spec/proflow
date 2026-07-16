import type { ClientFormValues } from "@/app/dashboard/clientes/cliente-schema";
import { CrmRepository } from "./crm-repository";
import type { CrmLeadFormValues } from "./crm-schema";
import { CrmService } from "./crm-service";
import { crmStorageAdapter } from "./crm-storage-adapter";
import type { CrmStageId } from "./crm-types";

const service = new CrmService(new CrmRepository(crmStorageAdapter));
export const listCrmLeadsAction = () => service.listLeads();
export const getCrmLeadAction = (id: string) => service.getLead(id);
export const createCrmLeadAction = (input: CrmLeadFormValues) => service.createLead(input);
export const updateCrmLeadAction = (id: string, input: CrmLeadFormValues) => service.updateLead(id, input);
export const moveCrmLeadAction = (id: string, stage: CrmStageId) => service.moveLead(id, stage);
export const archiveCrmLeadAction = (id: string) => service.archiveLead(id);
export const convertCrmLeadAction = (id: string, input: ClientFormValues) => service.convertLead(id, input);
