import {
  equipmentFormSchema,
  maintenanceFormSchema,
  warrantyFormSchema,
  type EquipmentFormValues,
  type MaintenanceFormValues,
  type EquipmentFinancialFormValues,
  type WarrantyFormValues,
} from "./equipamentos-schema";
import { EquipmentDomainError } from "./equipamentos-errors";
import { EquipmentRepository } from "./equipamentos-repository";
import { equipmentRelationsGateway } from "./equipamentos-relations-gateway";
import { equipmentFinanceiroGateway, type EquipmentFinanceiroTransaction } from "./equipamentos-financeiro-gateway";
import type {
  AssetHistory,
  AssetMedia,
  AssetStatus,
  EquipmentAsset,
  EquipmentServiceOrderLink,
  MaintenanceRecord,
  EquipmentFinancialSnapshot,
  EquipmentFinancialReconciliationStatus,
} from "./equipamentos-types";
const normalize = (v?: string) => v?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() ?? "";
const money = (v: string) => {
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0)
    throw new EquipmentDomainError("VALIDATION", "Informe um valor válido.");
  return Math.round(n * 100);
};
const hist = (type: AssetHistory["type"], message: string): AssetHistory => ({
  id: crypto.randomUUID(),
  type,
  message,
  origin: "MANUAL",
  createdAt: new Date().toISOString(),
});
const medias = (text: string, type: AssetMedia["type"], current: AssetMedia[]) =>
  text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map(
      (name) =>
        current.find((m) => m.name === name && m.type === type) ?? {
          id: crypto.randomUUID(),
          type,
          name,
          createdAt: new Date().toISOString(),
        },
    );
