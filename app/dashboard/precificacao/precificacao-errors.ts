export class PricingDomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "PricingDomainError";
  }
}
