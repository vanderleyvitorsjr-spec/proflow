import { getClientAction } from "@/app/dashboard/clientes/actions";
import { getCrmLeadAction } from "@/features/crm/crm-actions";
import type { ServiceOrderStatus } from "./ordens-data";
import type { OrdensAgendaPort } from "./ordens-agenda-port";
import { OrdensRepository } from "./ordens-repository";
import { ordemSchema, type OrdemFormValues } from "./ordens-schema";
import type {
  OrdemChecklistItem,
  OrdemHistory,
  OrdemRecord,
  OrdemWorkNote,
  OrdemMedia,
  OrdemTechnicalReport,
} from "./ordens-types";
import type { ApplyServiceOrderPricingInput } from "@/lib/contracts/ordens.contract";
import { normalizeProperName } from "@/lib/br-formatters";
const history = (type: OrdemHistory["type"], description: string): OrdemHistory => ({
  id: crypto.randomUUID(),
  type,
  description,
  createdAt: new Date().toISOString(),
});
const lines = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
export class OrdensService {
  constructor(
    private readonly repository: OrdensRepository,
    private readonly agenda: OrdensAgendaPort,
  ) {}
  list() {
    return this.repository.list();
  }
  get(id: string) {
    return this.repository.findById(id);
  }
  async validateRelations(clientId: string, leadId?: string) {
    const client = await getClientAction(clientId);
    if (!client) throw new Error("Selecione um cliente válido.");
    if (leadId) {
      const lead = await getCrmLeadAction(leadId);
      if (!lead || lead.convertedClientId !== clientId)
        throw new Error(
          "O lead informado não está convertido para o cliente selecionado.",
        );
    }
    return client;
  }
  async create(input: OrdemFormValues) {
    const value = ordemSchema.parse(input),
      client = await this.validateRelations(value.clientId, value.crmLeadId);
    const now = new Date().toISOString();
    const record: OrdemRecord = {
      id: crypto.randomUUID(),
      orderNumber: await this.repository.nextNumber(),
      clientId: client.id,
      clientName: client.name,
      crmLeadId: value.crmLeadId || undefined,
      title: value.title.trim(),
      description: value.description.trim(),
      category: value.category,
      priority: value.priority,
      status: value.status,
      technician: normalizeProperName(value.technician),
      teamMembers: [normalizeProperName(value.technician)],
      address: value.address.trim(),
      city: normalizeProperName(value.city),
      state: value.state.toUpperCase(),
      scheduledDate: value.scheduledDate,
      scheduledTime: value.scheduledTime,
      estimatedDurationMinutes: value.estimatedDurationMinutes,
      estimatedValue: value.estimatedValue,
      notes: value.notes,
      checklist: lines(value.checklistText).map((title) => ({
        id: crypto.randomUUID(),
        title,
        responsible: value.technician,
      })),
      equipment: lines(value.equipmentText),
      reservedMaterials: lines(value.materialsText),
      createdAt: now,
      updatedAt: now,
      history: [
        history(
          "CREATED",
          value.crmLeadId ? "Ordem criada com origem comercial no CRM." : "Ordem criada.",
        ),
      ],
    };
    await this.repository.save(record);
    await this.agenda.syncSchedule(record);
    return record;
  }
  async update(id: string, input: OrdemFormValues) {
    const current = await this.require(id),
      value = ordemSchema.parse(input),
      client = await this.validateRelations(value.clientId, value.crmLeadId);
    const events = [
      ...current.history,
      history("UPDATED", "Dados operacionais atualizados."),
    ];
    if (current.status !== value.status)
      events.push(
        history("STATUS", `Status alterado de ${current.status} para ${value.status}.`),
      );
    if (current.priority !== value.priority)
      events.push(history("PRIORITY", "Prioridade atualizada."));
    if (current.technician !== value.technician)
      events.push(history("TECHNICIAN", "Responsável técnico atualizado."));
    if (
      current.scheduledDate !== value.scheduledDate ||
      current.scheduledTime !== value.scheduledTime
    )
      events.push(history("SCHEDULE", "Agenda da OS atualizada."));
    if (current.estimatedValue !== value.estimatedValue)
      events.push(history("VALUE", "Valor previsto atualizado."));
    const record: OrdemRecord = {
      ...current,
      ...value,
      title: value.title.trim(),
      description: value.description.trim(),
      technician: normalizeProperName(value.technician),
      teamMembers: current.teamMembers?.length
        ? current.teamMembers
        : [normalizeProperName(value.technician)],
      city: normalizeProperName(value.city),
      state: value.state.toUpperCase(),
      clientName: client.name,
      crmLeadId: value.crmLeadId || undefined,
      checklist: current.checklist,
      equipment: lines(value.equipmentText),
      reservedMaterials: lines(value.materialsText),
      updatedAt: new Date().toISOString(),
      history: events,
    };
    await this.repository.save(record);
    await this.agenda.syncSchedule(record);
    return record;
  }
  async changeStatus(id: string, status: ServiceOrderStatus) {
    const current = await this.require(id);
    return this.repository.save({
      ...current,
      status,
      updatedAt: new Date().toISOString(),
      history: [...current.history, history("STATUS", `Status alterado para ${status}.`)],
    });
  }
  async updateChecklist(id: string, checklist: OrdemChecklistItem[]) {
    const current = await this.require(id);
    return this.repository.save({
      ...current,
      checklist,
      updatedAt: new Date().toISOString(),
      history: [...current.history, history("CHECKLIST", "Checklist atualizado.")],
    });
  }
  async cancel(id: string, reason: string) {
    if (reason.trim().length < 3) throw new Error("Informe o motivo do cancelamento.");
    const current = await this.require(id),
      now = new Date().toISOString();
    return this.repository.save({
      ...current,
      status: "CANCELED",
      canceledAt: now,
      cancellationReason: reason.trim(),
      updatedAt: now,
      history: [
        ...current.history,
        history("CANCELED", `Ordem cancelada: ${reason.trim()}`),
      ],
    });
  }
  async archive(id: string) {
    const current = await this.require(id),
      now = new Date().toISOString();
    return this.repository.save({
      ...current,
      archivedAt: now,
      updatedAt: now,
      history: [...current.history, history("ARCHIVED", "Ordem arquivada.")],
    });
  }

