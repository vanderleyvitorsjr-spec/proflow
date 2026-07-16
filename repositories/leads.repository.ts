import type { CreateLeadInput, Lead } from "@/types/lead";

export class LeadsRepository {
  async create(companyId: string, data: CreateLeadInput): Promise<Lead> {
    return {
      id: crypto.randomUUID(),
      companyId,
      ...data,
      status: "NEW",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
  }
}

export const leadsRepository = new LeadsRepository();