export class EquipmentService {
  constructor(private repo: EquipmentRepository) {}
  list() {
    return this.repo.read();
  }
  get(id: string) {
    return this.repo.find(id);
  }
  private async unique(v: EquipmentFormValues, ignore?: string) {
    const state = await this.repo.read(),
      fields: [[string, string]] | [string, string][] = [
        ["código interno", v.internalCode],
        ["número de série", v.serialNumber],
        ["patrimônio", v.patrimonyNumber],
      ];
    for (const [label, value] of fields) {
      if (!value) continue;
      const found = state.assets.find(
        (a) =>
          a.id !== ignore &&
          normalize(
            label === "código interno"
              ? a.internalCode
              : label === "número de série"
                ? a.serialNumber
                : a.patrimonyNumber,
          ) === normalize(value),
      );
      if (found)
        throw new EquipmentDomainError(
          "DUPLICATE",
          `Já existe ${found.archivedAt ? "um ativo arquivado" : "um ativo"} com o mesmo ${label}.`,
        );
    }
  }
  private build(v: EquipmentFormValues, current?: EquipmentAsset): EquipmentAsset {
    const now = new Date().toISOString(),
      acquisitionValueCents = money(v.acquisitionValue),
      residualValueCents = money(v.residualValue);
    if (residualValueCents > acquisitionValueCents)
      throw new EquipmentDomainError(
        "VALIDATION",
        "O valor residual não pode superar o valor de aquisição.",
      );
    const events = current
      ? [hist("UPDATED", "Dados do ativo atualizados.")]
      : [hist("CREATED", "Ativo cadastrado.")];
    if (current && current.status !== v.status)
      events.push(hist("STATUS", `Status alterado para ${v.status}.`));
    if (current && current.condition !== v.condition)
      events.push(hist("CONDITION", `Condição alterada para ${v.condition}.`));
    if (
      current &&
      JSON.stringify(current.location) !==
        JSON.stringify({
          name: v.locationName,
          room: v.locationRoom || undefined,
          container: v.locationContainer || undefined,
          description: v.locationDescription || undefined,
        })
    )
      events.push(hist("LOCATION", "Localização atualizada."));
    if (
      current &&
      (current.depreciation.mode !== v.depreciationMode ||
        current.depreciation.usefulLifeMonths !== v.usefulLifeMonths)
    )
      events.push(hist("DEPRECIATION", "Parâmetros de depreciação atualizados."));
    if (current?.acquisitionFinancial && current.acquisition.acquisitionValueCents !== acquisitionValueCents)
      events.push(hist("FINANCIAL_DIVERGENCE", "Valor técnico da aquisição alterado após vínculo financeiro."));
    if (v.ownership === "CUSTOMER" && !current?.clientId)
      throw new EquipmentDomainError(
        "VALIDATION",
        "Vincule um cliente pela ficha técnica antes de definir a propriedade como Cliente.",
      );
    return {
      id: current?.id ?? crypto.randomUUID(),
      sequence: current?.sequence ?? 0,
      internalCode: v.internalCode,
      name: v.name,
      description: v.description,
      assetType: v.assetType,
      category: v.category,
      manufacturer: v.manufacturer,
      model: v.model,
      serialNumber: v.serialNumber || undefined,
      patrimonyNumber: v.patrimonyNumber || undefined,
      ownership: v.ownership,
      clientId: v.ownership === "CUSTOMER" ? current?.clientId : undefined,
      clientNameSnapshot:
        v.ownership === "CUSTOMER" ? current?.clientNameSnapshot : undefined,
      responsible: v.responsible,
      location: {
        id: current?.location.id,
        name: v.locationName,
        room: v.locationRoom || undefined,
        container: v.locationContainer || undefined,
        description: v.locationDescription || undefined,
      },
      acquisition: {
        acquisitionDate: v.acquisitionDate || undefined,
        acquisitionValueCents,
        supplier: v.supplier,
        invoiceNumber: v.invoiceNumber,
        purchaseReference: v.purchaseReference,
        notes: v.acquisitionNotes,
      },
      depreciation: {
        mode: v.depreciationMode,
        startDate:
          v.depreciationMode === "LINEAR"
            ? v.depreciationStartDate || undefined
            : undefined,
        usefulLifeMonths:
          v.depreciationMode === "LINEAR" ? v.usefulLifeMonths : undefined,
        residualValueCents,
      },
      warranty: current?.warranty,
      acquisitionFinancial: current?.acquisitionFinancial,
      status: v.status,
      condition: v.condition,
      photos: medias(v.photoMetadata, "PHOTO", current?.photos ?? []),
      documents: medias(v.documentMetadata, "DOCUMENT", current?.documents ?? []),
      notes: v.notes,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
      archivedAt: current?.archivedAt,
      archiveReason: current?.archiveReason,
      history: [...(current?.history ?? []), ...events],
    };
  }
  async create(input: EquipmentFormValues) {
    const v = equipmentFormSchema.parse(input);
    await this.unique(v);
    const state = await this.repo.read(),
      asset = { ...this.build(v), sequence: state.nextSequence };
    await this.repo.saveAsset(asset, true);
    return asset;
  }
  async update(id: string, input: EquipmentFormValues) {
    const current = await this.repo.find(id);
    if (!current) throw new EquipmentDomainError("NOT_FOUND", "Ativo não encontrado.");
    if (current.archivedAt)
      throw new EquipmentDomainError("CONFLICT", "Ativo arquivado não pode ser editado.");
    const v = equipmentFormSchema.parse(input);
    await this.unique(v, id);
    const asset = this.build(v, current);
    await this.repo.saveAsset(asset);
    return asset;
  }
  async archive(id: string, reason: string) {
    const current = await this.repo.find(id);
    if (!current) throw new EquipmentDomainError("NOT_FOUND", "Ativo não encontrado.");
    if (current.archivedAt)
      throw new EquipmentDomainError("CONFLICT", "Ativo já arquivado.");
    const now = new Date().toISOString(),
      asset = {
        ...current,
        archivedAt: now,
        archiveReason: reason.trim() || undefined,
        updatedAt: now,
        history: [
          ...current.history,
          hist(
            "ARCHIVED",
            `Ativo arquivado${reason.trim() ? `: ${reason.trim()}` : "."}`,
          ),
        ],
      };
    await this.repo.saveAsset(asset);
    return asset;
  }

