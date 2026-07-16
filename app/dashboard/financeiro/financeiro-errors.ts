import type { FinancialErrorCode } from "./financeiro-result";
export class FinancialDomainError extends Error {
  constructor(
    public readonly code: FinancialErrorCode,
    message: string,
  ) {
    super(message);
  }
}
export class FinancialStorageError extends FinancialDomainError {
  constructor(message: string) {
    super("STORAGE", message);
  }
}
