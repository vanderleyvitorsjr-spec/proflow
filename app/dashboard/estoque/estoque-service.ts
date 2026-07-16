import { ZodError } from "zod";
import { StockDomainError } from "./estoque-errors";
import type { StockRepository } from "./estoque-repository";
import {
  stockItemFormSchema,
  stockMovementFormSchema,
  stockReservationFormSchema,
  stockReservationOperationSchema,
  stockPurchaseFinancialFormSchema,
  stockPurchaseFormSchema,
  stockPurchaseReceiptSchema,
  type StockItemFormValues,
  type StockMovementFormValues,
  type StockReservationFormValues,
  type StockReservationOperationValues,
  type StockPurchaseFinancialFormValues,
  type StockPurchaseFormValues,
  type StockPurchaseReceiptValues,
} from "./estoque-schema";
import {
  calculateStock,
  hasNegativeBalance,
  movementSign,
  reservationRemaining,
  reservationStatus,
} from "./estoque-selectors";
import { stockOrdersGateway } from "./estoque-ordens-gateway";
import { stockFinanceGateway } from "./estoque-financeiro-gateway";
import { stockUnitLabels } from "./estoque-data";
import type {
  StockHistoryEvent,
  StockItem,
  StockMovement,
  StockPreferences,
  StockReservation,
  StockReservationDivergence,
  StockSnapshot,
  StockPurchase,
  StockPurchaseFinancialSnapshot,
  StockPurchaseReconciliation,
} from "./estoque-types";