  private async requireActive(id: string) {
    const asset = await this.repo.find(id);
    if (!asset) throw new EquipmentDomainError("NOT_FOUND", "Ativo não encontrado.");
    if (asset.archivedAt)
      throw new EquipmentDomainError("CONFLICT", "Ativo arquivado não pode ser alterado.");
    return asset;
  }

  async linkClient(assetId: string, clientId: string) {
    const asset = await this.requireActive(assetId);
    const client = await equipmentRelationsGateway.getClient(clientId);
    if (!client) throw new EquipmentDomainError("NOT_FOUND", "Cliente não encontrado.");
    if (client.archived)
      throw new EquipmentDomainError("CONFLICT", "Cliente arquivado não pode receber novo vínculo.");
    const now = new Date().toISOString();
    const updated: EquipmentAsset = {
      ...asset,
      ownership: "CUSTOMER",
      clientId: client.id,
      clientNameSnapshot: client.name,
      updatedAt: now,
      history: [
        ...asset.history,
        hist(
          "CLIENT_LINKED",
          `${asset.clientId ? "Cliente alterado para" : "Cliente vinculado:"} ${client.name}.`,
        ),
      ],
    };
    await this.repo.saveAsset(updated);
    return updated;
  }

  async unlinkClient(assetId: string) {
    const asset = await this.requireActive(assetId);
    if (!asset.clientId) throw new EquipmentDomainError("CONFLICT", "Não há cliente vinculado.");
    const now = new Date().toISOString();
    const updated: EquipmentAsset = {
      ...asset,
      ownership: "COMPANY",
      clientId: undefined,
      clientNameSnapshot: undefined,
      updatedAt: now,
      history: [
        ...asset.history,
        hist("CLIENT_UNLINKED", `Cliente desvinculado: ${asset.clientNameSnapshot ?? asset.clientId}.`),
      ],
    };
    await this.repo.saveAsset(updated);
    return updated;
  }

  async linkServiceOrder(assetId: string, serviceOrderId: string, purpose?: string) {
    await this.requireActive(assetId);
    const order = await equipmentRelationsGateway.getServiceOrder(serviceOrderId);
    if (!order) throw new EquipmentDomainError("NOT_FOUND", "Ordem de Serviço não encontrada.");
    if (order.archived || order.canceled)
      throw new EquipmentDomainError("CONFLICT", "A Ordem arquivada ou cancelada não pode ser vinculada.");
    const state = await this.repo.read();
    if (state.serviceOrderLinks.some((link) => link.assetId === assetId && link.serviceOrderId === serviceOrderId && !link.unlinkedAt))
      throw new EquipmentDomainError("DUPLICATE", "Esta Ordem já está vinculada ao equipamento.");
    const now = new Date().toISOString();
    const link: EquipmentServiceOrderLink = {
      id: crypto.randomUUID(), assetId, serviceOrderId,
      serviceOrderNumberSnapshot: order.number,
      serviceOrderTitleSnapshot: order.title,
      clientIdSnapshot: order.clientId,
      purpose: purpose?.trim() || undefined,
      linkedAt: now, createdAt: now, updatedAt: now,
    };
    await this.repo.saveServiceOrderLink(link);
    await this.appendAssetHistory(assetId, hist("SERVICE_ORDER_LINKED", `OS ${order.number} vinculada.`));
    return link;
  }

  async unlinkServiceOrder(assetId: string, linkId: string) {
    await this.requireActive(assetId);
    const state = await this.repo.read();
    const link = state.serviceOrderLinks.find((item) => item.id === linkId && item.assetId === assetId);
    if (!link || link.unlinkedAt) throw new EquipmentDomainError("NOT_FOUND", "Vínculo ativo não encontrado.");
    const now = new Date().toISOString();
    const updated = { ...link, unlinkedAt: now, updatedAt: now };
    await this.repo.saveServiceOrderLink(updated);
    await this.appendAssetHistory(assetId, hist("SERVICE_ORDER_UNLINKED", `OS ${link.serviceOrderNumberSnapshot} desvinculada.`));
    return updated;
  }

