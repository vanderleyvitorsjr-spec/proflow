import { FinancialDomainError } from "./financeiro-errors";
import type { FinancialStorageAdapter } from "./financeiro-storage-adapter";
import type {
  FinancialAccount,
  FinancialStorageState,
  FinancialTransaction,
} from "./financeiro-types";
export class FinancialRepository {
  constructor(private readonly storage: FinancialStorageAdapter) {}
  readState() {
    return this.storage.read();
  }
  async saveState(state: FinancialStorageState) {
    return this.storage.write(state);
  }
  async findAccount(id: string, includeArchived = false) {
    return (
      (await this.readState()).accounts.find(
        (item) => item.id === id && (includeArchived || !item.archivedAt),
      ) ?? null
    );
  }
  async findTransaction(id: string, includeArchived = false) {
    return (
      (await this.readState()).transactions.find(
        (item) => item.id === id && (includeArchived || !item.archivedAt),
      ) ?? null
    );
  }
  async saveAccount(account: FinancialAccount) {
    const state = await this.readState(),
      exists = state.accounts.some((item) => item.id === account.id);
    return this.saveState({
      ...state,
      accounts: exists
        ? state.accounts.map((item) => (item.id === account.id ? account : item))
        : [account, ...state.accounts],
    });
  }
  async saveTransaction(transaction: FinancialTransaction, incrementSequence = false) {
    const state = await this.readState(),
      exists = state.transactions.some((item) => item.id === transaction.id);
    return this.saveState({
      ...state,
      nextSequence: incrementSequence ? state.nextSequence + 1 : state.nextSequence,
      transactions: exists
        ? state.transactions.map((item) =>
            item.id === transaction.id ? transaction : item,
          )
        : [transaction, ...state.transactions],
    });
  }
  async nextSequence() {
    const state = await this.readState();
    if (!Number.isSafeInteger(state.nextSequence))
      throw new FinancialDomainError("STORAGE", "Sequência financeira inválida.");
    return state.nextSequence;
  }
}
