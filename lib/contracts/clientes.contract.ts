export type ClientPublicReference = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  archived: boolean;
};
export interface ClientesPublicContract {
  getReference(id: string): Promise<ClientPublicReference | null>;
  listActiveReferences(): Promise<ClientPublicReference[]>;
  exists(id: string): Promise<boolean>;
  isArchived(id: string): Promise<boolean>;
}