  async createMaintenance(assetId: string, input: MaintenanceFormValues) {
    await this.requireActive(assetId);
    const value = maintenanceFormSchema.parse(input);
    let orderNumber: string | undefined;
    if (value.serviceOrderId) {
      const order = await equipmentRelationsGateway.getServiceOrder(value.serviceOrderId);
      if (!order || order.archived || order.canceled)
        throw new EquipmentDomainError("CONFLICT", "Selecione uma Ordem de Serviço ativa.");
      orderNumber = order.number;
    }
    const now = new Date().toISOString();
    const record: MaintenanceRecord = {
      id: crypto.randomUUID(), assetId, type: value.type, status: "SCHEDULED",
      title: value.title, description: value.description, supplier: value.supplier,
      costCents: money(value.cost), scheduledAt: new Date(`${value.scheduledAt}T12:00:00`).toISOString(),
      nextMaintenanceAt: value.nextMaintenanceAt ? new Date(`${value.nextMaintenanceAt}T12:00:00`).toISOString() : undefined,
      serviceOrderId: value.serviceOrderId || undefined,
      serviceOrderNumberSnapshot: orderNumber, responsible: value.responsible,
      notes: value.notes, createdAt: now, updatedAt: now,
      history: [{ id: crypto.randomUUID(), message: "Manutenção registrada.", origin: "MANUAL", createdAt: now }],
    };
    await this.repo.saveMaintenance(record);
    await this.appendAssetHistory(assetId, hist("MAINTENANCE_CREATED", `Manutenção registrada: ${record.title}.`));
    return record;
  }

  async updateMaintenance(id: string, input: MaintenanceFormValues) {
    const state = await this.repo.read();
    const current = state.maintenanceRecords.find((item) => item.id === id);
    if (!current) throw new EquipmentDomainError("NOT_FOUND", "Manutenção não encontrada.");
    if (current.status === "CANCELED")
      throw new EquipmentDomainError("CONFLICT", "A manutenção cancelada não pode ser editada.");
    const value = maintenanceFormSchema.parse(input);
    const nextCost = money(value.cost), now = new Date().toISOString();
    if (current.status === "COMPLETED") {
      const updated = {
        ...current,
        costCents: nextCost,
        updatedAt: now,
        history: [...current.history, { id: crypto.randomUUID(), message: "Custo ajustado após a conclusão.", origin: "MANUAL" as const, createdAt: now }],
      };
      await this.repo.saveMaintenance(updated);
      if (current.costCents !== nextCost)
        await this.appendAssetHistory(current.assetId, hist("MAINTENANCE_COST", `Custo da manutenção alterado para ${nextCost} centavos.`));
      if (current.financialTransactionId && current.costCents !== nextCost)
        await this.appendAssetHistory(current.assetId, hist("FINANCIAL_DIVERGENCE", `Custo técnico da manutenção ${current.title} divergiu do lançamento financeiro.`));
      return updated;
    }
    let orderNumber: string | undefined;
    if (value.serviceOrderId) {
      const order = await equipmentRelationsGateway.getServiceOrder(value.serviceOrderId);
      if (!order || order.archived || order.canceled)
        throw new EquipmentDomainError("CONFLICT", "Selecione uma Ordem de Serviço ativa.");
      orderNumber = order.number;
    }
    const updated: MaintenanceRecord = {
      ...current,
      type: value.type,
      title: value.title,
      description: value.description,
      supplier: value.supplier,
      costCents: nextCost,
      scheduledAt: new Date(`${value.scheduledAt}T12:00:00`).toISOString(),
      nextMaintenanceAt: value.nextMaintenanceAt ? new Date(`${value.nextMaintenanceAt}T12:00:00`).toISOString() : undefined,
      serviceOrderId: value.serviceOrderId || undefined,
      serviceOrderNumberSnapshot: orderNumber,
      responsible: value.responsible,
      notes: value.notes,
      updatedAt: now,
      history: [...current.history, { id: crypto.randomUUID(), message: "Manutenção atualizada.", origin: "MANUAL", createdAt: now }],
    };
    await this.repo.saveMaintenance(updated);
    if (current.costCents !== nextCost)
      await this.appendAssetHistory(current.assetId, hist("MAINTENANCE_COST", `Custo da manutenção alterado para ${nextCost} centavos.`));
    if (current.financialTransactionId && current.costCents !== nextCost)
      await this.appendAssetHistory(current.assetId, hist("FINANCIAL_DIVERGENCE", `Custo técnico da manutenção ${current.title} divergiu do lançamento financeiro.`));
    return updated;
  }

