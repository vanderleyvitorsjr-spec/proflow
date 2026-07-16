import type { ConfiguracoesPublicSettings } from "@/lib/contracts/configuracoes.contract";
import type { ConfigState } from "./configuracoes-types";
export const publicSettings = (state: ConfigState): ConfiguracoesPublicSettings => ({
  revision: state.revision,
  company: {
    displayName: state.company.displayName,
    shortName: state.company.shortName,
    tradeName: state.company.tradeName,
    phone: state.company.phone,
    whatsapp: state.company.whatsapp,
    email: state.company.email,
    city: state.company.city,
    state: state.company.state,
    segment: state.company.segment,
    specialties: state.company.specialties,
    updatedAt: state.company.updatedAt,
  },
  team: state.teamMembers.map((item) => ({
    id: item.id,
    name: item.name,
    role: item.role,
    specialties: item.specialties,
    hourlyCostCents: item.hourlyCostCents,
    burdenRateBasisPoints: item.burdenRateBasisPoints,
    availability: item.availability,
    active: item.active,
    archived: Boolean(item.archivedAt),
    updatedAt: item.updatedAt,
  })),
  operational: state.operationalSettings,
  financial: state.financialSettings,
  pricing: state.pricingSettings,
  numbering: state.numberingSettings,
  appearance: state.appearanceSettings,
});
export const numberingExample = (
  item: {
    prefix: string;
    nextNumber: number;
    digits: number;
    includeYear: boolean;
    separator: string;
  },
  year = new Date().getFullYear(),
) =>
  [
    item.prefix,
    item.includeYear ? year : "",
    String(item.nextNumber).padStart(item.digits, "0"),
  ]
    .filter(Boolean)
    .join(item.separator);
