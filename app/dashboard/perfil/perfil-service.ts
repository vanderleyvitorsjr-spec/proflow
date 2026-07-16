import { ProfileRepository } from "./perfil-repository";
import type { ProfileState, ProfessionalDocument, UserProfile } from "./perfil-types";
import { isValidCpf, normalizeProperName, normalizeUpperCode, onlyDigits } from "@/lib/br-formatters";
const entry = (type: string, description: string) => ({
  id: crypto.randomUUID(),
  type,
  description,
  occurredAt: new Date().toISOString(),
});
function normalizeProfile(profile: UserProfile): UserProfile {
  const document = onlyDigits(profile.document);
  if (document && !isValidCpf(document)) throw new Error("Informe um CPF válido.");
  const phone = onlyDigits(profile.phone);
  const whatsapp = onlyDigits(profile.whatsapp);
  if (phone && ![10, 11].includes(phone.length)) throw new Error("Informe um telefone com DDD válido.");
  if (whatsapp && ![10, 11].includes(whatsapp.length)) throw new Error("Informe um WhatsApp com DDD válido.");
  return {
    ...profile,
    fullName: normalizeProperName(profile.fullName),
    displayName: normalizeProperName(profile.displayName || profile.fullName),
    preferredName: normalizeProperName(profile.preferredName),
    role: normalizeProperName(profile.role),
    specialties: profile.specialties.map(normalizeProperName).filter(Boolean),
    phone: phone || undefined,
    whatsapp: whatsapp || undefined,
    document: document || undefined,
    professionalRegistration: normalizeUpperCode(profile.professionalRegistration) || undefined,
    zipCode: onlyDigits(profile.zipCode) || undefined,
    street: normalizeProperName(profile.street) || undefined,
    district: normalizeProperName(profile.district) || undefined,
    city: normalizeProperName(profile.city) || undefined,
    state: normalizeUpperCode(profile.state).slice(0, 2) || undefined,
  };
}

export class ProfileService {
  constructor(private repo: ProfileRepository) {}
  list = () => this.repo.load();
  saveSection<K extends keyof ProfileState>(key: K, value: ProfileState[K]) {
    const state = this.list(),
      expected = state.revision;
    state[key] = (key === "profile" ? normalizeProfile(value as UserProfile) : value) as ProfileState[K];
    state.revision++;
    state.history.push(entry("SECTION_UPDATED", `${String(key)} atualizado.`));
    this.repo.save(state, expected);
    return state;
  }
  saveDocument(
    input: Omit<ProfessionalDocument, "id" | "createdAt" | "updatedAt" | "history">,
    id?: string,
  ) {
    const state = this.list(),
      expected = state.revision,
      now = new Date().toISOString(),
      index = state.professionalDocuments.findIndex((x) => x.id === id);
    if (index >= 0)
      state.professionalDocuments[index] = {
        ...state.professionalDocuments[index],
        ...input,
        updatedAt: now,
        history: [
          ...state.professionalDocuments[index].history,
          entry("UPDATED", "Documento editado."),
        ],
      };
    else
      state.professionalDocuments.push({
        ...input,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        history: [entry("CREATED", "Documento criado.")],
      });
    state.revision++;
    state.history.push(entry("DOCUMENT_UPDATED", "Documento profissional alterado."));
    this.repo.save(state, expected);
    return state;
  }
  export = () => JSON.stringify(this.list(), null, 2);
  import(raw: string) {
    const value = JSON.parse(raw) as ProfileState;
    if (value.version !== 1) throw new Error("Versão de Perfil incompatível.");
    const current = this.list();
    value.revision = current.revision + 1;
    value.history = [...current.history, entry("IMPORTED", "Perfil importado.")];
    this.repo.save(value, current.revision);
    return value;
  }
}
