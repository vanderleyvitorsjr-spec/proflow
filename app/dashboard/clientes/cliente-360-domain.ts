import { normalizeEmail, normalizeProperName, onlyDigits } from "../../../lib/br-formatters";
import type { ClientRecord } from "./clientes-data";

export type ClientContact = {
  id: string; clientId: string; name: string; role?: string; phone?: string;
  whatsapp?: string; email?: string; primary: boolean; active: boolean; notes?: string;
  createdAt: string; updatedAt: string;
};
export type ClientAddressKind = "MAIN" | "BILLING" | "SERVICE" | "DELIVERY" | "INSTALLATION" | "OTHER";
export type ClientAddress = {
  id: string; clientId: string; kind: ClientAddressKind; zipCode?: string; street: string;
  number?: string; complement?: string; district?: string; city: string; state: string;
  reference?: string; primary: boolean; active: boolean; createdAt: string; updatedAt: string;
};
export type ClientNote = { id: string; clientId: string; text: string; responsible?: string; createdAt: string };
export type ClientRelationshipState = { version: 1; contacts: ClientContact[]; addresses: ClientAddress[]; notes: ClientNote[] };
export const emptyClientRelationships = (): ClientRelationshipState => ({ version: 1, contacts: [], addresses: [], notes: [] });

export function normalizeClientContact(input: Omit<ClientContact, "id" | "createdAt" | "updatedAt">, now = new Date().toISOString()): ClientContact {
  return { ...input, id: crypto.randomUUID(), name: normalizeProperName(input.name), role: input.role ? normalizeProperName(input.role) : undefined, phone: onlyDigits(input.phone), whatsapp: onlyDigits(input.whatsapp), email: normalizeEmail(input.email), createdAt: now, updatedAt: now };
}
export function addClientContact(state: ClientRelationshipState, input: Omit<ClientContact, "id" | "createdAt" | "updatedAt">, confirmReplacePrimary = false) {
  if (!input.name.trim()) throw new Error("Informe o nome do contato.");
  const hasPrimary = state.contacts.some((item) => item.clientId === input.clientId && item.primary && item.active);
  if (input.primary && hasPrimary && !confirmReplacePrimary) throw new Error("Confirme a substituição do contato principal.");
  const contacts = input.primary
    ? state.contacts.map((item) => item.clientId === input.clientId ? { ...item, primary: false } : item)
    : state.contacts;
  return { ...state, contacts: [normalizeClientContact(input), ...contacts] };
}
export function addClientAddress(state: ClientRelationshipState, input: Omit<ClientAddress, "id" | "createdAt" | "updatedAt">) {
  if (!input.street.trim() || !input.city.trim() || input.state.trim().length !== 2) throw new Error("Informe logradouro, cidade e estado.");
  const now = new Date().toISOString();
  const addresses = input.primary ? state.addresses.map((item) => item.clientId === input.clientId ? { ...item, primary: false } : item) : state.addresses;
  return { ...state, addresses: [{ ...input, id: crypto.randomUUID(), zipCode: onlyDigits(input.zipCode), street: normalizeProperName(input.street), district: normalizeProperName(input.district), city: normalizeProperName(input.city), state: input.state.toUpperCase(), createdAt: now, updatedAt: now }, ...addresses] };
}
export function addClientNote(state: ClientRelationshipState, clientId: string, text: string, responsible?: string) {
  if (!text.trim()) throw new Error("Escreva a observação antes de salvar.");
  return { ...state, notes: [{ id: crypto.randomUUID(), clientId, text: text.trim(), responsible: responsible ? normalizeProperName(responsible) : undefined, createdAt: new Date().toISOString() }, ...state.notes] };
}
const plain = (value?: string) => value?.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]/g, "") ?? "";
export function findClientDuplicateCandidates(candidate: Pick<ClientRecord, "id" | "name" | "document" | "phone" | "email">, clients: ClientRecord[]) {
  const name = plain(candidate.name);
  return clients.filter((item) => item.id !== candidate.id).map((item) => {
    const reasons = [
      candidate.document && onlyDigits(item.document) === onlyDigits(candidate.document) ? "Mesmo CPF ou CNPJ" : "",
      candidate.phone && onlyDigits(item.phone) === onlyDigits(candidate.phone) ? "Mesmo telefone" : "",
      candidate.email && normalizeEmail(item.email) === normalizeEmail(candidate.email) ? "Mesmo e-mail" : "",
      name && plain(item.name) === name ? "Nome idêntico" : "",
      name.length > 5 && (plain(item.name).includes(name) || name.includes(plain(item.name))) ? "Nome semelhante" : "",
    ].filter(Boolean);
    return { client: item, reasons };
  }).filter((item) => item.reasons.length);
}
export function clientMergePreview(primary: ClientRecord, secondary: ClientRecord, relationships: ClientRelationshipState) {
  return {
    primaryId: primary.id, secondaryId: secondary.id,
    fields: { name: primary.name || secondary.name, document: primary.document || secondary.document, phone: primary.phone || secondary.phone, email: primary.email || secondary.email },
    contacts: relationships.contacts.filter((item) => [primary.id, secondary.id].includes(item.clientId)),
    addresses: relationships.addresses.filter((item) => [primary.id, secondary.id].includes(item.clientId)),
    safeToExecute: false,
    warning: "A execução destrutiva permanece bloqueada até todos os vínculos operacionais poderem ser atualizados de forma transacional.",
  };
}
