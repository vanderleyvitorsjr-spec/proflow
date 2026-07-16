import { ZodError } from "zod";
import { PricingDomainError } from "./precificacao-errors";
import type { PricingRepository } from "./precificacao-repository";
import {
  laborProfileFormSchema,
  pricingSimulationFormSchema,
  pricingTemplateFormSchema,
  type LaborProfileFormValues,
  type PricingComponentFormValues,
  type PricingSimulationFormValues,
  type PricingTemplateFormValues,
} from "./precificacao-schema";
import {
  calculatePricing,
  equipmentDivergence,
  reversePricing,
  stockDivergence,
} from "./precificacao-selectors";
import { pricingStockGateway } from "./precificacao-estoque-gateway";
import { pricingEquipmentGateway } from "./precificacao-equipamentos-gateway";
import { pricingClientsGateway } from "./precificacao-clientes-gateway";
import { pricingCrmGateway } from "./precificacao-crm-gateway";
import { pricingOrdersGateway } from "./precificacao-ordens-gateway";
import type {
  LaborProfile,
  PricingComposition,
  PricingCostComponent,
  PricingPreferences,
  PricingSimulation,
  PricingTemplate,
  PricingPriceType,
} from "./precificacao-types";
const event = (type: string, description: string) => ({
  id: crypto.randomUUID(),
  type,
  description,
  createdAt: new Date().toISOString(),
});
export class PricingService {
  constructor(private repo: PricingRepository) {}
  state() {
    return this.repo.read();
  }
  async list() {
    const state = await this.repo.read();
    return {
      templates: state.templates,
      simulations: state.simulations,
      laborProfiles: state.laborProfiles,
      preferences: state.preferences,
    };
  }
  async getSimulation(id: string) {
    return (await this.repo.read()).simulations.find((item) => item.id === id) ?? null;
  }
  private component(
    input: PricingComponentFormValues,
    previous?: PricingCostComponent,
  ): PricingCostComponent {
    const now = new Date().toISOString(),
      quantity = Number(input.quantity),
      unitCostCents = Number(input.unitCostCents),
      waste = Number(input.wastePercentBasisPoints ?? 0);
    let total = Math.round(
      (quantity * unitCostCents) /
        (input.sourceSnapshot?.kind === "STOCK"
          ? (input.sourceSnapshot.unitScale ?? 1)
          : 1),
    );
    if (input.type === "MATERIAL") total = Math.round((total * (10000 + waste)) / 10000);
    if (input.type === "LABOR")
      total =
        Math.round(
          (total * (10000 + Number(input.percentageRateBasisPoints ?? 0))) / 10000,
        ) + Number(input.fixedAmountCents ?? 0);
    if (input.calculationMode === "FIXED")
      total = Number(input.fixedAmountCents ?? unitCostCents);
    if (input.type === "EQUIPMENT" && input.equipmentDetails)
      total +=
        input.equipmentDetails.maintenanceCents +
        input.equipmentDetails.energyCents +
        input.equipmentDetails.wearCents;
    if (input.type === "TRAVEL" && input.travelDetails) {
      const travel = input.travelDetails;
      total =
        Math.round((travel.distanceMilliKm * travel.costPerKmCents) / 1000) +
        travel.tollCents +
        travel.parkingCents +
        travel.lodgingCents +
        travel.mealsCents +
        travel.otherCents;
    }
    return {
      id: previous?.id ?? crypto.randomUUID(),
      type: input.type,
      sourceId: input.sourceId || undefined,
      sourceType: input.sourceType,
      description: input.description,
      quantity,
      unit: input.unit,
      unitCostCents,
      totalCostCents: Math.max(0, total),
      fixedAmountCents: input.fixedAmountCents,
      percentageRateBasisPoints: input.percentageRateBasisPoints,
      percentageBasis: input.percentageBasis,
      wastePercentBasisPoints: input.wastePercentBasisPoints,
      calculationMode: input.calculationMode,
      equipmentDetails: input.equipmentDetails,
      travelDetails: input.travelDetails,
      overheadCategory: input.overheadCategory,
      manuallyModified: input.manuallyModified,
      notes: input.notes || undefined,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    };
  }
  private simulationFrom(
    id: string | undefined,
    input: PricingSimulationFormValues,
    sequence: number,
    current?: PricingSimulation,
  ) {
    const value = pricingSimulationFormSchema.parse(input),
      now = new Date().toISOString(),
      components = value.components.map((item, index) =>
        this.component(item, current?.costComponents[index]),
      ),
      rules = value.commercialRules,
      result = calculatePricing(components, rules);
    if (
      result.promotionalPriceCents < result.minimumPriceCents &&
      !rules.belowMinimumConfirmed
    )
      throw new PricingDomainError(
        "CONFIRMATION_REQUIRED",
        "O preço promocional está abaixo do mínimo. Confirme explicitamente para salvar.",
      );
    const version = (current?.currentVersion ?? 0) + 1,
      parameters = { description: value.description, category: value.category };
    const simulation: PricingSimulation = {
      id: id ?? crypto.randomUUID(),
      sequence,
      title: value.title,
      templateId: value.templateId || undefined,
      scenarioGroupId: value.scenarioGroupId || undefined,
      scenarioLabel: value.scenarioLabel,
      clientId: current?.clientId,
      clientSnapshot: current?.clientSnapshot,
      crmLeadId: current?.crmLeadId,
      crmSnapshot: current?.crmSnapshot,
      serviceOrderId: current?.serviceOrderId,
      serviceOrderSnapshot: current?.serviceOrderSnapshot,
      applications: current?.applications ?? [],
      appliedRevisionId: current?.appliedRevisionId,
      appliedVersion: current?.appliedVersion,
      appliedPrice: current?.appliedPrice,
      parameters,
      costComponents: components,
      commercialRules: rules,
      reversePricingInput: value.reverseTargetCents
        ? { targetPriceCents: Number(value.reverseTargetCents) }
        : undefined,
      currentVersion: version,
      status: value.status,
      appliedSnapshot: current?.appliedSnapshot,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
      archivedAt: current?.archivedAt,
      revisions: [
        ...(current?.revisions ?? []),
        {
          id: crypto.randomUUID(),
          version,
          parameters,
          costComponents: structuredClone(components),
          commercialRules: { ...rules },
          resultSnapshot: result,
          origin: current ? "EDIT" : "CREATE",
          createdAt: now,
        },
      ],
      history: [
        ...(current?.history ?? []),
        event(
          current ? "UPDATED" : "CREATED",
          current
            ? `Simulação atualizada para a versão ${version}.`
            : "Simulação criada.",
        ),
      ],
    };
    return simulation;
  }
  async createSimulation(input: PricingSimulationFormValues) {
    const state = await this.repo.read(),
      simulation = this.simulationFrom(undefined, input, state.nextSimulationSequence);
    await this.repo.save({
      ...state,
      nextSimulationSequence: state.nextSimulationSequence + 1,
      simulations: [simulation, ...state.simulations],
    });
    return simulation;
  }
  async updateSimulation(id: string, input: PricingSimulationFormValues) {
    const state = await this.repo.read(),
      current = state.simulations.find((item) => item.id === id);
    if (!current) throw new PricingDomainError("NOT_FOUND", "Simulação não encontrada.");
    if (current.status === "APPLIED" && current.archivedAt)
      throw new PricingDomainError(
        "CONFLICT",
        "Uma simulação aplicada não pode ser sobrescrita.",
      );
    const simulation = this.simulationFrom(id, input, current.sequence, current);
    await this.repo.save({
      ...state,
      simulations: state.simulations.map((item) => (item.id === id ? simulation : item)),
    });
    return simulation;
  }
  async duplicateSimulation(id: string, scenario = false) {
    const state = await this.repo.read(),
      current = state.simulations.find((item) => item.id === id);
    if (!current) throw new PricingDomainError("NOT_FOUND", "Simulação não encontrada.");
    const now = new Date().toISOString(),
      group = scenario ? (current.scenarioGroupId ?? crypto.randomUUID()) : undefined,
      result = calculatePricing(current.costComponents, current.commercialRules),
      copy: PricingSimulation = {
        ...structuredClone(current),
        id: crypto.randomUUID(),
        sequence: state.nextSimulationSequence,
        title: scenario ? current.title : `${current.title} — cópia`,
        scenarioGroupId: group,
        scenarioLabel: scenario
          ? `Cenário ${String.fromCharCode(65 + state.simulations.filter((item) => item.scenarioGroupId === group).length)}`
          : "Cenário A",
        currentVersion: 1,
        status: "DRAFT",
        clientId: undefined,
        clientSnapshot: undefined,
        crmLeadId: undefined,
        crmSnapshot: undefined,
        serviceOrderId: undefined,
        serviceOrderSnapshot: undefined,
        applications: [],
        appliedRevisionId: undefined,
        appliedVersion: undefined,
        appliedPrice: undefined,
        archivedAt: undefined,
        createdAt: now,
        updatedAt: now,
        revisions: [
          {
            id: crypto.randomUUID(),
            version: 1,
            parameters: structuredClone(current.parameters),
            costComponents: structuredClone(current.costComponents),
            commercialRules: { ...current.commercialRules },
            resultSnapshot: result,
            origin: scenario ? "SCENARIO_DUPLICATION" : "DUPLICATION",
            createdAt: now,
          },
        ],
        history: [
          event(
            "DUPLICATED",
            scenario ? "Cenário criado por duplicação." : "Simulação duplicada.",
          ),
        ],
      };
    const simulations = state.simulations.map((item) =>
      scenario && item.id === current.id ? { ...item, scenarioGroupId: group } : item,
    );
    await this.repo.save({
      ...state,
      nextSimulationSequence: state.nextSimulationSequence + 1,
      simulations: [copy, ...simulations],
    });
    return copy;
  }
  async archiveSimulation(id: string, reason: string) {
    if (reason.trim().length < 3)
      throw new PricingDomainError("VALIDATION", "Informe o motivo.");
    const state = await this.repo.read(),
      current = state.simulations.find((item) => item.id === id);
    if (!current) throw new PricingDomainError("NOT_FOUND", "Simulação não encontrada.");
    const now = new Date().toISOString(),
      next = {
        ...current,
        status: "ARCHIVED" as const,
        archivedAt: now,
        updatedAt: now,
        history: [
          ...current.history,
          event("ARCHIVED", `Simulação arquivada: ${reason.trim()}.`),
        ],
      };
    await this.repo.save({
      ...state,
      simulations: state.simulations.map((item) => (item.id === id ? next : item)),
    });
    return next;
  }
  async createTemplate(input: PricingTemplateFormValues) {
    const value = pricingTemplateFormSchema.parse(input),
      state = await this.repo.read();
    if (
      state.templates.some((item) => item.code.toLowerCase() === value.code.toLowerCase())
    )
      throw new PricingDomainError("DUPLICATE", "Código de template já utilizado.");
    const now = new Date().toISOString(),
      costComponents = value.components.map((item) => this.component(item)),
      composition: PricingComposition = {
        id: crypto.randomUUID(),
        name: "Composição principal",
        description: "Composição criada com o template.",
        componentIds: costComponents.map((item) => item.id),
        enabled: true,
        order: 1,
      };
    const template: PricingTemplate = {
      id: crypto.randomUUID(),
      sequence: state.nextTemplateSequence,
      code: value.code,
      name: value.name,
      description: value.description,
      serviceType: value.serviceType,
      category: value.category,
      compositions: [composition],
      costComponents,
      laborProfiles: [],
      equipmentProfiles: [],
      travelDefaults: {
        origin: "",
        destination: "",
        distanceMilliKm: 0,
        estimatedTimeMinutes: 0,
        costPerKmCents: 0,
        tollCents: 0,
        parkingCents: 0,
        lodgingCents: 0,
        mealsCents: 0,
        otherCents: 0,
      },
      overheadDefaults: costComponents.filter((item) => item.type === "OVERHEAD"),
      commercialRules: value.commercialRules,
      currentVersion: 1,
      active: value.active,
      createdAt: now,
      updatedAt: now,
      history: [event("CREATED", "Template criado.")],
    };
    await this.repo.save({
      ...state,
      nextTemplateSequence: state.nextTemplateSequence + 1,
      templates: [template, ...state.templates],
    });
    return template;
  }
  async updateTemplate(id: string, input: PricingTemplateFormValues) {
    const value = pricingTemplateFormSchema.parse(input),
      state = await this.repo.read(),
      current = state.templates.find((item) => item.id === id);
    if (!current) throw new PricingDomainError("NOT_FOUND", "Template não encontrado.");
    const now = new Date().toISOString(),
      costComponents = value.components.map((item, index) =>
        this.component(item, current.costComponents[index]),
      ),
      next: PricingTemplate = {
        ...current,
        code: value.code,
        name: value.name,
        description: value.description,
        serviceType: value.serviceType,
        category: value.category,
        costComponents,
        commercialRules: value.commercialRules,
        currentVersion: current.currentVersion + 1,
        active: value.active,
        updatedAt: now,
        history: [
          ...current.history,
          event(
            "UPDATED",
            `Template atualizado para a versão ${current.currentVersion + 1}.`,
          ),
        ],
      };
    await this.repo.save({
      ...state,
      templates: state.templates.map((item) => (item.id === id ? next : item)),
    });
    return next;
  }
  async duplicateTemplate(id: string) {
    const state = await this.repo.read(),
      current = state.templates.find((item) => item.id === id);
    if (!current) throw new PricingDomainError("NOT_FOUND", "Template não encontrado.");
    const now = new Date().toISOString(),
      copy: PricingTemplate = {
        ...structuredClone(current),
        id: crypto.randomUUID(),
        sequence: state.nextTemplateSequence,
        code: `${current.code}-COPIA-${state.nextTemplateSequence}`,
        name: `${current.name} — cópia`,
        currentVersion: 1,
        createdAt: now,
        updatedAt: now,
        history: [event("DUPLICATED", "Template duplicado.")],
      };
    await this.repo.save({
      ...state,
      nextTemplateSequence: state.nextTemplateSequence + 1,
      templates: [copy, ...state.templates],
    });
    return copy;
  }
  async archiveTemplate(id: string, reason: string) {
    const state = await this.repo.read(),
      current = state.templates.find((item) => item.id === id);
    if (!current) throw new PricingDomainError("NOT_FOUND", "Template não encontrado.");
    const now = new Date().toISOString(),
      next = {
        ...current,
        active: false,
        archivedAt: now,
        updatedAt: now,
        history: [
          ...current.history,
          event("ARCHIVED", `Template arquivado: ${reason}.`),
        ],
      };
    await this.repo.save({
      ...state,
      templates: state.templates.map((item) => (item.id === id ? next : item)),
    });
    return next;
  }
  async createComposition(templateId: string, name: string, description: string) {
    const state = await this.repo.read(),
      current = state.templates.find((item) => item.id === templateId);
    if (!current) throw new PricingDomainError("NOT_FOUND", "Template não encontrado.");
    const composition: PricingComposition = {
      id: crypto.randomUUID(),
      name,
      description,
      componentIds: [],
      enabled: true,
      order: current.compositions.length + 1,
    };
    const next = {
      ...current,
      compositions: [...current.compositions, composition],
      updatedAt: new Date().toISOString(),
      history: [
        ...current.history,
        event("COMPOSITION_CREATED", `Composição ${name} criada.`),
      ],
    };
    await this.repo.save({
      ...state,
      templates: state.templates.map((item) => (item.id === templateId ? next : item)),
    });
    return next;
  }
  async saveLaborProfile(input: LaborProfileFormValues, id?: string) {
    const value = laborProfileFormSchema.parse(input),
      state = await this.repo.read(),
      current = state.laborProfiles.find((item) => item.id === id),
      profile: LaborProfile = {
        id: current?.id ?? crypto.randomUUID(),
        name: value.name,
        hourlyCostCents: value.hourlyCostCents,
        burdenRateBasisPoints: value.burdenRateBasisPoints,
        fixedAdditionalCents: value.fixedAdditionalCents,
        active: value.active,
        notes: value.notes || undefined,
      };
    const laborProfiles = current
      ? state.laborProfiles.map((item) => (item.id === id ? profile : item))
      : [profile, ...state.laborProfiles];
    await this.repo.save({ ...state, laborProfiles });
    return profile;
  }
  async savePreferences(preferences: PricingPreferences) {
    const state = await this.repo.read();
    return this.repo.save({ ...state, preferences });
  }
  async pricingSources() {
    const [stock, equipment] = await Promise.all([
      pricingStockGateway.list(),
      pricingEquipmentGateway.list(),
    ]);
    return { stock, equipment };
  }
  private async saveTechnicalRevision(
    simulation: PricingSimulation,
    components: PricingCostComponent[],
    origin: string,
    description: string,
  ) {
    const state = await this.repo.read(),
      now = new Date().toISOString(),
      version = simulation.currentVersion + 1,
      result = calculatePricing(components, simulation.commercialRules),
      next: PricingSimulation = {
        ...simulation,
        costComponents: components,
        currentVersion: version,
        updatedAt: now,
        revisions: [
          ...simulation.revisions,
          {
            id: crypto.randomUUID(),
            version,
            parameters: structuredClone(simulation.parameters),
            costComponents: structuredClone(components),
            commercialRules: { ...simulation.commercialRules },
            resultSnapshot: result,
            origin,
            createdAt: now,
            reason: description,
          },
        ],
        history: [...simulation.history, event(origin, description)],
      };
    await this.repo.save({
      ...state,
      simulations: state.simulations.map((item) =>
        item.id === simulation.id ? next : item,
      ),
    });
    return next;
  }
  async addStockMaterial(input: {
    simulationId: string;
    stockItemId: string;
    quantity: number;
    wasteBasisPoints: number;
    manualCostCents?: number;
    manualReason?: string;
    insufficientConfirmed: boolean;
    replaceComponentId?: string;
  }) {
    const simulation = await this.getSimulation(input.simulationId),
      source = await pricingStockGateway.get(input.stockItemId);
    if (!simulation || !source)
      throw new PricingDomainError("NOT_FOUND", "Simulação ou item não encontrado.");
    if (source.archived)
      throw new PricingDomainError("CONFLICT", "O item do Estoque está arquivado.");
    const scaled = Math.round(input.quantity * source.unitScale);
    if (scaled <= 0 || scaled / source.unitScale !== input.quantity)
      throw new PricingDomainError(
        "VALIDATION",
        "A quantidade não respeita a escala da unidade.",
      );
    if (scaled > source.availableQuantity && !input.insufficientConfirmed)
      throw new PricingDomainError(
        "CONFIRMATION_REQUIRED",
        "O estoque é insuficiente. Confirme para manter a estimativa.",
      );
    if (input.manualCostCents !== undefined && !input.manualReason?.trim())
      throw new PricingDomainError("VALIDATION", "Justifique o custo manual.");
    const now = new Date().toISOString(),
      unitCost = input.manualCostCents ?? source.averageCostCents,
      beforeWaste = Math.round((scaled * unitCost) / source.unitScale),
      total = Math.round((beforeWaste * (10000 + input.wasteBasisPoints)) / 10000),
      component: PricingCostComponent = {
        id: crypto.randomUUID(),
        type: "MATERIAL",
        sourceId: source.id,
        stockItemId: source.id,
        sourceType: "STOCK",
        description: source.name,
        quantity: scaled,
        unit: source.unit,
        unitCostCents: unitCost,
        totalCostCents: total,
        percentageBasis: "NONE",
        wastePercentBasisPoints: input.wasteBasisPoints,
        calculationMode: "QUANTITY",
        sourceSnapshot: {
          kind: "STOCK",
          id: source.id,
          internalCode: source.internalCode,
          name: source.name,
          unit: source.unit,
          unitScale: source.unitScale,
          averageCostCents: source.averageCostCents,
          availableQuantity: source.availableQuantity,
          method: "STOCK_AVERAGE",
          sourceUpdatedAt: source.updatedAt,
          capturedAt: now,
        },
        sourceUpdatedAt: source.updatedAt,
        sourceCostCents: source.averageCostCents,
        manuallyModified: input.manualCostCents !== undefined,
        manualCostReason: input.manualReason?.trim(),
        insufficientStockConfirmed: input.insufficientConfirmed,
        createdAt: now,
        updatedAt: now,
      };
    return this.saveTechnicalRevision(
      simulation,
      input.replaceComponentId
        ? simulation.costComponents.map((item) =>
            item.id === input.replaceComponentId ? component : item,
          )
        : [...simulation.costComponents, component],
      input.replaceComponentId ? "STOCK_MATERIAL_REPLACED" : "STOCK_MATERIAL_ADDED",
      `Material ${source.internalCode} ${input.replaceComponentId ? "substituiu a origem anterior" : "foi vinculado ao Estoque"}.${input.insufficientConfirmed ? " Estoque insuficiente confirmado." : ""}`,
    );
  }
  async addRealEquipment(input: {
    simulationId: string;
    equipmentId: string;
    method: "DERIVED_PER_HOUR" | "MANUAL_PER_HOUR" | "MANUAL_PER_USE";
    usage: number;
    manualCostCents?: number;
    manualReason?: string;
    replaceComponentId?: string;
  }) {
    const simulation = await this.getSimulation(input.simulationId),
      source = await pricingEquipmentGateway.get(input.equipmentId),
      state = await this.repo.read();
    if (!simulation || !source)
      throw new PricingDomainError(
        "NOT_FOUND",
        "Simulação ou equipamento não encontrado.",
      );
    if (
      source.archived ||
      source.condition === "UNUSABLE" ||
      !["AVAILABLE", "IN_USE"].includes(source.status)
    )
      throw new PricingDomainError(
        "CONFLICT",
        "Equipamento inelegível para precificação.",
      );
    if (input.method !== "DERIVED_PER_HOUR" && !input.manualReason?.trim())
      throw new PricingDomainError("VALIDATION", "Justifique o custo manual.");
    const hours = state.preferences.standardMonthlyEquipmentHours,
      derived = Math.round(
        ((source.ownership === "COMPANY" ? source.monthlyDepreciationCents : 0) +
          source.estimatedMaintenanceMonthlyCents) /
          hours,
      ),
      unitCost =
        input.method === "DERIVED_PER_HOUR" ? derived : (input.manualCostCents ?? 0),
      now = new Date().toISOString(),
      component: PricingCostComponent = {
        id: crypto.randomUUID(),
        type: "EQUIPMENT",
        sourceId: source.id,
        equipmentId: source.id,
        sourceType: "EQUIPMENT",
        description: source.name,
        quantity: input.usage,
        unit: input.method === "MANUAL_PER_USE" ? "uso" : "hora",
        unitCostCents: unitCost,
        totalCostCents: Math.round(input.usage * unitCost),
        percentageBasis: "NONE",
        calculationMode: input.method === "MANUAL_PER_USE" ? "PER_USE" : "PER_HOUR",
        sourceSnapshot: {
          kind: "EQUIPMENT",
          id: source.id,
          internalCode: source.internalCode,
          name: source.name,
          ownership: source.ownership,
          status: source.status,
          condition: source.condition,
          currentValueCents: source.currentValueCents,
          monthlyDepreciationCents: source.monthlyDepreciationCents,
          estimatedMaintenanceMonthlyCents: source.estimatedMaintenanceMonthlyCents,
          method: input.method,
          standardMonthlyHours: hours,
          sourceUpdatedAt: source.updatedAt,
          capturedAt: now,
        },
        sourceUpdatedAt: source.updatedAt,
        sourceCostCents: derived,
        manuallyModified: input.method !== "DERIVED_PER_HOUR",
        manualCostReason: input.manualReason?.trim(),
        createdAt: now,
        updatedAt: now,
      };
    return this.saveTechnicalRevision(
      simulation,
      input.replaceComponentId
        ? simulation.costComponents.map((item) =>
            item.id === input.replaceComponentId ? component : item,
          )
        : [...simulation.costComponents, component],
      input.replaceComponentId ? "EQUIPMENT_REPLACED" : "EQUIPMENT_ADDED",
      `Equipamento ${source.internalCode} ${input.replaceComponentId ? "substituiu a origem anterior" : "foi vinculado"} com snapshot técnico.`,
    );
  }
  async divergences(simulationId: string) {
    const simulation = await this.getSimulation(simulationId);
    if (!simulation)
      throw new PricingDomainError("NOT_FOUND", "Simulação não encontrada.");
    return Promise.all(
      simulation.costComponents
        .filter((item) => item.stockItemId || item.equipmentId)
        .map(async (item) =>
          item.stockItemId
            ? stockDivergence(item, await pricingStockGateway.get(item.stockItemId))
            : equipmentDivergence(
                item,
                await pricingEquipmentGateway.get(item.equipmentId!),
              ),
        ),
    );
  }
  async reviewSource(
    simulationId: string,
    componentId: string,
    update: boolean,
    notes: string,
  ) {
    const simulation = await this.getSimulation(simulationId),
      current = simulation?.costComponents.find((item) => item.id === componentId);
    if (!simulation || !current)
      throw new PricingDomainError("NOT_FOUND", "Componente não encontrado.");
    if (update && current.manuallyModified)
      throw new PricingDomainError(
        "CONFLICT",
        "Componentes com custo manual devem ser revisados manualmente.",
      );
    const now = new Date().toISOString();
    let component: PricingCostComponent = {
      ...current,
      divergenceReviewedAt: now,
      divergenceNotes: notes.trim(),
      updatedAt: now,
    };
    if (update && current.stockItemId) {
      const source = await pricingStockGateway.get(current.stockItemId);
      if (!source) throw new PricingDomainError("NOT_FOUND", "Item indisponível.");
      const beforeWaste = Math.round(
        (current.quantity * source.averageCostCents) / source.unitScale,
      );
      component = {
        ...component,
        unitCostCents: source.averageCostCents,
        totalCostCents: Math.round(
          (beforeWaste * (10000 + (current.wastePercentBasisPoints ?? 0))) / 10000,
        ),
        sourceCostCents: source.averageCostCents,
        sourceUpdatedAt: source.updatedAt,
        sourceSnapshot: {
          ...current.sourceSnapshot!,
          averageCostCents: source.averageCostCents,
          availableQuantity: source.availableQuantity,
          sourceUpdatedAt: source.updatedAt,
          capturedAt: now,
        },
      };
    } else if (update && current.equipmentId) {
      const source = await pricingEquipmentGateway.get(current.equipmentId);
      if (!source) throw new PricingDomainError("NOT_FOUND", "Equipamento indisponível.");
      const hours = current.sourceSnapshot?.standardMonthlyHours ?? 160,
        cost = Math.round(
          ((source.ownership === "COMPANY" ? source.monthlyDepreciationCents : 0) +
            source.estimatedMaintenanceMonthlyCents) /
            hours,
        );
      component = {
        ...component,
        unitCostCents: cost,
        totalCostCents: Math.round(current.quantity * cost),
        sourceCostCents: cost,
        sourceUpdatedAt: source.updatedAt,
        sourceSnapshot: {
          ...current.sourceSnapshot!,
          ownership: source.ownership,
          status: source.status,
          condition: source.condition,
          currentValueCents: source.currentValueCents,
          monthlyDepreciationCents: source.monthlyDepreciationCents,
          estimatedMaintenanceMonthlyCents: source.estimatedMaintenanceMonthlyCents,
          sourceUpdatedAt: source.updatedAt,
          capturedAt: now,
        },
      };
    }
    return this.saveTechnicalRevision(
      simulation,
      simulation.costComponents.map((item) =>
        item.id === componentId ? component : item,
      ),
      update ? "SOURCE_SNAPSHOT_UPDATED" : "SOURCE_SNAPSHOT_KEPT",
      update
        ? `Snapshot da origem atualizado. ${notes.trim()}`
        : `Valor da simulação mantido. ${notes.trim()}`,
    );
  }
  async commercialReferences() {
    const [clients, leads, orders] = await Promise.all([pricingClientsGateway.list(), pricingCrmGateway.list(), pricingOrdersGateway.list()]);
    return { clients, leads, orders };
  }
  async linkCommercial(simulationId: string, input: { clientId?: string; crmLeadId?: string; serviceOrderId?: string }) {
    const state = await this.repo.read(), current = state.simulations.find((item) => item.id === simulationId);
    if (!current || current.archivedAt) throw new PricingDomainError("NOT_FOUND", "Simulação indisponível.");
    const [client, lead, order] = await Promise.all([input.clientId ? pricingClientsGateway.get(input.clientId) : null, input.crmLeadId ? pricingCrmGateway.get(input.crmLeadId) : null, input.serviceOrderId ? pricingOrdersGateway.get(input.serviceOrderId) : null]);
    if (input.clientId && (!client || client.archived)) throw new PricingDomainError("CONFLICT", "O cliente não está ativo.");
    if (input.crmLeadId && (!lead || lead.archived)) throw new PricingDomainError("CONFLICT", "O lead não está ativo.");
    if (input.serviceOrderId && (!order || order.archived || order.canceled)) throw new PricingDomainError("CONFLICT", "A Ordem não está elegível.");
    const clientId = client?.id ?? current.clientId;
    if (lead?.converted && lead.clientId && lead.clientId !== clientId) throw new PricingDomainError("CONFLICT", "O cliente convertido do lead diverge da simulação.");
    if (order && order.clientId !== clientId) throw new PricingDomainError("CONFLICT", "O cliente da Ordem diverge da simulação.");
    if (current.applications.length && current.clientId !== clientId) throw new PricingDomainError("CONFLICT", "O cliente de uma simulação aplicada não pode ser trocado silenciosamente.");
    const now = new Date().toISOString(), next: PricingSimulation = { ...current, clientId, clientSnapshot: client ? { id: client.id, name: client.name, updatedAt: client.updatedAt ?? now } : current.clientSnapshot, crmLeadId: lead?.id, crmSnapshot: lead ? { id: lead.id, title: lead.title, customerName: lead.customerName, stage: lead.stage, converted: lead.converted, clientId: lead.clientId, updatedAt: lead.updatedAt } : undefined, serviceOrderId: order?.id, serviceOrderSnapshot: order ? { id: order.id, number: order.number, title: order.title, clientId: order.clientId, currentPriceCents: order.currentPriceCents, status: order.status, updatedAt: order.updatedAt } : undefined, updatedAt: now, history: [...current.history, event("COMMERCIAL_LINKS_UPDATED", "Vínculos comerciais atualizados explicitamente.")] };
    await this.repo.save({ ...state, simulations: state.simulations.map((item) => item.id === simulationId ? next : item) }); return next;
  }
  async applyToOrder(simulationId: string, input: { priceType: PricingPriceType; manualPriceCents?: number; reason?: string; belowMinimumConfirmed: boolean }) {
    const state = await this.repo.read(), current = state.simulations.find((item) => item.id === simulationId);
    if (!current || !current.serviceOrderId || !current.clientId) throw new PricingDomainError("VALIDATION", "Vincule cliente e Ordem antes de aplicar.");
    const order = await pricingOrdersGateway.get(current.serviceOrderId); if (!order || order.canceled || order.archived || order.clientId !== current.clientId) throw new PricingDomainError("CONFLICT", "A Ordem vinculada não está elegível ou possui outro cliente.");
    const calculation = calculatePricing(current.costComponents, current.commercialRules), calculated = input.priceType === "MINIMUM" ? calculation.minimumPriceCents : input.priceType === "RECOMMENDED" ? calculation.recommendedPriceCents : input.priceType === "PREMIUM" ? calculation.premiumPriceCents : calculation.promotionalPriceCents;
    const price = input.priceType === "MANUAL" ? input.manualPriceCents ?? 0 : calculated;
    if (input.priceType === "MANUAL" && (!input.reason?.trim() || price <= 0)) throw new PricingDomainError("VALIDATION", "Informe valor manual positivo e justificativa.");
    if (price < calculation.minimumPriceCents && !input.belowMinimumConfirmed) throw new PricingDomainError("CONFIRMATION_REQUIRED", "O valor está abaixo do mínimo. Confirme explicitamente.");
    const revision = current.revisions.find((item) => item.version === current.currentVersion); if (!revision) throw new PricingDomainError("CONFLICT", "A revisão atual não foi encontrada.");
    const now = new Date().toISOString(), profit = price - calculation.totalCostCents - calculation.taxCents - calculation.commissionCents, margin = price ? Math.round((profit * 10000) / price) : 0;
    await pricingOrdersGateway.apply({ serviceOrderId: order.id, simulationId: current.id, simulationVersion: current.currentVersion, revisionId: revision.id, priceCents: price, priceType: input.priceType, appliedAt: now, pricingUpdatedAtSnapshot: current.updatedAt });
    const applications = current.applications.map((item) => item.supersededAt ? item : { ...item, supersededAt: now });
    applications.push({ id: crypto.randomUUID(), serviceOrderId: order.id, serviceOrderNumberSnapshot: order.number, serviceOrderTitleSnapshot: order.title, serviceOrderClientIdSnapshot: order.clientId, serviceOrderUpdatedAtSnapshot: order.updatedAt, simulationVersion: current.currentVersion, revisionId: revision.id, priceType: input.priceType, priceCents: price, calculatedPriceCents: calculated, costCents: calculation.totalCostCents, profitCents: profit, marginBasisPoints: margin, appliedAt: now, reason: input.reason?.trim(), manuallyModified: input.priceType === "MANUAL" });
    const next: PricingSimulation = { ...current, status: "APPLIED", applications, appliedRevisionId: revision.id, appliedVersion: current.currentVersion, appliedPrice: price, serviceOrderSnapshot: { id: order.id, number: order.number, title: order.title, clientId: order.clientId, currentPriceCents: price, status: order.status, updatedAt: now }, updatedAt: now, history: [...current.history, event("PRICE_APPLIED", `${input.priceType === "MANUAL" ? "Valor manual" : "Preço"} da versão ${current.currentVersion} aplicado à ${order.number}. Aplicação anterior preservada.`)] };
    await this.repo.save({ ...state, simulations: state.simulations.map((item) => item.id === simulationId ? next : item) }); return next;
  }
  recoverBackup() {
    return this.repo.recoverBackup();
  }
  reverse(simulation: PricingSimulation, target: number) {
    return reversePricing(simulation.costComponents, simulation.commercialRules, target);
  }
  compare(simulations: PricingSimulation[]) {
    return simulations.map((item) => ({
      simulation: item,
      result: calculatePricing(item.costComponents, item.commercialRules),
    }));
  }
}
export function pricingError(cause: unknown) {
  if (cause instanceof PricingDomainError) return cause;
  if (cause instanceof ZodError)
    return new PricingDomainError(
      "VALIDATION",
      "Revise os campos informados.",
      cause.flatten().fieldErrors as Record<string, string[]>,
    );
  return cause instanceof Error ? cause : new Error("Erro inesperado em Precificação.");
}