  async startMaintenance(id: string) {
    const state = await this.repo.read();
    const current = state.maintenanceRecords.find((item) => item.id === id);
    if (!current || current.status !== "SCHEDULED")
      throw new EquipmentDomainError("CONFLICT", "Somente manutenção programada pode ser iniciada.");
    const asset = await this.requireActive(current.assetId), now = new Date().toISOString();
    const record: MaintenanceRecord = { ...current, status: "IN_PROGRESS", startedAt: now, previousAssetStatus: asset.status, updatedAt: now, history: [...current.history, { id: crypto.randomUUID(), message: "Manutenção iniciada.", origin: "MANUAL", createdAt: now }] };
    await this.repo.saveMaintenance(record);
    await this.saveAssetStatus(asset, "UNDER_MAINTENANCE", "Status alterado por início de manutenção.", "MAINTENANCE_STARTED");
    return record;
  }

  async completeMaintenance(id: string, assetStatus: AssetStatus) {
    const state = await this.repo.read();
    const current = state.maintenanceRecords.find((item) => item.id === id);
    if (!current || current.status !== "IN_PROGRESS")
      throw new EquipmentDomainError("CONFLICT", "Somente manutenção em andamento pode ser concluída.");
    const asset = await this.requireActive(current.assetId), now = new Date().toISOString();
    const record: MaintenanceRecord = { ...current, status: "COMPLETED", completedAt: now, updatedAt: now, history: [...current.history, { id: crypto.randomUUID(), message: "Manutenção concluída.", origin: "MANUAL", createdAt: now }] };
    await this.repo.saveMaintenance(record);
    await this.saveAssetStatus(asset, assetStatus, "Status definido na conclusão da manutenção.", "MAINTENANCE_COMPLETED");
    return record;
  }

  async cancelMaintenance(id: string) {
    const state = await this.repo.read();
    const current = state.maintenanceRecords.find((item) => item.id === id);
    if (!current || current.status === "COMPLETED" || current.status === "CANCELED")
      throw new EquipmentDomainError("CONFLICT", "Manutenção encerrada não pode ser cancelada.");
    const asset = await this.requireActive(current.assetId), now = new Date().toISOString();
    const record: MaintenanceRecord = { ...current, status: "CANCELED", canceledAt: now, updatedAt: now, history: [...current.history, { id: crypto.randomUUID(), message: "Manutenção cancelada.", origin: "MANUAL", createdAt: now }] };
    await this.repo.saveMaintenance(record);
    if (current.status === "IN_PROGRESS")
      await this.saveAssetStatus(asset, current.previousAssetStatus ?? "AVAILABLE", "Status restaurado após cancelamento da manutenção.", "MAINTENANCE_CANCELED");
    else await this.appendAssetHistory(asset.id, hist("MAINTENANCE_CANCELED", `Manutenção cancelada: ${current.title}.`));
    return record;
  }

