export class StockDomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}
export class StockStorageError extends Error {}