  async startExecution(id: string) {
    const current = await this.require(id);
    const execution = current.execution ?? {
      status: "NOT_STARTED" as const,
      accumulatedMinutes: 0,
      sessions: [],
      workNotes: [],
    };
    if (execution.status === "IN_PROGRESS") return current;
    if (execution.status === "COMPLETED") throw new Error("A execução já foi concluída.");
    const now = new Date().toISOString();
    const next = {
      ...execution,
      status: "IN_PROGRESS" as const,
      startedAt: execution.startedAt ?? now,
      sessions: [
        ...execution.sessions,
        { id: crypto.randomUUID(), startedAt: now, technician: current.technician },
      ],
    };
    return this.repository.save({
      ...current,
      status:
        current.status === "OPEN" || current.status === "SCHEDULED"
          ? "IN_PROGRESS"
          : current.status,
      execution: next,
      updatedAt: now,
      history: [...current.history, history("EXECUTION", "Execução iniciada.")],
    });
  }
  async pauseExecution(id: string) {
    const current = await this.require(id);
    const execution = current.execution;
    if (!execution || execution.status !== "IN_PROGRESS")
      throw new Error("A execução não está em andamento.");
    const now = new Date(),
      sessions = [...execution.sessions],
      active = sessions.at(-1);
    if (active && !active.endedAt) {
      const minutes = Math.max(
        1,
        Math.round((now.getTime() - new Date(active.startedAt).getTime()) / 60000),
      );
      sessions[sessions.length - 1] = {
        ...active,
        endedAt: now.toISOString(),
        durationMinutes: minutes,
      };
    }
    const accumulatedMinutes = sessions.reduce(
      (total, session) => total + (session.durationMinutes ?? 0),
      0,
    );
    return this.repository.save({
      ...current,
      execution: { ...execution, status: "PAUSED", accumulatedMinutes, sessions },
      updatedAt: now.toISOString(),
      history: [...current.history, history("EXECUTION", "Execução pausada.")],
    });
  }
  async resumeExecution(id: string) {
    return this.startExecution(id);
  }
  async completeExecution(id: string) {
    let current = await this.require(id);
    if (current.execution?.status === "IN_PROGRESS")
      current = await this.pauseExecution(id);
    const now = new Date().toISOString(),
      execution = current.execution ?? {
        status: "NOT_STARTED" as const,
        accumulatedMinutes: 0,
        sessions: [],
        workNotes: [],
      };
    return this.repository.save({
      ...current,
      status: "COMPLETED",
      execution: { ...execution, status: "COMPLETED", completedAt: now },
      updatedAt: now,
      history: [
        ...current.history,
        history("EXECUTION", "Execução concluída."),
        history("STATUS", "Status alterado para COMPLETED."),
      ],
    });
  }
  async addWorkNote(id: string, visibility: OrdemWorkNote["visibility"], text: string) {
    if (text.trim().length < 3) throw new Error("Informe uma observação válida.");
    const current = await this.require(id),
      execution = current.execution ?? {
        status: "NOT_STARTED" as const,
        accumulatedMinutes: 0,
        sessions: [],
        workNotes: [],
      },
      now = new Date().toISOString();
    const note: OrdemWorkNote = {
      id: crypto.randomUUID(),
      visibility,
      text: text.trim(),
      createdAt: now,
    };
    return this.repository.save({
      ...current,
      execution: { ...execution, workNotes: [...execution.workNotes, note] },
      updatedAt: now,
      history: [
        ...current.history,
        history(
          "NOTE",
          visibility === "INTERNAL"
            ? "Nota interna adicionada."
            : "Orientação para o cliente adicionada.",
        ),
      ],
    });
  }
  async addMedia(id: string, media: OrdemMedia) {
    const current = await this.require(id);
    const now = new Date().toISOString();
    const type = media.kind.includes("SIGNATURE") ? "SIGNATURE" : "MEDIA";
    return this.repository.save({
      ...current,
      media: [...(current.media ?? []), media],
      updatedAt: now,
      history: [...current.history, history(type, `${media.kind.includes("SIGNATURE") ? "Assinatura" : "Arquivo"} adicionado: ${media.fileName}.`)],
    });
  }
  async removeMedia(id: string, mediaId: string) {
    const current = await this.require(id);
    const media = (current.media ?? []).find((item) => item.id === mediaId);
    if (!media) throw new Error("Arquivo não encontrado.");
    const now = new Date().toISOString();
    return this.repository.save({
      ...current,
      media: (current.media ?? []).filter((item) => item.id !== mediaId),
      updatedAt: now,
      history: [...current.history, history(media.kind.includes("SIGNATURE") ? "SIGNATURE" : "MEDIA", `Arquivo removido: ${media.fileName}.`)],
    });
  }
  async updateTechnicalReport(id: string, report: OrdemTechnicalReport) {
    const current = await this.require(id);
    const now = new Date().toISOString();
    return this.repository.save({
      ...current,
      technicalReport: {
        diagnosis: report.diagnosis.trim(),
        servicePerformed: report.servicePerformed.trim(),
        recommendations: report.recommendations.trim(),
        clientAcknowledgement: report.clientAcknowledgement?.trim() ?? "",
        updatedAt: now,
      },
      updatedAt: now,
      history: [...current.history, history("REPORT", "Relatório técnico atualizado.")],
    });
  }
  async updateTeam(id: string, members: string[]) {
    const current = await this.require(id),
      normalized = Array.from(
        new Set(members.map((item) => item.trim()).filter(Boolean)),
      );
    if (!normalized.length) throw new Error("Informe ao menos um integrante da equipe.");
    const now = new Date().toISOString();
    return this.repository.save({
      ...current,
      teamMembers: normalized,
      technician: normalized[0],
      updatedAt: now,
      history: [
        ...current.history,
        history("TEAM", `Equipe atualizada: ${normalized.join(", ")}.`),
      ],
    });
  }
  async applyPricing(input: ApplyServiceOrderPricingInput) {
    const current = await this.require(input.serviceOrderId);
    if (current.archivedAt || current.canceledAt || current.status === "CANCELED")
      throw new Error("A Ordem de Serviço não está elegível para precificação.");
    const now = new Date().toISOString();
    return this.repository.save({
      ...current,
      estimatedValue: input.priceCents / 100,
      appliedPricing: {
        simulationId: input.simulationId,
        simulationVersion: input.simulationVersion,
        revisionId: input.revisionId,
        priceCents: input.priceCents,
        priceType: input.priceType,
        appliedAt: input.appliedAt,
        pricingUpdatedAtSnapshot: input.pricingUpdatedAtSnapshot,
      },
      updatedAt: now,
      history: [
        ...current.history,
        history(
          "PRICING",
          `Precificação v${input.simulationVersion} aplicada explicitamente.`,
        ),
      ],
    });
  }
  private async require(id: string) {
    const order = await this.repository.findById(id);
    if (!order) throw new Error("Ordem de Serviço não encontrada.");
    return order;
  }
}
