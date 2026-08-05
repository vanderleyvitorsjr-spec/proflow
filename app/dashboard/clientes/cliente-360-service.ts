import { addClientAddress, addClientContact, addClientNote } from "./cliente-360-domain";
import { ClientRelationshipRepository } from "./cliente-360-repository";
export class ClientRelationshipService {
  constructor(private readonly repository = new ClientRelationshipRepository()) {}
  list(clientId: string) { const state = this.repository.load(); return { contacts: state.contacts.filter((x) => x.clientId === clientId), addresses: state.addresses.filter((x) => x.clientId === clientId), notes: state.notes.filter((x) => x.clientId === clientId) }; }
  addContact(input: Parameters<typeof addClientContact>[1], confirm = false) { return this.repository.save(addClientContact(this.repository.load(), input, confirm)); }
  addAddress(input: Parameters<typeof addClientAddress>[1]) { return this.repository.save(addClientAddress(this.repository.load(), input)); }
  addNote(clientId: string, text: string, responsible?: string) { return this.repository.save(addClientNote(this.repository.load(), clientId, text, responsible)); }
}
export const clientRelationshipService = new ClientRelationshipService();
