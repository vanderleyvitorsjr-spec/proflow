import { equipmentFormSchema, type EquipmentFormValues } from "./equipamentos-schema";
import { EquipmentDomainError } from "./equipamentos-errors";
import { EquipmentRepository } from "./equipamentos-repository";
import type { AssetHistory, AssetMedia, EquipmentAsset } from "./equipamentos-types";
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
}
