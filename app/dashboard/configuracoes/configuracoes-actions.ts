"use client";
import { ConfigurationRepository } from "./configuracoes-repository";
import { ConfigurationService, configurationError } from "./configuracoes-service";
import { configurationStorageAdapter } from "./configuracoes-storage-adapter";
import type { ConfigResult } from "./configuracoes-result";
import type { ConfigSection, TeamMember } from "./configuracoes-types";
const service = new ConfigurationService(
  new ConfigurationRepository(configurationStorageAdapter),
);
const action = async <T>(work: () => Promise<T>): Promise<ConfigResult<T>> => {
  try {
    return { ok: true, data: await work() };
  } catch (cause) {
    const error = configurationError(cause);
    return { ok: false, error: { code: error.code, message: error.message } };
  }
};
export const getConfigurationsAction = () => action(() => service.list());
export const getPublicConfigurationsAction = () => action(() => service.publicSettings());
export const getActiveTeamAction = () => action(() => service.activeTeam());
export const saveConfigurationSectionAction = (
  section: Exclude<ConfigSection, "team">,
  value: unknown,
) => action(() => service.saveSection(section, value));
export const saveTeamMemberAction = (
  input: Omit<TeamMember, "id" | "createdAt" | "updatedAt" | "history">,
  id?: string,
) => action(() => service.saveTeamMember(input, id));
export const setTeamMemberArchivedAction = (id: string, archived: boolean) =>
  action(() => service.setTeamArchived(id, archived));
export const resetConfigurationSectionAction = (
  section: Exclude<ConfigSection, "team">,
) => action(() => service.resetSection(section));
export const exportConfigurationsAction = () => action(() => service.exportJson());
export const previewConfigurationImportAction = (raw: string) =>
  action(async () => service.previewImport(raw));
export const importConfigurationsAction = (raw: string) =>
  action(() => service.importJson(raw));
export const recoverConfigurationsBackupAction = () => action(() => service.recover());
