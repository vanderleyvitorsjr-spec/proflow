"use client";

import { centralOperationalStateRepository } from "./central-operacional-state-repository";
import {
  reopenOperationalItem,
  resolveOperationalItem,
  snoozeOperationalItem,
  updateOperationalItemState,
  type OperationalItemStateStatus,
} from "./central-operacional-state";

export const centralOperationalStateService = {
  list: () => centralOperationalStateRepository.get(),
  set(
    insightId: string,
    status: OperationalItemStateStatus,
    options?: { reason?: string; snoozedUntil?: string },
  ) {
    const current = centralOperationalStateRepository.get();
    const next = updateOperationalItemState(current, {
      insightId,
      status,
      reason: options?.reason?.trim() || undefined,
      snoozedUntil: options?.snoozedUntil,
      updatedAt: new Date().toISOString(),
      history: [],
    });
    centralOperationalStateRepository.save(next);
    return next;
  },
  snooze(input: Parameters<typeof snoozeOperationalItem>[1]) {
    const envelope = centralOperationalStateRepository.get();
    const nextItem = snoozeOperationalItem(
      envelope.items.find((item) => item.insightId === input.insightId),
      input,
    );
    const next = updateOperationalItemState(envelope, nextItem);
    centralOperationalStateRepository.save(next);
    return next;
  },
  resolve(input: Parameters<typeof resolveOperationalItem>[1]) {
    const envelope = centralOperationalStateRepository.get();
    const nextItem = resolveOperationalItem(
      envelope.items.find((item) => item.insightId === input.insightId),
      input,
    );
    const next = updateOperationalItemState(envelope, nextItem);
    centralOperationalStateRepository.save(next);
    return next;
  },
  reopen(insightId: string, reason: string, responsible?: string) {
    const envelope = centralOperationalStateRepository.get();
    const current = envelope.items.find((item) => item.insightId === insightId);
    if (!current) throw new Error("Histórico da pendência não encontrado.");
    const next = updateOperationalItemState(
      envelope,
      reopenOperationalItem(current, reason, responsible),
    );
    centralOperationalStateRepository.save(next);
    return next;
  },
};