  async updateWarranty(assetId: string, input: WarrantyFormValues) {
    const asset = await this.requireActive(assetId), value = warrantyFormSchema.parse(input), now = new Date().toISOString();
    const created = !asset.warranty;
    const updated = { ...asset, warranty: value, updatedAt: now, history: [...asset.history, hist(created ? "WARRANTY_CREATED" : "WARRANTY_UPDATED", created ? "Garantia registrada." : "Garantia atualizada.")] };
    await this.repo.saveAsset(updated);
    return updated;
  }

  async removeWarranty(assetId: string) {
    const asset = await this.requireActive(assetId);
    if (!asset.warranty) throw new EquipmentDomainError("CONFLICT", "Não há garantia registrada.");
    const updated: EquipmentAsset = { ...asset, warranty: undefined, updatedAt: new Date().toISOString(), history: [...asset.history, hist("WARRANTY_REMOVED", "Garantia removida.")] };
    await this.repo.saveAsset(updated);
    return updated;
  }

  private financialSnapshot(transaction: EquipmentFinanceiroTransaction): EquipmentFinancialSnapshot {
    return {
      transactionId: transaction.id, number: transaction.number, nature: transaction.nature,
      totalCents: transaction.totalCents, paidCents: transaction.paidCents,
      openCents: transaction.openCents, status: transaction.status,
      accountName: transaction.accountName, canceled: transaction.canceled,
      archived: transaction.archived, manuallyModified: transaction.manuallyModified,
      updatedAt: transaction.updatedAt,
    };
  }

  private reconciliation(currentCents: number, transaction: EquipmentFinanceiroTransaction, maintenance: boolean): EquipmentFinancialReconciliationStatus {
    if (transaction.canceled) return "FINANCIAL_CANCELED";
    if (transaction.archived) return "FINANCIAL_ARCHIVED";
    if (transaction.manuallyModified) return "MANUALLY_MODIFIED";
    if (currentCents > transaction.totalCents) return maintenance ? "MAINTENANCE_VALUE_INCREASED" : "EQUIPMENT_VALUE_INCREASED";
    if (currentCents < transaction.totalCents) return maintenance ? "MAINTENANCE_VALUE_DECREASED" : "EQUIPMENT_VALUE_DECREASED";
    return "MATCHED";
  }

  async createAcquisitionFinancial(assetId: string, input: EquipmentFinancialFormValues, additionalSequence?: number) {
    const asset = await this.requireActive(assetId);
    if (asset.acquisition.acquisitionValueCents <= 0) throw new EquipmentDomainError("VALIDATION", "Informe um valor de aquisição maior que zero.");
    const summary = additionalSequence ? await equipmentFinanceiroGateway.getSummary(asset.id, "ACQUISITION") : null;
    const amountCents = additionalSequence ? asset.acquisition.acquisitionValueCents - (summary?.totalCents ?? 0) : asset.acquisition.acquisitionValueCents;
    if (amountCents <= 0) throw new EquipmentDomainError("CONFLICT", "Não existe diferença positiva para complementar.");
    const transaction = await equipmentFinanceiroGateway.create({
      source: { sourceType: "EQUIPMENT", sourceId: asset.id, equipmentId: asset.id, purpose: "ACQUISITION" },
      nature: input.nature, title: `${additionalSequence ? "Complemento — " : ""}Aquisição de ${asset.name}`,
      description: `${asset.internalCode} · ${asset.name}${asset.acquisition.invoiceNumber ? ` · NF ${asset.acquisition.invoiceNumber}` : ""}`,
      category: "Aquisição de equipamentos", accountId: input.accountId,
      totalCents: amountCents,
      issueDate: asset.acquisition.acquisitionDate || input.competenceDate,
      competenceDate: input.competenceDate, firstDueDate: input.firstDueDate,
      installmentCount: input.installmentCount, supplier: asset.acquisition.supplier,
      notes: input.notes, payNow: input.payNow, paymentMethod: input.paymentMethod, additionalSequence,
    });
    const snapshot = this.financialSnapshot(transaction.transaction), now = new Date().toISOString();
    const updated: EquipmentAsset = { ...asset,
      acquisitionFinancial: additionalSequence ? asset.acquisitionFinancial : { financialTransactionId: transaction.transaction.id, financialPurpose: "ACQUISITION", financialSnapshot: snapshot },
      updatedAt: now,
      history: [...asset.history, hist(additionalSequence ? "FINANCIAL_COMPLEMENT" : transaction.existing ? "FINANCIAL_EXISTING" : "FINANCIAL_CREATED", additionalSequence ? `Complemento financeiro ${transaction.transaction.number} criado.` : transaction.existing ? `Lançamento existente ${transaction.transaction.number} aberto.` : `Lançamento ${transaction.transaction.number} vinculado à aquisição.`)],
    };
    await this.repo.saveAsset(updated);
    return { ...transaction, reconciliation: this.reconciliation(asset.acquisition.acquisitionValueCents, transaction.transaction, false) };
  }
  async listFinancialAccounts() { return equipmentFinanceiroGateway.listAccounts(); }

