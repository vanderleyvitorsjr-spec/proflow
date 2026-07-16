import { ZodError } from "zod";
import { configStateSchema, teamMemberSchema } from "./configuracoes-schema";
import { defaultConfigState } from "./configuracoes-data";
import { ConfigurationError } from "./configuracoes-errors";
import type { ConfigurationRepository } from "./configuracoes-repository";
import { publicSettings } from "./configuracoes-selectors";
import type { ConfigSection, ConfigState, TeamMember } from "./configuracoes-types";
const digits = (value: string) => value.replace(/\D/g, "");
const validCpf = (value: string) => {
  const d = digits(value);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const calc = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(d[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
};
const validCnpj = (value: string) => {
  const d = digits(value);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (length: number) => {
    const weights =
      length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce(
        (total, weight, index) => total + Number(d[index]) * weight,
        0,
      ),
      rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
};
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
      const company = {
        ...(value as ConfigState["company"]),
        updatedAt: new Date().toISOString(),
      };
      if (
        company.document &&
        !(validCpf(company.document) || validCnpj(company.document))
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
        email: input.email.trim().toLowerCase(),
        phone: digits(input.phone),
        document: digits(input.document ?? ""),
      };
    const duplicate = state.teamMembers.find(
      (item) =>
        item.id !== id &&
        ((normalized.email && item.email.toLowerCase() === normalized.email) ||
          (normalized.phone && digits(item.phone) === normalized.phone) ||
          (normalized.document && digits(item.document ?? "") === normalized.document)),
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