const normalize = (value: string) => value.trim().toLocaleLowerCase("pt-BR");
const event = (
  type: StockHistoryEvent["type"],
  description: string,
): StockHistoryEvent => ({
  id: crypto.randomUUID(),
  type,
  description,
  createdAt: new Date().toISOString(),
});
export class StockService {
  constructor(private repo: StockRepository) {}
  async list(): Promise<StockSnapshot[]> {
    const state = await this.repo.read();
    return state.items.map((item) =>
      calculateStock(item, state.movements, state.reservations),
    );
  }
  async get(id: string) {
    const state = await this.repo.read(),
      item = state.items.find((i) => i.id === id);
    return item ? calculateStock(item, state.movements, state.reservations) : null;
  }
  async state() {
    return this.repo.read();
  }
  private async unique(
    internalCode: string,
    barcode: string | undefined,
    ignoreId?: string,
  ) {
    const state = await this.repo.read();
    const code = normalize(internalCode),
      bar = barcode?.trim();
    const conflict = state.items.find(
      (item) =>
        item.id !== ignoreId &&
        (normalize(item.internalCode) === code || (bar && item.barcode === bar)),
    );
    if (conflict)
      throw new StockDomainError(
        "DUPLICATE",
        `${normalize(conflict.internalCode) === code ? "Código interno" : "Código de barras"} já utilizado por ${conflict.archivedAt ? "um item arquivado" : "outro item"}.`,
      );
  }
  private quantity(value: number, scale: number) {
    const result = value * scale;
    if (!Number.isInteger(result))
      throw new StockDomainError(
        "VALIDATION",
        `Use no máximo ${Math.log10(scale)} casas decimais para esta unidade.`,
      );
    return result;
  }
  async create(input: StockItemFormValues) {
    const value = stockItemFormSchema.parse(input);
    await this.unique(value.internalCode, value.barcode);
    const state = await this.repo.read(),
      now = new Date().toISOString();
    const item: StockItem = {
      id: crypto.randomUUID(),
      sequence: state.nextItemSequence,
      internalCode: value.internalCode,
      name: value.name,
      description: value.description,
      category: value.category,
      unit: value.unit,
      unitScale: value.unitScale,
      barcode: value.barcode || undefined,
      manufacturer: value.manufacturer || undefined,
      supplierReference: value.supplierReference || undefined,
      minimumQuantity: this.quantity(value.minimumQuantity, value.unitScale),
      location: {
        name: value.locationName,
        room: value.locationRoom || undefined,
        container: value.locationContainer || undefined,
        description: value.locationDescription || undefined,
      },
      notes: value.notes || undefined,
      active: true,
      createdAt: now,
      updatedAt: now,
      history: [event("CREATED", "Item cadastrado.")],
    };
    await this.repo.save({
      ...state,
      nextItemSequence: state.nextItemSequence + 1,
      items: [item, ...state.items],
    });
    const similar = state.items.find(
      (i) => normalize(i.name) === normalize(item.name) && i.unit === item.unit,
    );
    return {
      item,
      warning: similar
        ? `Já existe um item com nome e unidade semelhantes: ${similar.internalCode}.`
        : undefined,
    };
  }
  async update(id: string, input: StockItemFormValues) {
    const value = stockItemFormSchema.parse(input),
      state = await this.repo.read(),
      current = state.items.find((i) => i.id === id);
    if (!current) throw new StockDomainError("NOT_FOUND", "Item não encontrado.");
    await this.unique(value.internalCode, value.barcode, id);
    if (current.unit !== value.unit && state.movements.some((m) => m.itemId === id))
      throw new StockDomainError(
        "CONFLICT",
        "A unidade não pode ser alterada depois da existência de movimentos.",
      );
    const now = new Date().toISOString(),
      item: StockItem = {
        ...current,
        internalCode: value.internalCode,
        name: value.name,
        description: value.description,
        category: value.category,
        unit: value.unit,
        unitScale: value.unitScale,
        barcode: value.barcode || undefined,
        manufacturer: value.manufacturer || undefined,
        supplierReference: value.supplierReference || undefined,
        minimumQuantity: this.quantity(value.minimumQuantity, value.unitScale),
        location: {
          name: value.locationName,
          room: value.locationRoom || undefined,
          container: value.locationContainer || undefined,
          description: value.locationDescription || undefined,
        },
        notes: value.notes || undefined,
        updatedAt: now,
        history: [...current.history, event("UPDATED", "Dados cadastrais atualizados.")],
      };
    await this.repo.save({
      ...state,
      items: state.items.map((i) => (i.id === id ? item : i)),
    });
    return item;
  }
  async archive(id: string, reason: string) {
    const state = await this.repo.read(),
      current = state.items.find((i) => i.id === id);
    if (!current) throw new StockDomainError("NOT_FOUND", "Item não encontrado.");
    if (current.archivedAt) return current;
    const now = new Date().toISOString(),
      item = {
        ...current,
        active: false,
        archivedAt: now,
        updatedAt: now,
        history: [
          ...current.history,
          event(
            "ARCHIVED",
            `Item arquivado.${reason.trim() ? ` Motivo: ${reason.trim()}` : ""}`,
          ),
        ],
      };
    await this.repo.save({
      ...state,
      items: state.items.map((i) => (i.id === id ? item : i)),
    });
    return item;
  }
  async createMovement(input: StockMovementFormValues) {
    const value = stockMovementFormSchema.parse(input),
      state = await this.repo.read(),
      item = state.items.find((i) => i.id === value.itemId);
    if (!item) throw new StockDomainError("NOT_FOUND", "Item não encontrado.");
    if (item.archivedAt)
      throw new StockDomainError(
        "CONFLICT",
        "Itens arquivados não aceitam novos movimentos.",
      );
    const quantity = this.quantity(value.quantity, item.unitScale),
      prior = calculateStock(
        item,
        state.movements.filter((m) => m.date <= value.date),
      );
    const subtract = movementSign(value.type) < 0;
    if (
      subtract &&
      quantity > prior.physicalQuantity &&
      !(value.type === "ADJUSTMENT_OUT" && value.allowNegativeAdjustment)
    )
      throw new StockDomainError(
        "INSUFFICIENT_STOCK",
        "A quantidade informada ultrapassa o saldo físico na data do movimento.",
      );
    let unitCostCents = 0;
    if (subtract) unitCostCents = prior.averageCostCents;
    else if (value.type === "RETURN" && value.originalMovementId) {
      const original = state.movements.find(
        (m) => m.id === value.originalMovementId && m.itemId === item.id,
      );
      if (!original)
        throw new StockDomainError("NOT_FOUND", "Movimento original não encontrado.");
      unitCostCents = original.unitCostCents;
    } else if (value.useAverageCost) unitCostCents = prior.averageCostCents;
    else unitCostCents = Math.round(value.unitCost * 100);
    if (!subtract && unitCostCents === 0 && !value.confirmZeroCost)
      throw new StockDomainError(
        "CONFIRMATION_REQUIRED",
        "Confirme explicitamente a entrada sem custo.",
      );
    const now = new Date().toISOString(),
      movement: StockMovement = {
        id: crypto.randomUUID(),
        itemId: item.id,
        type: value.type,
        quantity,
        unitCostCents,
        totalCostCents: Math.round((quantity * unitCostCents) / item.unitScale),
        date: value.date,
        source: "MANUAL",
        reason: value.reason,
        notes: value.notes || undefined,
        originalMovementId: value.originalMovementId || undefined,
        createdAt: now,
        history: [
          {
            id: crypto.randomUUID(),
            description: "Movimento registrado.",
            createdAt: now,
          },
        ],
      };
    const movements = [...state.movements, movement];
    if (
      hasNegativeBalance(item, movements) &&
      !(value.type === "ADJUSTMENT_OUT" && value.allowNegativeAdjustment)
    )
      throw new StockDomainError(
        "INSUFFICIENT_STOCK",
        "O movimento deixaria o estoque negativo durante o replay cronológico.",
      );
    const updated = {
      ...item,
      updatedAt: now,
      history: [
        ...item.history,
        event("MOVEMENT_CREATED", `${value.type}: ${value.reason}.`),
      ],
    };
    await this.repo.save({
      ...state,
      movements,
      items: state.items.map((i) => (i.id === item.id ? updated : i)),
    });
    return calculateStock(updated, movements, state.reservations);
  }
  async cancelMovement(id: string, reason: string) {
    if (reason.trim().length < 3)
      throw new StockDomainError("VALIDATION", "Informe o motivo do cancelamento.");
    const state = await this.repo.read(),
      current = state.movements.find((m) => m.id === id);
    if (!current) throw new StockDomainError("NOT_FOUND", "Movimento não encontrado.");
    if (current.canceledAt)
      throw new StockDomainError("CONFLICT", "Movimento já cancelado.");
    const item = state.items.find((i) => i.id === current.itemId);
    if (!item) throw new StockDomainError("NOT_FOUND", "Item não encontrado.");
    const now = new Date().toISOString(),
      movement = {
        ...current,
        canceledAt: now,
        history: [
          ...current.history,
          {
            id: crypto.randomUUID(),
            description: `Cancelado: ${reason.trim()}`,
            createdAt: now,
          },
        ],
      },
      movements = state.movements.map((m) => (m.id === id ? movement : m));
    if (hasNegativeBalance(item, movements))
      throw new StockDomainError(
        "CONFLICT",
        "O cancelamento deixaria o saldo histórico negativo. Cancele ou ajuste os movimentos posteriores primeiro.",
      );
    const updated = {
      ...item,
      updatedAt: now,
      history: [
        ...item.history,
        event(
          "MOVEMENT_CANCELED",
          `Movimento ${current.type} cancelado: ${reason.trim()}.`,
        ),
      ],
    };
    let reservations = state.reservations;
    if (current.type === "CONSUMPTION" && current.reservationId) {
      reservations = state.reservations.map((reservation) => {
        if (reservation.id !== current.reservationId) return reservation;
        const consumedQuantity = movements
          .filter(
            (candidate) =>
              candidate.type === "CONSUMPTION" &&
              candidate.reservationId === reservation.id &&
              !candidate.canceledAt,
          )
          .reduce((sum, candidate) => sum + candidate.quantity, 0);
        const recalculated = { ...reservation, consumedQuantity, updatedAt: now };
        return {
          ...recalculated,
          status: reservationStatus(recalculated),
          history: [
            ...reservation.history,
            this.reservationEvent(
              "CONSUMPTION_CANCELED",
              `Consumo cancelado: ${reason.trim()}.`,
            ),
          ],
        };
      });
    }
    let purchases = state.purchases;
    if (current.type === "ENTRY" && current.purchaseId && current.purchaseItemId) {
      purchases = state.purchases.map((purchase) => {
        if (purchase.id !== current.purchaseId) return purchase;
        const items = purchase.items.map((purchaseItem) => {
          if (purchaseItem.id !== current.purchaseItemId) return purchaseItem;
          const receivedQuantity = movements
            .filter(
              (candidate) =>
                candidate.type === "ENTRY" &&
                candidate.purchaseItemId === purchaseItem.id &&
                !candidate.canceledAt,
            )
            .reduce((sum, candidate) => sum + candidate.quantity, 0);
          return { ...purchaseItem, receivedQuantity };
        });
        const receivedTotalCents = items.reduce(
          (sum, purchaseItem) =>
            sum +
            Math.round(
              (purchaseItem.receivedQuantity * purchaseItem.unitCostCents) /
                purchaseItem.unitScaleSnapshot,
            ),
          0,
        );
        const receivedAnything = items.some(
            (purchaseItem) => purchaseItem.receivedQuantity > 0,
          ),
          complete = items.every(
            (purchaseItem) =>
              purchaseItem.receivedQuantity >= purchaseItem.orderedQuantity,
          );
        return {
          ...purchase,
          items,
          receivedTotalCents,
          status: complete
            ? ("RECEIVED" as const)
            : receivedAnything
              ? ("PARTIALLY_RECEIVED" as const)
              : ("ORDERED" as const),
          updatedAt: now,
          history: [
            ...purchase.history,
            this.purchaseEvent(
              "RECEIPT_CANCELED",
              `Recebimento cancelado: ${reason.trim()}.`,
            ),
          ],
        };
      });
    }
    await this.repo.save({
      ...state,
      movements,
      reservations,
      purchases,
      items: state.items.map((i) => (i.id === item.id ? updated : i)),
    });
    return calculateStock(updated, movements, reservations);
  }
  private reservationEvent(type: string, description: string) {
    return {
      id: crypto.randomUUID(),
      type,
      description,
      createdAt: new Date().toISOString(),
    };
  }
  async listOrders() {
    return stockOrdersGateway.list();
  }
  async createReservation(input: StockReservationFormValues) {
    const value = stockReservationFormSchema.parse(input),
      state = await this.repo.read(),
      item = state.items.find((i) => i.id === value.itemId);
    if (!item || item.archivedAt)
      throw new StockDomainError("CONFLICT", "Item indisponível para reserva.");
    const order = await stockOrdersGateway.requireEligible(value.serviceOrderId),
      quantity = this.quantity(value.quantity, item.unitScale);
    const key = `STOCK_RESERVATION:${order.id}:${item.id}:${normalize(value.purpose)}`;
    const existing = state.reservations.find((r) => r.idempotencyKey === key);
    if (existing)
      return {
        reservation: existing,
        existing: true,
        blocked: reservationRemaining(existing) <= 0,
      };
    const snapshot = calculateStock(item, state.movements, state.reservations);
    if (quantity > snapshot.availableQuantity)
      throw new StockDomainError(
        "INSUFFICIENT_STOCK",
        "A reserva ultrapassa a quantidade disponível.",
      );
    const now = new Date().toISOString(),
      reservation: StockReservation = {
        id: crypto.randomUUID(),
        itemId: item.id,
        serviceOrderId: order.id,
        serviceOrderNumberSnapshot: order.number,
        serviceOrderTitleSnapshot: order.title,
        serviceOrderUpdatedAtSnapshot: order.updatedAt,
        purpose: value.purpose,
        quantity,
        consumedQuantity: 0,
        releasedQuantity: 0,
        status: "ACTIVE",
        idempotencyKey: key,
        createdAt: now,
        updatedAt: now,
        history: [this.reservationEvent("CREATED", "Reserva criada.")],
      };
    const updated = {
      ...item,
      updatedAt: now,
      history: [
        ...item.history,
        event(
          "RESERVATION_CREATED",
          `Reserva criada para ${order.number}: ${value.purpose}.`,
        ),
      ],
    };
    await this.repo.save({
      ...state,
      reservations: [reservation, ...state.reservations],
      items: state.items.map((i) => (i.id === item.id ? updated : i)),
    });
    return { reservation, existing: false, blocked: false };
  }
  async consumeReservation(input: StockReservationOperationValues) {
    const value = stockReservationOperationSchema.parse(input),
      state = await this.repo.read(),
      reservation = state.reservations.find((r) => r.id === value.reservationId),
      now = new Date().toISOString();
    if (!reservation) throw new StockDomainError("NOT_FOUND", "Reserva não encontrada.");
    const item = state.items.find((i) => i.id === reservation.itemId);
    if (!item) throw new StockDomainError("NOT_FOUND", "Item não encontrado.");
    const quantity = this.quantity(value.quantity, item.unitScale),
      remaining = reservationRemaining(reservation),
      snapshot = calculateStock(item, state.movements, state.reservations);
    if (quantity > remaining && !value.administrative)
      throw new StockDomainError("CONFLICT", "O consumo ultrapassa o saldo reservado.");
    if (quantity > snapshot.physicalQuantity)
      throw new StockDomainError(
        "INSUFFICIENT_STOCK",
        "O consumo ultrapassa o saldo físico.",
      );
    const unitCostCents = snapshot.averageCostCents,
      movement: StockMovement = {
        id: crypto.randomUUID(),
        itemId: item.id,
        type: "CONSUMPTION",
        quantity,
        unitCostCents,
        totalCostCents: Math.round((quantity * unitCostCents) / item.unitScale),
        date: now.slice(0, 10),
        source: "SERVICE_ORDER",
        sourceId: reservation.serviceOrderId,
        serviceOrderId: reservation.serviceOrderId,
        reservationId: reservation.id,
        reason: value.reason,
        createdAt: now,
        history: [
          {
            id: crypto.randomUUID(),
            description: "Consumo vinculado à reserva.",
            createdAt: now,
          },
        ],
      };
    const consumedQuantity = reservation.consumedQuantity + quantity,
      next = {
        ...reservation,
        consumedQuantity,
        updatedAt: now,
        status: reservationStatus({ ...reservation, consumedQuantity }),
        history: [
          ...reservation.history,
          this.reservationEvent(
            value.administrative && quantity > remaining
              ? "OVER_CONSUMPTION"
              : "CONSUMPTION",
            `${value.administrative && quantity > remaining ? "Consumo administrativo" : "Consumo"} de ${value.quantity}.`,
          ),
        ],
      };
    const updated = {
      ...item,
      updatedAt: now,
      history: [
        ...item.history,
        event(
          value.administrative && quantity > remaining
            ? "RESERVATION_DIVERGENCE"
            : "RESERVATION_UPDATED",
          `Consumo registrado para ${reservation.serviceOrderNumberSnapshot}.`,
        ),
      ],
    };
    await this.repo.save({
      ...state,
      movements: [...state.movements, movement],
      reservations: state.reservations.map((r) => (r.id === next.id ? next : r)),
      items: state.items.map((i) => (i.id === item.id ? updated : i)),
    });
    return next;
  }
  async releaseReservation(input: StockReservationOperationValues) {
    const value = stockReservationOperationSchema.parse(input),
      state = await this.repo.read(),
      reservation = state.reservations.find((r) => r.id === value.reservationId);
    if (!reservation) throw new StockDomainError("NOT_FOUND", "Reserva não encontrada.");
    const item = state.items.find((i) => i.id === reservation.itemId);
    if (!item) throw new StockDomainError("NOT_FOUND", "Item não encontrado.");
    const quantity = this.quantity(value.quantity, item.unitScale),
      remaining = reservationRemaining(reservation);
    if (quantity > remaining)
      throw new StockDomainError("CONFLICT", "A liberação ultrapassa o saldo reservado.");
    const now = new Date().toISOString(),
      releasedQuantity = reservation.releasedQuantity + quantity,
      next = {
        ...reservation,
        releasedQuantity,
        updatedAt: now,
        status: reservationStatus({ ...reservation, releasedQuantity }),
        history: [
          ...reservation.history,
          this.reservationEvent(
            "RELEASE",
            `Liberação de ${value.quantity}: ${value.reason}.`,
          ),
        ],
      };
    await this.repo.save({
      ...state,
      reservations: state.reservations.map((r) => (r.id === next.id ? next : r)),
      items: state.items.map((i) =>
        i.id === item.id
          ? {
              ...item,
              updatedAt: now,
              history: [
                ...item.history,
                event(
                  "RESERVATION_UPDATED",
                  `Reserva de ${reservation.serviceOrderNumberSnapshot} liberada parcial ou totalmente.`,
                ),
              ],
            }
          : i,
      ),
    });
    return next;
  }
  async returnConsumption(consumptionId: string, quantityValue: number, reason: string) {
    const state = await this.repo.read(),
      consumption = state.movements.find(
        (m) => m.id === consumptionId && m.type === "CONSUMPTION" && !m.canceledAt,
      );
    if (!consumption) throw new StockDomainError("NOT_FOUND", "Consumo não encontrado.");
    const item = state.items.find((i) => i.id === consumption.itemId);
    if (!item) throw new StockDomainError("NOT_FOUND", "Item não encontrado.");
    const quantity = this.quantity(quantityValue, item.unitScale),
      returned = state.movements
        .filter(
          (m) =>
            m.type === "RETURN" &&
            m.originalMovementId === consumption.id &&
            !m.canceledAt,
        )
        .reduce((sum, m) => sum + m.quantity, 0);
    if (quantity > consumption.quantity - returned)
      throw new StockDomainError(
        "CONFLICT",
        "A devolução ultrapassa o consumo ainda não devolvido.",
      );
    if (reason.trim().length < 3)
      throw new StockDomainError("VALIDATION", "Informe o motivo.");
    const now = new Date().toISOString(),
      movement: StockMovement = {
        id: crypto.randomUUID(),
        itemId: item.id,
        type: "RETURN",
        quantity,
        unitCostCents: consumption.unitCostCents,
        totalCostCents: Math.round(
          (quantity * consumption.unitCostCents) / item.unitScale,
        ),
        date: now.slice(0, 10),
        source: "SERVICE_ORDER",
        sourceId: consumption.serviceOrderId,
        serviceOrderId: consumption.serviceOrderId,
        reservationId: consumption.reservationId,
        originalMovementId: consumption.id,
        reason,
        createdAt: now,
        history: [
          {
            id: crypto.randomUUID(),
            description: "Devolução vinculada ao consumo.",
            createdAt: now,
          },
        ],
      };
    await this.repo.save({
      ...state,
      movements: [...state.movements, movement],
      items: state.items.map((i) =>
        i.id === item.id
          ? {
              ...item,
              updatedAt: now,
              history: [
                ...item.history,
                event(
                  "RESERVATION_UPDATED",
                  `Devolução vinculada à OS registrada: ${reason}.`,
                ),
              ],
            }
          : i,
      ),
    });
    return movement;
  }
  async reservationDivergence(
    reservation: StockReservation,
  ): Promise<StockReservationDivergence | null> {
    const order = await stockOrdersGateway.get(reservation.serviceOrderId);
    if (!order) return "ORDER_UNAVAILABLE";
    if (order.canceled) return "ORDER_CANCELED";
    if (order.archived) return "ORDER_ARCHIVED";
    if (
      order.number !== reservation.serviceOrderNumberSnapshot ||
      order.title !== reservation.serviceOrderTitleSnapshot ||
      order.updatedAt !== reservation.serviceOrderUpdatedAtSnapshot
    )
      return "ORDER_UPDATED";
    if (
      reservation.consumedQuantity + reservation.releasedQuantity >
      reservation.quantity
    )
      return "OVER_CONSUMED";
    return null;
  }
  async reviewReservation(id: string, notes: string, updateSnapshot: boolean) {
    const state = await this.repo.read(),
      reservation = state.reservations.find((r) => r.id === id);
    if (!reservation) throw new StockDomainError("NOT_FOUND", "Reserva não encontrada.");
    const order = await stockOrdersGateway.get(reservation.serviceOrderId),
      now = new Date().toISOString();
    const next = {
      ...reservation,
      reviewedAt: now,
      reviewNotes: notes,
      updatedAt: now,
      ...(updateSnapshot && order
        ? {
            serviceOrderNumberSnapshot: order.number,
            serviceOrderTitleSnapshot: order.title,
            serviceOrderUpdatedAtSnapshot: order.updatedAt,
          }
        : {}),
      history: [
        ...reservation.history,
        this.reservationEvent(
          updateSnapshot ? "SNAPSHOT_UPDATED" : "REVIEWED",
          updateSnapshot
            ? "Snapshot da OS atualizado explicitamente."
            : `Divergência revisada: ${notes}.`,
        ),
      ],
    };
    await this.repo.save({
      ...state,
      reservations: state.reservations.map((r) => (r.id === id ? next : r)),
    });
    return next;
  }
  private purchaseEvent(type: string, description: string) {
    return {
      id: crypto.randomUUID(),
      type,
      description,
      createdAt: new Date().toISOString(),
    };
  }
  private financialSnapshot(
    reference: Awaited<ReturnType<typeof stockFinanceGateway.summary>>,
  ): StockPurchaseFinancialSnapshot | undefined {
    if (!reference) return undefined;
    return {
      transactionId: reference.id,
      number: reference.number,
      totalCents: reference.totalCents,
      paidCents: reference.paidCents,
      openCents: reference.openCents,
      status: reference.status,
      accountId: reference.accountId,
      accountName: reference.accountName,
      canceled: reference.canceled,
      archived: reference.archived,
      manuallyModified: reference.manuallyModified,
      updatedAt: reference.updatedAt,
    };
  }
  async listPurchases() {
    return (await this.repo.read()).purchases;
  }
  async getPurchase(id: string) {
    const state = await this.repo.read();
    return state.purchases.find((purchase) => purchase.id === id) ?? null;
  }
  async createPurchase(input: StockPurchaseFormValues) {
    const value = stockPurchaseFormSchema.parse(input),
      state = await this.repo.read();
    const duplicate = state.purchases.find(
      (purchase) =>
        value.documentNumber &&
        purchase.documentNumber &&
        normalize(purchase.documentNumber) === normalize(value.documentNumber) &&
        normalize(purchase.supplier.name) === normalize(value.supplierName),
    );
    if (duplicate)
      throw new StockDomainError(
        "DUPLICATE",
        "Já existe uma compra deste fornecedor com o mesmo documento.",
      );
    const now = new Date().toISOString();
    const items = value.items.map((entry) => {
      const item = state.items.find((candidate) => candidate.id === entry.stockItemId);
      if (!item || item.archivedAt)
        throw new StockDomainError(
          "CONFLICT",
          "Um dos itens selecionados está indisponível.",
        );
      const orderedQuantity = this.quantity(entry.quantity, item.unitScale),
        unitCostCents = Math.round(entry.unitCost * 100);
      return {
        id: crypto.randomUUID(),
        stockItemId: item.id,
        internalCodeSnapshot: item.internalCode,
        nameSnapshot: item.name,
        unitSnapshot: item.unit,
        unitScaleSnapshot: item.unitScale,
        orderedQuantity,
        receivedQuantity: 0,
        unitCostCents,
        totalCents: Math.round((orderedQuantity * unitCostCents) / item.unitScale),
        notes: entry.notes || undefined,
      };
    });
    const purchase: StockPurchase = {
      id: crypto.randomUUID(),
      sequence: state.nextPurchaseSequence,
      supplier: {
        name: value.supplierName,
        document: value.supplierDocument || undefined,
        phone: value.supplierPhone || undefined,
        email: value.supplierEmail || undefined,
        notes: value.supplierNotes || undefined,
      },
      documentNumber: value.documentNumber || undefined,
      purchaseDate: value.purchaseDate,
      expectedDate: value.expectedDate || undefined,
      status: "DRAFT",
      notes: value.notes || undefined,
      items,
      totalCents: items.reduce((sum, item) => sum + item.totalCents, 0),
      receivedTotalCents: 0,
      manuallyModified: false,
      createdAt: now,
      updatedAt: now,
      history: [this.purchaseEvent("CREATED", "Compra cadastrada como rascunho.")],
    };
    await this.repo.save({
      ...state,
      nextPurchaseSequence: state.nextPurchaseSequence + 1,
      purchases: [purchase, ...state.purchases],
    });
    return purchase;
  }
  async updatePurchase(id: string, input: StockPurchaseFormValues) {
    const value = stockPurchaseFormSchema.parse(input),
      state = await this.repo.read(),
      current = state.purchases.find((purchase) => purchase.id === id);
    if (!current) throw new StockDomainError("NOT_FOUND", "Compra não encontrada.");
    if (
      !(["DRAFT", "ORDERED"] as string[]).includes(current.status) ||
      current.receivedTotalCents > 0
    )
      throw new StockDomainError(
        "CONFLICT",
        "Somente rascunhos ou pedidos ainda não recebidos podem ser editados.",
      );
    const items = value.items.map((entry) => {
      const stock = state.items.find((candidate) => candidate.id === entry.stockItemId);
      if (!stock || stock.archivedAt)
        throw new StockDomainError(
          "CONFLICT",
          "Um dos itens selecionados está indisponível.",
        );
      const orderedQuantity = this.quantity(entry.quantity, stock.unitScale),
        unitCostCents = Math.round(entry.unitCost * 100);
      const previous = current.items.find((item) => item.stockItemId === stock.id);
      return {
        id: previous?.id ?? crypto.randomUUID(),
        stockItemId: stock.id,
        internalCodeSnapshot: stock.internalCode,
        nameSnapshot: stock.name,
        unitSnapshot: stock.unit,
        unitScaleSnapshot: stock.unitScale,
        orderedQuantity,
        receivedQuantity: 0,
        unitCostCents,
        totalCents: Math.round((orderedQuantity * unitCostCents) / stock.unitScale),
        notes: entry.notes || undefined,
      };
    });
    const totalCents = items.reduce((sum, item) => sum + item.totalCents, 0),
      now = new Date().toISOString();
    const purchase: StockPurchase = {
      ...current,
      supplier: {
        name: value.supplierName,
        document: value.supplierDocument || undefined,
        phone: value.supplierPhone || undefined,
        email: value.supplierEmail || undefined,
        notes: value.supplierNotes || undefined,
      },
      documentNumber: value.documentNumber || undefined,
      purchaseDate: value.purchaseDate,
      expectedDate: value.expectedDate || undefined,
      notes: value.notes || undefined,
      items,
      totalCents,
      manuallyModified:
        current.manuallyModified ||
        Boolean(current.financialTransactionId && totalCents !== current.totalCents),
      updatedAt: now,
      history: [...current.history, this.purchaseEvent("UPDATED", "Compra atualizada.")],
    };
    await this.repo.save({
      ...state,
      purchases: state.purchases.map((item) => (item.id === id ? purchase : item)),
    });
    return purchase;
  }
  async confirmPurchase(id: string) {
    const state = await this.repo.read(),
      current = state.purchases.find((purchase) => purchase.id === id);
    if (!current) throw new StockDomainError("NOT_FOUND", "Compra não encontrada.");
    if (current.status !== "DRAFT") return current;
    const purchase: StockPurchase = {
      ...current,
      status: "ORDERED",
      updatedAt: new Date().toISOString(),
      history: [
        ...current.history,
        this.purchaseEvent("CONFIRMED", "Pedido de compra confirmado."),
      ],
    };
    await this.repo.save({
      ...state,
      purchases: state.purchases.map((item) => (item.id === id ? purchase : item)),
    });
    return purchase;
  }
  async receivePurchase(input: StockPurchaseReceiptValues) {
    const value = stockPurchaseReceiptSchema.parse(input),
      state = await this.repo.read(),
      current = state.purchases.find((purchase) => purchase.id === value.purchaseId);
    if (!current) throw new StockDomainError("NOT_FOUND", "Compra não encontrada.");
    if (!["ORDERED", "PARTIALLY_RECEIVED"].includes(current.status))
      throw new StockDomainError("CONFLICT", "Esta compra não aceita recebimentos.");
    const now = new Date().toISOString(),
      movements = [...state.movements];
    const items = current.items.map((purchaseItem) => {
      const receipt = value.items.find(
        (entry) => entry.purchaseItemId === purchaseItem.id,
      );
      if (!receipt?.quantity) return purchaseItem;
      const quantity = this.quantity(receipt.quantity, purchaseItem.unitScaleSnapshot),
        pending = purchaseItem.orderedQuantity - purchaseItem.receivedQuantity;
      if (quantity > pending)
        throw new StockDomainError(
          "CONFLICT",
          `O recebimento de ${purchaseItem.nameSnapshot} ultrapassa o saldo pendente.`,
        );
      movements.push({
        id: crypto.randomUUID(),
        itemId: purchaseItem.stockItemId,
        type: "ENTRY",
        quantity,
        unitCostCents: purchaseItem.unitCostCents,
        totalCostCents: Math.round(
          (quantity * purchaseItem.unitCostCents) / purchaseItem.unitScaleSnapshot,
        ),
        date: now.slice(0, 10),
        source: "PURCHASE",
        sourceId: current.id,
        purchaseId: current.id,
        purchaseItemId: purchaseItem.id,
        reason: `Recebimento da compra #${String(current.sequence).padStart(4, "0")}`,
        createdAt: now,
        history: [
          {
            id: crypto.randomUUID(),
            description: "Entrada gerada por recebimento de compra.",
            createdAt: now,
          },
        ],
      });
      return {
        ...purchaseItem,
        receivedQuantity: purchaseItem.receivedQuantity + quantity,
      };
    });
    const complete = items.every((item) => item.receivedQuantity >= item.orderedQuantity),
      receivedTotalCents = items.reduce(
        (sum, item) =>
          sum +
          Math.round(
            (item.receivedQuantity * item.unitCostCents) / item.unitScaleSnapshot,
          ),
        0,
      );
    const purchase: StockPurchase = {
      ...current,
      items,
      receivedTotalCents,
      status: complete ? "RECEIVED" : "PARTIALLY_RECEIVED",
      updatedAt: now,
      history: [
        ...current.history,
        this.purchaseEvent(
          "RECEIVED",
          complete ? "Recebimento total concluído." : "Recebimento parcial registrado.",
        ),
      ],
    };
    await this.repo.save({
      ...state,
      movements,
      purchases: state.purchases.map((item) =>
        item.id === current.id ? purchase : item,
      ),
      items: state.items.map((item) =>
        items.some((entry) => entry.stockItemId === item.id)
          ? {
              ...item,
              updatedAt: now,
              history: [
                ...item.history,
                event(
                  "MOVEMENT_CREATED",
                  `Recebimento da compra #${String(current.sequence).padStart(4, "0")}.`,
                ),
              ],
            }
          : item,
      ),
    });
    return purchase;
  }
  async returnPurchaseReceipt(movementId: string, quantityValue: number, reason: string) {
    const state = await this.repo.read(),
      receipt = state.movements.find(
        (movement) =>
          movement.id === movementId &&
          movement.type === "ENTRY" &&
          movement.purchaseId &&
          !movement.canceledAt,
      );
    if (!receipt)
      throw new StockDomainError("NOT_FOUND", "Recebimento de compra não encontrado.");
    if (reason.trim().length < 3)
      throw new StockDomainError("VALIDATION", "Informe o motivo da devolução.");
    const item = state.items.find((candidate) => candidate.id === receipt.itemId);
    if (!item) throw new StockDomainError("NOT_FOUND", "Item não encontrado.");
    const quantity = this.quantity(quantityValue, item.unitScale),
      returned = state.movements
        .filter(
          (movement) =>
            movement.type === "SUPPLIER_RETURN" &&
            movement.originalMovementId === receipt.id &&
            !movement.canceledAt,
        )
        .reduce((sum, movement) => sum + movement.quantity, 0);
    if (quantity > receipt.quantity - returned)
      throw new StockDomainError(
        "CONFLICT",
        "A devolução ultrapassa o saldo recebido disponível.",
      );
    const snapshot = calculateStock(item, state.movements, state.reservations);
    if (quantity > snapshot.physicalQuantity)
      throw new StockDomainError(
        "INSUFFICIENT_STOCK",
        "O saldo físico não comporta esta devolução.",
      );
    const now = new Date().toISOString(),
      movement: StockMovement = {
        id: crypto.randomUUID(),
        itemId: item.id,
        type: "SUPPLIER_RETURN",
        quantity,
        unitCostCents: receipt.unitCostCents,
        totalCostCents: Math.round((quantity * receipt.unitCostCents) / item.unitScale),
        date: now.slice(0, 10),
        source: "PURCHASE",
        sourceId: receipt.purchaseId,
        purchaseId: receipt.purchaseId,
        purchaseItemId: receipt.purchaseItemId,
        originalMovementId: receipt.id,
        reason: reason.trim(),
        createdAt: now,
        history: [
          {
            id: crypto.randomUUID(),
            description: "Devolução ao fornecedor registrada.",
            createdAt: now,
          },
        ],
      };
    const purchase = state.purchases.find(
      (candidate) => candidate.id === receipt.purchaseId,
    );
    await this.repo.save({
      ...state,
      movements: [...state.movements, movement],
      items: state.items.map((candidate) =>
        candidate.id === item.id
          ? {
              ...item,
              updatedAt: now,
              history: [
                ...item.history,
                event("MOVEMENT_CREATED", `Devolução ao fornecedor: ${reason.trim()}.`),
              ],
            }
          : candidate,
      ),
      purchases: state.purchases.map((candidate) =>
        candidate.id === purchase?.id
          ? {
              ...candidate,
              updatedAt: now,
              history: [
                ...candidate.history,
                this.purchaseEvent(
                  "SUPPLIER_RETURN",
                  `Devolução de ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(quantity / item.unitScale)} ${stockUnitLabels[item.unit]} de ${item.name}.`,
                ),
              ],
            }
          : candidate,
      ),
    });
    return movement;
  }
  async cancelPurchase(id: string, reason: string) {
    if (reason.trim().length < 3)
      throw new StockDomainError("VALIDATION", "Informe o motivo do cancelamento.");
    const state = await this.repo.read(),
      current = state.purchases.find((purchase) => purchase.id === id);
    if (!current) throw new StockDomainError("NOT_FOUND", "Compra não encontrada.");
    const now = new Date().toISOString(),
      purchase: StockPurchase = {
        ...current,
        status: "CANCELED",
        canceledAt: now,
        updatedAt: now,
        history: [
          ...current.history,
          this.purchaseEvent("CANCELED", `Compra cancelada: ${reason.trim()}.`),
        ],
      };
    await this.repo.save({
      ...state,
      purchases: state.purchases.map((item) => (item.id === id ? purchase : item)),
    });
    return purchase;
  }
  async archivePurchase(id: string, reason: string) {
    const state = await this.repo.read(),
      current = state.purchases.find((purchase) => purchase.id === id);
    if (!current) throw new StockDomainError("NOT_FOUND", "Compra não encontrada.");
    const now = new Date().toISOString(),
      purchase: StockPurchase = {
        ...current,
        status: "ARCHIVED",
        archivedAt: now,
        updatedAt: now,
        history: [
          ...current.history,
          this.purchaseEvent(
            "ARCHIVED",
            `Compra arquivada: ${reason.trim() || "sem observação"}.`,
          ),
        ],
      };
    await this.repo.save({
      ...state,
      purchases: state.purchases.map((item) => (item.id === id ? purchase : item)),
    });
    return purchase;
  }
  async listPurchaseFinancialAccounts() {
    return stockFinanceGateway.accounts();
  }
  async createPurchaseFinancial(
    id: string,
    input: StockPurchaseFinancialFormValues,
    additionalSequence?: number,
  ) {
    const value = stockPurchaseFinancialFormSchema.parse(input),
      state = await this.repo.read(),
      current = state.purchases.find((purchase) => purchase.id === id);
    if (!current) throw new StockDomainError("NOT_FOUND", "Compra não encontrada.");
    if (["DRAFT", "CANCELED", "ARCHIVED"].includes(current.status))
      throw new StockDomainError(
        "CONFLICT",
        "A compra não está apta para gerar contas a pagar.",
      );
    const existingSummary = await stockFinanceGateway.summary(id),
      amount = additionalSequence
        ? current.totalCents - (existingSummary?.totalCents ?? 0)
        : current.totalCents;
    if (amount <= 0)
      throw new StockDomainError("CONFLICT", "Não existe saldo adicional para gerar.");
    const result = await stockFinanceGateway.create({
      source: {
        sourceType: "STOCK_PURCHASE",
        sourceId: current.id,
        purchaseId: current.id,
        purpose: "PAYABLE",
      },
      title: `Compra de estoque #${String(current.sequence).padStart(4, "0")}`,
      description: current.documentNumber
        ? `Documento ${current.documentNumber}`
        : "Compra de materiais para estoque",
      accountId: value.accountId,
      totalCents: amount,
      issueDate: current.purchaseDate,
      competenceDate: value.competenceDate,
      firstDueDate: value.firstDueDate,
      installmentCount: value.installmentCount,
      supplier: current.supplier.name,
      notes: value.notes,
      additionalSequence,
    });
    if (result.blocked)
      throw new StockDomainError(
        "CONFLICT",
        "O vínculo financeiro existente está cancelado ou arquivado.",
      );
    const summary = await stockFinanceGateway.summary(id),
      snapshot = this.financialSnapshot(summary),
      now = new Date().toISOString();
    const purchase: StockPurchase = {
      ...current,
      financialTransactionId: current.financialTransactionId ?? result.transaction.id,
      financialPurpose: "PAYABLE",
      financialSnapshot: snapshot,
      updatedAt: now,
      history: [
        ...current.history,
        this.purchaseEvent(
          result.existing ? "FINANCIAL_REUSED" : "FINANCIAL_CREATED",
          result.existing
            ? "Vínculo financeiro idempotente reutilizado."
            : "Conta a pagar gerada no Financeiro.",
        ),
      ],
    };
    await this.repo.save({
      ...state,
      purchases: state.purchases.map((item) => (item.id === id ? purchase : item)),
    });
    return { purchase, existing: result.existing, transaction: result.transaction };
  }
  async purchaseReconciliation(id: string): Promise<{
    status: StockPurchaseReconciliation;
    purchase: StockPurchase;
    summary?: StockPurchaseFinancialSnapshot;
  }> {
    const state = await this.repo.read(),
      purchase = state.purchases.find((item) => item.id === id);
    if (!purchase) throw new StockDomainError("NOT_FOUND", "Compra não encontrada.");
    if (purchase.canceledAt) return { status: "PURCHASE_CANCELED", purchase };
    if (purchase.archivedAt) return { status: "PURCHASE_ARCHIVED", purchase };
    const summary = this.financialSnapshot(await stockFinanceGateway.summary(id));
    if (!summary) return { status: "FINANCIAL_UNAVAILABLE", purchase };
    if (summary.canceled) return { status: "FINANCIAL_CANCELED", purchase, summary };
    if (summary.archived) return { status: "FINANCIAL_ARCHIVED", purchase, summary };
    if (summary.manuallyModified || purchase.manuallyModified)
      return { status: "MANUALLY_MODIFIED", purchase, summary };
    if (purchase.totalCents > summary.totalCents)
      return { status: "PURCHASE_VALUE_INCREASED", purchase, summary };
    if (purchase.totalCents < summary.totalCents)
      return { status: "PURCHASE_VALUE_DECREASED", purchase, summary };
    return { status: "MATCHED", purchase, summary };
  }
  async reviewPurchaseReconciliation(id: string, notes: string) {
    const state = await this.repo.read(),
      current = state.purchases.find((purchase) => purchase.id === id);
    if (!current) throw new StockDomainError("NOT_FOUND", "Compra não encontrada.");
    const now = new Date().toISOString(),
      purchase: StockPurchase = {
        ...current,
        reconciliationReviewedAt: now,
        reconciliationNotes: notes.trim(),
        updatedAt: now,
        history: [
          ...current.history,
          this.purchaseEvent(
            "RECONCILIATION_REVIEWED",
            `Conciliação revisada: ${notes.trim() || "sem observação"}.`,
          ),
        ],
      };
    await this.repo.save({
      ...state,
      purchases: state.purchases.map((item) => (item.id === id ? purchase : item)),
    });
    return purchase;
  }
  async cancelPurchaseOpenFinancial(id: string, reason: string) {
    const state = await this.repo.read(),
      purchase = state.purchases.find((item) => item.id === id);
    if (!purchase?.financialTransactionId)
      throw new StockDomainError("NOT_FOUND", "Conta a pagar vinculada não encontrada.");
    await stockFinanceGateway.cancelOpen(purchase.financialTransactionId, reason);
    return this.purchaseReconciliation(id);
  }
  async savePreferences(preferences: StockPreferences) {
    const state = await this.repo.read();
    return this.repo.save({ ...state, preferences });
  }
  recoverBackup() {
    return this.repo.recoverBackup();
  }
}
export function stockError(cause: unknown) {
  if (cause instanceof StockDomainError) return cause;
  if (cause instanceof ZodError)
    return new StockDomainError(
      "VALIDATION",
      "Revise os campos informados.",
      cause.flatten().fieldErrors as Record<string, string[]>,
    );
  return cause instanceof Error ? cause : new Error("Erro inesperado no Estoque.");
}