  async createMaintenanceFinancial(maintenanceId: string, input: EquipmentFinancialFormValues, additionalSequence?: number) {
    const state = await this.repo.read(), record = state.maintenanceRecords.find((item) => item.id === maintenanceId);
    if (!record || record.status !== "COMPLETED") throw new EquipmentDomainError("CONFLICT", "Somente manutenção concluída pode gerar despesa.");
    if (record.costCents <= 0) throw new EquipmentDomainError("VALIDATION", "A manutenção não possui custo para gerar despesa.");
    const asset = await this.requireActive(record.assetId), summary = additionalSequence ? await equipmentFinanceiroGateway.getSummary(record.id, "MAINTENANCE") : null;
    const amountCents = additionalSequence ? record.costCents - (summary?.totalCents ?? 0) : record.costCents;
    if (amountCents <= 0) throw new EquipmentDomainError("CONFLICT", "Não existe diferença positiva para complementar.");
    const transaction = await equipmentFinanceiroGateway.create({
      source: { sourceType: "EQUIPMENT_MAINTENANCE", sourceId: record.id, equipmentId: asset.id, purpose: "MAINTENANCE" },
      nature: "EXPENSE", title: `${additionalSequence ? "Complemento — " : ""}${record.title}`,
      description: `${asset.internalCode} · ${asset.name}`, category: "Manutenção de equipamentos",
      accountId: input.accountId, totalCents: amountCents,
      issueDate: record.completedAt?.slice(0, 10) ?? input.competenceDate,
      competenceDate: input.competenceDate, firstDueDate: input.firstDueDate,
      installmentCount: input.installmentCount, supplier: record.supplier,
      notes: input.notes, payNow: input.payNow, paymentMethod: input.paymentMethod, additionalSequence,
    });
    const now = new Date().toISOString(), updated: MaintenanceRecord = { ...record,
      financialTransactionId: additionalSequence ? record.financialTransactionId : transaction.transaction.id,
      financialPurpose: "MAINTENANCE",
      financialSnapshot: additionalSequence ? record.financialSnapshot : this.financialSnapshot(transaction.transaction),
      updatedAt: now,
      history: [...record.history, { id: crypto.randomUUID(), message: additionalSequence ? `Complemento financeiro ${transaction.transaction.number} criado.` : transaction.existing ? `Lançamento existente ${transaction.transaction.number} aberto.` : `Despesa ${transaction.transaction.number} vinculada.`, origin: "FINANCIAL", createdAt: now }],
    };
    await this.repo.saveMaintenance(updated);
    await this.appendAssetHistory(asset.id, hist(additionalSequence ? "FINANCIAL_COMPLEMENT" : transaction.existing ? "FINANCIAL_EXISTING" : "FINANCIAL_CREATED", `Manutenção ${record.title}: ${transaction.transaction.number}.`));
    return { ...transaction, reconciliation: this.reconciliation(record.costCents, transaction.transaction, true) };
  }

