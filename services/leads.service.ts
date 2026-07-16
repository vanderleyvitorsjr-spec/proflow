import { leadsRepository } from "@/repositories/leads.repository";
import type { CreateLeadInput, Lead } from "@/types/lead";

const DEFAULT_COMPANY_ID = "demo-company";

export class LeadsService {
  async createLead(data: CreateLeadInput): Promise<Lead> {
    return leadsRepository.create(DEFAULT_COMPANY_ID, data);
  }
}

export const leadsService = new LeadsService();
