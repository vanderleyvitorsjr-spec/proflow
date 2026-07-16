export class ConfigurationError extends Error {
  constructor(
    public code:
      "CORRUPTED" | "REVISION_CONFLICT" | "DUPLICATE" | "NOT_FOUND" | "VALIDATION",
    message: string,
  ) {
    super(message);
  }
}
