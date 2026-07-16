import { ProfileRepository } from "./perfil-repository";
import type { ProfileState, ProfessionalDocument } from "./perfil-types";
const entry = (type: string, description: string) => ({
  id: crypto.randomUUID(),
  type,
  description,
  occurredAt: new Date().toISOString(),
});
export class ProfileService {
  constructor(private repo: ProfileRepository) {}
  list = () => this.repo.load();
  saveSection<K extends keyof ProfileState>(key: K, value: ProfileState[K]) {
    const state = this.list(),
      expected = state.revision;
    state[key] = value;
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
