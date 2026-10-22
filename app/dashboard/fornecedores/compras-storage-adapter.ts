"use client";
import { readRemoteModuleState, writeRemoteModuleState } from "@/lib/module-state/remote-module-state";
import { emptyPurchases, type PurchasesEnvelope } from "./compras-domain";

const MODULE = "compras";

const isValid = (value: unknown): value is PurchasesEnvelope => {
  const candidate = value as Partial<PurchasesEnvelope> | null;
  return Boolean(candidate && candidate.version === 1 && Array.isArray(candidate.quotations) && Array.isArray(candidate.orders));
};

// Acrescenta Cotações e Pedidos que só existem neste navegador. Nunca remove nada do servidor.
function mergeLocalPurchases(remote: unknown, local: unknown): unknown {
  if (!isValid(remote) || !isValid(local)) return null;
  const quotationIds = new Set(remote.quotations.map((item) => item.id));
  const orderIds = new Set(remote.orders.map((item) => item.id));
  const quotations = local.quotations.filter((item) => !quotationIds.has(item.id));
  const orders = local.orders.filter((item) => !orderIds.has(item.id));
  if (!quotations.length && !orders.length) return null;
  return {
    ...remote,
    quotations: [...remote.quotations, ...quotations],
    orders: [...remote.orders, ...orders],
    nextQuotationSequence: Math.max(remote.nextQuotationSequence, local.nextQuotationSequence),
    nextOrderSequence: Math.max(remote.nextOrderSequence, local.nextOrderSequence),
  };
}

/**
 * Cotações e Pedidos de Compra ficam no servidor, por empresa.
 *
 * O serviço de Compras é síncrono; por isso este adapter mantém uma cópia em
 * memória. Cada ação pública chama `ready()` antes (recarrega do servidor) e
 * `flush()` depois (aguarda a gravação e propaga erros para a tela).
 */
let cache: PurchasesEnvelope | null = null;
let lastWrite: Promise<unknown> = Promise.resolve();

export const purchasesStorageAdapter = {
  async ready() {
    await lastWrite.catch(() => undefined);
    const value = await readRemoteModuleState<unknown>(MODULE, emptyPurchases(), { mergeLegacy: mergeLocalPurchases });
    cache = isValid(value) ? value : emptyPurchases();
  },
  load(): PurchasesEnvelope {
    if (!cache) throw new Error("Os dados de Compras ainda não foram carregados. Recarregue a página.");
    return cache;
  },
  save(value: PurchasesEnvelope) {
    cache = value;
    lastWrite = lastWrite.catch(() => undefined).then(() => writeRemoteModuleState(MODULE, value));
  },
  async flush() {
    await lastWrite;
  },
};
