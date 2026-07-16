export type FinancialErrorCode =
  "VALIDATION" | "NOT_FOUND" | "DUPLICATE" | "CONFLICT" | "STORAGE" | "UNKNOWN";
export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: FinancialErrorCode;
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };
