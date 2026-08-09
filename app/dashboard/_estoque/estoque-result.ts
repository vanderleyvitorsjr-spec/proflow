export type StockActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: { code: string; message: string; fieldErrors?: Record<string, string[]> };
    };
