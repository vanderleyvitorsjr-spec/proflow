import { addClientAddress, addClientContact, addClientNote } from "./cliente-360-domain";
import { ClientRelationshipRepository } from "./cliente-360-repository";

export class ClientRelationshipService {
  constructor(private readonly repository = new ClientRelationshipRepository()) {}

  async list(clientId: string) {
    const state = await this.repository.load();
    return {
      contacts: state.contacts.filter((x) => x.clientId === clientId),
      addresses: state.addresses.filter((x) => x.clientId === clientId),
      notes: state.notes.filter((x) => x.clientId === clientId),
    };
  }

  async addContact(input: Parameters<typeof addClientContact>[1], confirm = false) {
    const state = await this.repository.load();
    return this.repository.save(addClientContact(state, input, confirm));
  }

  async addAddress(input: Parameters<typeof addClientAddress>[1]) {
    const state = await this.repository.load();
    return this.repository.save(addClientAddress(state, input));
  }

  async addNote(clientId: string, text: string, responsible?: string) {
    const state = await this.repository.load();
    return this.repository.save(addClientNote(state, clientId, text, responsible));
  }
}

export const clientRelationshipService = new ClientRelationshipService();
