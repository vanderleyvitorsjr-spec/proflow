"use client";

import { centralOperationalStateService } from "./central-operacional-state-service";
import type { OperationalItemStateStatus } from "./central-operacional-state";

export const listOperationalItemStatesAction = () =>
  Promise.resolve(centralOperationalStateService.list());

export const updateOperationalItemStateAction = (
  insightId: string,
  status: OperationalItemStateStatus,
  options?: { reason?: string; snoozedUntil?: string },
) => Promise.resolve(centralOperationalStateService.set(insightId, status, options));

export const snoozeOperationalItemAction = (
  input: Parameters<typeof centralOperationalStateService.snooze>[0],
) => Promise.resolve(centralOperationalStateService.snooze(input));

export const resolveOperationalItemAction = (
  input: Parameters<typeof centralOperationalStateService.resolve>[0],
) => Promise.resolve(centralOperationalStateService.resolve(input));

export const reopenOperationalItemAction = (
  insightId: string,
  reason: string,
  responsible?: string,
) => Promise.resolve(centralOperationalStateService.reopen(insightId, reason, responsible));
