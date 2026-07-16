import type { ClientPublicReference } from "@/lib/contracts/clientes.contract";
import type { ReportClient } from "@/lib/contracts/relatorios-clientes.contract";
import type { ClientFormValues } from "./cliente-schema";
import { ClientsRepository } from "./clientes-repository";
import { ClientsService } from "./clientes-service";
import { clientsStorageAdapter } from "./clientes-storage-adapter";

const clientsService = new ClientsService(new ClientsRepository(clientsStorageAdapter));
export const listClientsAction = () => clientsService.listClients();
export const getClientAction = (id: string) => clientsService.getClient(id);
export const createClientAction = (input: ClientFormValues) =>
  clientsService.createClient(input);
export const updateClientAction = (id: string, input: ClientFormValues) =>
  clientsService.updateClient(id, input);
export const deleteClientAction = (id: string) => clientsService.deleteClient(id);
const publicReference = (
  client:
    Awaited<ReturnType<typeof clientsStorageAdapter.list>>[number] | null | undefined,
): ClientPublicReference | null =>
  client
    ? {
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        archived: Boolean(client.deletedAt),
        updatedAt: client.updatedAt,
      }
    : null;
export const getClientPublicReferenceAction = async (id: string) =>
  publicReference(
    (await clientsStorageAdapter.list()).find((client) => client.id === id),
  );
export const listActiveClientPublicReferencesAction = async () =>
  (await clientsStorageAdapter.list())
    .filter((client) => !client.deletedAt)
    .map((client) => publicReference(client) as ClientPublicReference);
export const clientExistsPublicAction = async (id: string) =>
  (await clientsStorageAdapter.list()).some((client) => client.id === id);
export const clientArchivedPublicAction = async (id: string) =>
  Boolean(
    (await clientsStorageAdapter.list()).find((client) => client.id === id)?.deletedAt,
  );
export const listClientsReportAction = async (): Promise<ReportClient[]> =>
  (await clientsService.listClients()).map((client) => ({
    id: client.id, name: client.name, createdAt: client.createdAt,
    updatedAt: client.updatedAt, deletedAt: client.deletedAt,
    lastInteractionAt: client.lastInteractionAt, status: client.status,
    segment: client.segment, city: client.city, state: client.state,
  }));
