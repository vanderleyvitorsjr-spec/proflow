import { ZodError } from "zod";
import { isValidCnpj, isValidCpf, normalizeAddressText, normalizeEmail, normalizeProperName, normalizeUpperCode, onlyDigits } from "@/lib/br-formatters";
import { configStateSchema, teamMemberSchema } from "./configuracoes-schema";
import { defaultConfigState } from "./configuracoes-data";
import { ConfigurationError } from "./configuracoes-errors";
import type { ConfigurationRepository } from "./configuracoes-repository";
import { publicSettings } from "./configuracoes-selectors";
import type { ConfigSection, ConfigState, TeamMember } from "./configuracoes-types";
const history = (type: string, description: string) => ({
  id: crypto.randomUUID(),
  type,
  description,
  createdAt: new Date().toISOString(),
});
export class ConfigurationService {
  constructor(private repository: ConfigurationRepository) {}
  list() {
    return this.repository.read();
  }
  publicSettings = async () => publicSettings(await this.list());
  activeTeam = async () =>
    (await this.publicSettings()).team.filter((item) => item.active && !item.archived);
  private async commit(state: ConfigState, type: string, description: string) {
    return this.repository.save(
      { ...state, history: [...state.history, history(type, description)] },
      state.revision,
    );
  }
  async saveSection(section: Exclude<ConfigSection, "team">, value: unknown) {
    const state = await this.list(),
      next = structuredClone(state);
    if (section === "company") {
      const input = value as ConfigState["company"];
      const company = {
        ...input,
        legalName: normalizeProperName(input.legalName),
        tradeName: normalizeProperName(input.tradeName),
        displayName: normalizeProperName(input.displayName),
        shortName: normalizeProperName(input.shortName),
        legalRepresentative: normalizeProperName(input.legalRepresentative),
        address: normalizeAddressText(input.address),
        city: normalizeProperName(input.city),
        state: normalizeUpperCode(input.state),
        document: onlyDigits(input.document),
        phone: onlyDigits(input.phone),
        whatsapp: onlyDigits(input.whatsapp),
        zipCode: onlyDigits(input.zipCode),
        email: normalizeEmail(input.email),
        specialties: input.specialties.map(normalizeProperName),
        updatedAt: new Date().toISOString(),
      };
      if (
        company.document &&
        !(isValidCpf(company.document) || isValidCnpj(company.document))
      )
        throw new ConfigurationError("VALIDATION", "Informe um CPF ou CNPJ válido.");
      next.company = company;
    } else if (section === "operational")
      next.operationalSettings = value as ConfigState["operationalSettings"];
    else if (section === "financial")
      next.financialSettings = {
        ...(value as ConfigState["financialSettings"]),
        allowOverpayment: false,
      };
    else if (section === "pricing")
      next.pricingSettings = value as ConfigState["pricingSettings"];
    else if (section === "numbering")
      next.numberingSettings = value as ConfigState["numberingSettings"];
    else if (section === "appearance")
      next.appearanceSettings = value as ConfigState["appearanceSettings"];
    else next.systemPreferences = value as ConfigState["systemPreferences"];
    configStateSchema.parse(next);
    return this.commit(
      next,
      `${section.toUpperCase()}_UPDATED`,
      `Seção ${section} atualizada.`,
    );
  }
  async saveTeamMember(
    input: Omit<TeamMember, "id" | "createdAt" | "updatedAt" | "history">,
    id?: string,
  ) {
    const state = await this.list(),
      now = new Date().toISOString(),
      normalized = {
        name: normalizeProperName(input.name),
        specialties: input.specialties.map(normalizeProperName),
        email: normalizeEmail(input.email),
        phone: onlyDigits(input.phone),
        document: onlyDigits(input.document ?? ""),
      };
    const duplicate = state.teamMembers.find(
      (item) =>
        item.id !== id &&
        ((normalized.email && normalizeEmail(item.email) === normalized.email) ||
          (normalized.phone && onlyDigits(item.phone) === normalized.phone) ||
          (normalized.document && onlyDigits(item.document ?? "") === normalized.document)),
    );
    if (duplicate)
      throw new ConfigurationError(
        "DUPLICATE",
        "Já existe integrante com o mesmo e-mail, telefone ou documento.",
      );
    const current = id ? state.teamMembers.find((item) => item.id === id) : undefined;
    if (id && !current)
      throw new ConfigurationError("NOT_FOUND", "Integrante não encontrado.");
    const event = history(
      id ? "TEAM_UPDATED" : "TEAM_CREATED",
      id ? "Integrante editado." : "Integrante criado.",
    );
    const member = teamMemberSchema.parse({
      ...input,
      ...normalized,
      id: current?.id ?? crypto.randomUUID(),
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
      archivedAt: current?.archivedAt,
      history: [...(current?.history ?? []), event],
    }) as TeamMember;
    const teamMembers = current
      ? state.teamMembers.map((item) => (item.id === current.id ? member : item))
      : [...state.teamMembers, member];
    return this.commit({ ...state, teamMembers }, event.type, event.description);
  }
  async setTeamArchived(id: string, archived: boolean) {
    const state = await this.list(),
      member = state.teamMembers.find((item) => item.id === id);
    if (!member) throw new ConfigurationError("NOT_FOUND", "Integrante não encontrado.");
    const event = history(
      archived ? "TEAM_ARCHIVED" : "TEAM_REACTIVATED",
      archived ? "Integrante arquivado." : "Integrante reativado.",
    );
    return this.commit(
      {
        ...state,
        teamMembers: state.teamMembers.map((item) =>
          item.id === id
            ? {
                ...item,
                active: !archived,
                archivedAt: archived ? event.createdAt : undefined,
                updatedAt: event.createdAt,
                history: [...item.history, event],
              }
            : item,
        ),
      },
      event.type,
      event.description,
    );
  }
  async resetSection(section: Exclude<ConfigSection, "team">) {
    const state = await this.list(),
      defaults = defaultConfigState(),
      key =
        section === "company"
          ? "company"
          : section === "operational"
            ? "operationalSettings"
            : section === "financial"
              ? "financialSettings"
              : section === "pricing"
                ? "pricingSettings"
                : section === "numbering"
                  ? "numberingSettings"
                  : section === "appearance"
                    ? "appearanceSettings"
                    : "systemPreferences";
    const next = { ...state, [key]: defaults[key] };
    return this.commit(next, "SECTION_RESET", `Seção ${section} redefinida.`);
  }
  exportJson = async () => JSON.stringify(await this.list(), null, 2);
  previewImport(raw: string) {
    const parsed = configStateSchema.safeParse(JSON.parse(raw));
    if (!parsed.success)
      throw new ConfigurationError(
        "VALIDATION",
        "Arquivo incompatível ou estrutura inválida.",
      );
    return {
      version: parsed.data.version,
      revision: parsed.data.revision,
      teamMembers: parsed.data.teamMembers.length,
      historyEntries: parsed.data.history.length,
      companyDisplayName: parsed.data.company.displayName,
    };
  }
  async importJson(raw: string) {
    const imported = configStateSchema.parse(JSON.parse(raw)) as ConfigState,
      current = await this.list();
    return this.commit(
      { ...imported, revision: current.revision },
      "SETTINGS_IMPORTED",
      "Configurações importadas após validação integral.",
    );
  }
  recover() {
    return this.repository.recover();
  }
}
export const configurationError = (cause: unknown) =>
  cause instanceof ConfigurationError
    ? cause
    : cause instanceof ZodError
      ? new ConfigurationError(
          "VALIDATION",
          cause.issues[0]?.message ?? "Revise os campos.",
        )
      : cause instanceof SyntaxError
        ? new ConfigurationError("VALIDATION", "JSON inválido.")
        : new ConfigurationError(
            "VALIDATION",
            cause instanceof Error
              ? cause.message
              : "Não foi possível concluir a operação.",
          );