  async getEquipmentFinancialSummary(assetId: string) {
    const state = await this.repo.read(), asset = state.assets.find((item) => item.id === assetId);
    if (!asset) throw new EquipmentDomainError("NOT_FOUND", "Equipamento não encontrado.");
    const acquisition = asset.acquisitionFinancial ? await equipmentFinanceiroGateway.getSummary(asset.id, "ACQUISITION").catch(() => null) : null;
    const maintenances = await Promise.all(state.maintenanceRecords.filter((item) => item.assetId === assetId && item.financialTransactionId).map(async (record) => {
      const transaction = await equipmentFinanceiroGateway.getSummary(record.id, "MAINTENANCE").catch(() => null);
      return { maintenanceId: record.id, transaction, reconciliation: transaction ? this.reconciliation(record.costCents, transaction, true) : "FINANCIAL_UNAVAILABLE" as const };
    }));
    return { acquisition, acquisitionReconciliation: acquisition ? this.reconciliation(asset.acquisition.acquisitionValueCents, acquisition, false) : asset.acquisitionFinancial ? "FINANCIAL_UNAVAILABLE" as const : null, maintenances };
  }

  async reviewEquipmentFinancial(assetId: string, maintenanceId: string | undefined, notes: string, updateSnapshot: boolean) {
    const state = await this.repo.read(), now = new Date().toISOString();
    if (maintenanceId) {
      const current = state.maintenanceRecords.find((item) => item.id === maintenanceId);
      if (!current?.financialTransactionId) throw new EquipmentDomainError("NOT_FOUND", "Vínculo financeiro não encontrado.");
      const transaction = await equipmentFinanceiroGateway.getSummary(current.id, "MAINTENANCE");
      const updated = { ...current, reconciliationReviewedAt: now, reconciliationNotes: notes, financialSnapshot: updateSnapshot && transaction ? this.financialSnapshot(transaction) : current.financialSnapshot };
      await this.repo.saveMaintenance(updated);
    } else {
      const asset = await this.requireActive(assetId);
      if (!asset.acquisitionFinancial) throw new EquipmentDomainError("NOT_FOUND", "Vínculo financeiro não encontrado.");
      const transaction = await equipmentFinanceiroGateway.getSummary(asset.id, "ACQUISITION");
      await this.repo.saveAsset({ ...asset, acquisitionFinancial: { ...asset.acquisitionFinancial, reconciliationReviewedAt: now, reconciliationNotes: notes, financialSnapshot: updateSnapshot && transaction ? this.financialSnapshot(transaction) : asset.acquisitionFinancial.financialSnapshot }, history: [...asset.history, hist(updateSnapshot ? "FINANCIAL_SNAPSHOT_UPDATED" : "FINANCIAL_REVIEWED", updateSnapshot ? "Snapshot financeiro atualizado por decisão explícita." : "Divergência financeira marcada como revisada.")] });
    }
    return this.getEquipmentFinancialSummary(assetId);
  }

  async cancelEquipmentFinancialBalance(assetId: string, transactionId: string, maintenanceId?: string) {
    const transaction = await equipmentFinanceiroGateway.cancelOpenBalance(transactionId, "Saldo cancelado por decisão explícita em Equipamentos.");
    await this.appendAssetHistory(assetId, hist("FINANCIAL_BALANCE_CANCELED", `Saldo aberto de ${transaction.number} cancelado.`));
    await this.reviewEquipmentFinancial(assetId, maintenanceId, "Saldo aberto cancelado.", true);
    return transaction;
  }

  private async appendAssetHistory(assetId: string, event: AssetHistory) {
    const asset = await this.requireActive(assetId);
    await this.repo.saveAsset({ ...asset, updatedAt: event.createdAt, history: [...asset.history, event] });
  }

  private async saveAssetStatus(asset: EquipmentAsset, status: AssetStatus, message: string, event: AssetHistory["type"]) {
    const now = new Date().toISOString();
    await this.repo.saveAsset({ ...asset, status, updatedAt: now, history: [...asset.history, { ...hist(event, message), origin: "SYSTEM" }] });
  }
}
