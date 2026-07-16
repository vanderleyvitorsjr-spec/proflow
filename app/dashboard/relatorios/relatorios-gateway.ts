import type { GatewayResult, ReportSource } from "./relatorios-types";
export async function runGateway<T>(
  source: ReportSource,
  load: () => Promise<T>,
  count: (data: T) => number,
  updatedAt?: (data: T) => string | undefined,
): Promise<GatewayResult<T>> {
  const started = performance.now();
  try {
    const data = await load();
    return {
      data,
      status: {
        source,
        available: true,
        partial: false,
        recordCount: count(data),
        updatedAt: updatedAt?.(data) ?? new Date().toISOString(),
        executionTimeMs: Math.round(performance.now() - started),
        warnings: [],
      },
    };
  } catch (cause) {
    return {
      status: {
        source,
        available: false,
        partial: false,
        recordCount: 0,
        executionTimeMs: Math.round(performance.now() - started),
        error: cause instanceof Error ? cause.message : "Fonte indisponível.",
        warnings: [],
      },
    };
  }
}
export function unwrap<T>(
  result: { ok: true; data: T } | { ok: false; error: { message: string } },
): T {
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
