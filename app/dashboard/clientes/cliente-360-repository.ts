import type { ClientRelationshipState } from "./cliente-360-domain";
import { clientRelationshipStorage } from "./cliente-360-storage-adapter";
export class ClientRelationshipRepository {
  load() { return clientRelationshipStorage.load(); }
  save(state: ClientRelationshipState) { return clientRelationshipStorage.save(state); }
}
