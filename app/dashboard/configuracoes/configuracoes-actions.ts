"use client";
import { ConfigurationRepository } from "./configuracoes-repository";
import { ConfigurationService, configurationError } from "./configuracoes-service";
import { configurationStorageAdapter } from "./configuracoes-storage-adapter";
import type { ConfigResult } from "./configuracoes-result";
import type { ConfigSection, TeamMember } from "./configuracoes-types";
import type { DocumentIdentity } from "@/components/documents/professional-document-domain";
const service = new ConfigurationService(
  new ConfigurationRepository(configurationStorageAdapter),
);
const action = async <T>(
  work: () => Promise<T>,
  notify = false,
): Promise<ConfigResult<T>> => {
  try {
    const data = await work();
    if (notify && typeof window !== "undefined")
      window.dispatchEvent(new CustomEvent("proflow:configuracoes:updated"));
    return { ok: true, data };
  } catch (cause) {
    const error = configurationError(cause);
    return { ok: false, error: { code: error.code, message: error.message } };
  }
};
export const getConfigurationsAction = () => action(() => service.list());
export const getPublicConfigurationsAction = () => action(() => service.publicSettings());
export const getDocumentIdentityAction = () => action(async (): Promise<DocumentIdentity> => {
  const { company } = await service.list();
  const cityLine = [company.zipCode, company.city, company.state].filter(Boolean).join(" · ");
  return {
    logoUrl: company.showLogoOnDocuments && company.logoMetadata
      ? `/api/documentos-arquivos/${company.logoMetadata}?inline=1`
      : undefined,
    companyName: company.tradeName || company.legalName || (company.displayName && company.displayName.trim().toLocaleLowerCase("pt-BR") !== "proflow" ? company.displayName : undefined),
    legalName: company.legalName,
    document: company.document,
    phone: company.phone,
    whatsapp: company.whatsapp,
    email: company.email,
    address: [company.address, cityLine].filter(Boolean).join(" — "),
    website: company.website,
    primaryColor: company.primaryColor,
    footer: company.documentFooter || [company.phone, company.whatsapp, company.email, company.website].filter(Boolean).join(" · "),
    signature: company.textualSignature,
  };
});
export const getActiveTeamAction = () => action(() => service.activeTeam());
export const getTeamMemberPublicAction = (id: string) =>
  action(async () => (await service.publicSettings()).team.find((item) => item.id === id) ?? null);
export const getOperationalSettingsAction = () =>
  action(async () => (await service.publicSettings()).operational);
export const getFinancialSettingsAction = () =>
  action(async () => (await service.publicSettings()).financial);
export const getPricingSettingsAction = () =>
  action(async () => (await service.publicSettings()).pricing);
export const getAppearanceSettingsAction = () =>
  action(async () => ({
    appearance: (await service.publicSettings()).appearance,
    preferences: (await service.list()).systemPreferences,
  }));
export const saveConfigurationSectionAction = (
  section: Exclude<ConfigSection, "team">,
  value: unknown,
) => action(() => service.saveSection(section, value), true);
export const saveTeamMemberAction = (
  input: Omit<TeamMember, "id" | "createdAt" | "updatedAt" | "history">,
  id?: string,
) => action(() => service.saveTeamMember(input, id), true);
export const setTeamMemberArchivedAction = (id: string, archived: boolean) =>
  action(() => service.setTeamArchived(id, archived), true);
export const resetConfigurationSectionAction = (
  section: Exclude<ConfigSection, "team">,
) => action(() => service.resetSection(section), true);
export const exportConfigurationsAction = () => action(() => service.exportJson());
export const previewConfigurationImportAction = (raw: string) =>
  action(async () => service.previewImport(raw));
export const importConfigurationsAction = (raw: string) =>
  action(() => service.importJson(raw), true);
export const recoverConfigurationsBackupAction = () =>
  action(() => service.recover(), true);
