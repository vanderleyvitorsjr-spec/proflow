import type {
  StockItem,
  StockMovement,
  StockReservation,
  StockReservationStatus,
  StockSnapshot,
  StockStatus,
} from "./estoque-types";

const additions = new Set(["ENTRY", "RETURN", "ADJUSTMENT_IN"]);
export function movementSign(type: StockMovement["type"]) {
  return additions.has(type) ? 1 : -1;
}
export function reservationRemaining(reservation: StockReservation) {
  return (
    reservation.quantity - reservation.consumedQuantity - reservation.releasedQuantity
  );
}
export function reservationStatus(
  reservation: StockReservation,
  divergent = false,
): StockReservationStatus {
  if (divergent) return "DIVERGENT";
  const remaining = reservationRemaining(reservation);
  if (remaining <= 0 && reservation.consumedQuantity >= reservation.quantity)
    return "CONSUMED";
  if (remaining <= 0) return "RELEASED";
  if (reservation.consumedQuantity > 0) return "PARTIALLY_CONSUMED";
  if (reservation.releasedQuantity > 0) return "PARTIALLY_RELEASED";
  return "ACTIVE";
}
export function calculateStock(
  item: StockItem,
  movements: StockMovement[],
  reservations: StockReservation[] = [],
): StockSnapshot {
  let quantity = 0,
    valueCents = 0,
    averageCostCents = 0;
  const active = movements
    .filter((m) => m.itemId === item.id && !m.canceledAt)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.id.localeCompare(b.id),
    );
  for (const movement of active) {
    if (movementSign(movement.type) > 0) {
      quantity += movement.quantity;
      valueCents += movement.totalCostCents;
    } else {
      quantity -= movement.quantity;
      valueCents -= Math.round(
        (movement.quantity * movement.unitCostCents) / item.unitScale,
      );
    }
    if (quantity <= 0) {
      averageCostCents = 0;
      valueCents = 0;
    } else
      averageCostCents = Math.max(
        0,
        Math.round((valueCents * item.unitScale) / quantity),
      );
  }
  const status: StockStatus = item.archivedAt
    ? "ARCHIVED"
    : quantity <= 0
      ? "OUT_OF_STOCK"
      : quantity <= item.minimumQuantity
        ? "LOW_STOCK"
        : "AVAILABLE";
  const itemReservations = reservations.filter(
    (reservation) => reservation.itemId === item.id && !reservation.archivedAt,
  );
  const reservedQuantity = itemReservations.reduce(
    (sum, reservation) => sum + Math.max(0, reservationRemaining(reservation)),
    0,
  );
  return {
    item,
    physicalQuantity: quantity,
    reservedQuantity,
    availableQuantity: quantity - reservedQuantity,
    averageCostCents,
    totalValueCents: Math.max(0, valueCents),
    status,
    movements: movements
      .filter((m) => m.itemId === item.id)
      .sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
      ),
    reservations: itemReservations,
  };
}
export function hasNegativeBalance(item: StockItem, movements: StockMovement[]) {
  let quantity = 0;
  return movements
    .filter((m) => m.itemId === item.id && !m.canceledAt)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.id.localeCompare(b.id),
    )
    .some((m) => {
      quantity += movementSign(m.type) * m.quantity;
      return quantity < 0;
    });
}
export function formatStockQuantity(
  quantity: number,
  item: Pick<StockItem, "unitScale" | "unit">,
  label: string,
) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(quantity / item.unitScale)} ${label}`;
}
