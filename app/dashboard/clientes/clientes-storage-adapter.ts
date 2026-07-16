import { clients as initialClients, type ClientRecord } from "./clientes-data";

export interface ClientsStorageAdapter {
  list(): Promise<ClientRecord[]>;
  replace(records: ClientRecord[]): Promise<void>;
}

const STORAGE_KEY = "proflow:clientes:v1";

export class LocalClientsStorageAdapter implements ClientsStorageAdapter {
  async list() {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      await this.replace(initialClients);
      return structuredClone(initialClients);
    }
    try {
      return JSON.parse(stored) as ClientRecord[];
    } catch {
      throw new Error("Não foi possível ler os clientes armazenados neste dispositivo.");
    }
  }

  async replace(records: ClientRecord[]) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      throw new Error("Não foi possível salvar os clientes neste dispositivo.");
    }
  }
}

export const clientsStorageAdapter: ClientsStorageAdapter = new LocalClientsStorageAdapter();
