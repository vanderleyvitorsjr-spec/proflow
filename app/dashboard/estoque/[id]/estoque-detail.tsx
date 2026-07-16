"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Archive, ArrowLeft, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableFrame } from "@/components/ui/table";
import {
  archiveStockItemAction,
  cancelStockMovementAction,
  consumeStockReservationAction,
  createStockReservationAction,
  createStockMovementAction,
  getStockReservationDivergenceAction,
  getStockItemAction,
  listStockOrdersAction,
  releaseStockReservationAction,
  returnStockConsumptionAction,
  reviewStockReservationAction,
  updateStockItemAction,
} from "../estoque-actions";
import { stockCategoryLabels, stockUnitLabels } from "../estoque-data";
import { StockFormDrawer } from "../estoque-form-drawer";
import { StockMovementDrawer } from "../estoque-movement-drawer";
import { StockConfirmationDialog } from "../estoque-confirmation-dialog";
import { StockReservationDialog } from "../estoque-reservation-dialog";
import { StockConsumptionDialog } from "../estoque-consumption-dialog";
import { StockReleaseDialog } from "../estoque-release-dialog";
import { StockReturnDialog } from "../estoque-return-dialog";
import { StockReservationsList } from "../estoque-reservations-list";
import { formatStockQuantity } from "../estoque-selectors";
import type {
  StockItemFormValues,
  StockMovementFormValues,
  StockReservationFormValues,
  StockReservationOperationValues,
} from "../estoque-schema";
import type {
  StockMovement,
  StockReservation,
  StockReservationDivergence,
  StockSnapshot,
} from "../estoque-types";
import type { StockOrderReference } from "../estoque-ordens-gateway";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
  date = new Intl.DateTimeFormat("pt-BR"),
  datetime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const movementLabels = {
  ENTRY: "Entrada",
  EXIT: "Saída",
  RETURN: "Devolução",
  ADJUSTMENT_IN: "Ajuste positivo",
  ADJUSTMENT_OUT: "Ajuste negativo",
  LOSS: "Perda",
  CONSUMPTION: "Consumo em OS",
  SUPPLIER_RETURN: "Devolução ao fornecedor",
};
export function StockDetail({ id }: { id: string }) {
  const [snapshot, setSnapshot] = useState<StockSnapshot | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [success, setSuccess] = useState<string | null>(null),
    [editing, setEditing] = useState(false),
    [moving, setMoving] = useState(false),
    [archiving, setArchiving] = useState(false),
    [canceling, setCanceling] = useState<StockMovement | null>(null),
    [reservationOpen, setReservationOpen] = useState(false),
    [orders, setOrders] = useState<StockOrderReference[]>([]),
    [consuming, setConsuming] = useState<StockReservation | null>(null),
    [releasing, setReleasing] = useState<StockReservation | null>(null),
    [returning, setReturning] = useState<StockMovement | null>(null),
    [divergences, setDivergences] = useState<
      Record<string, StockReservationDivergence | null>
    >({});
  const load = useCallback(async () => {
    const result = await getStockItemAction(id);
    if (result.ok) {
      setSnapshot(result.data);
      if (result.data) {
        const entries = await Promise.all(
          result.data.reservations.map(async (reservation) => {
            const check = await getStockReservationDivergenceAction(reservation.id);
            return [reservation.id, check.ok ? check.data : null] as const;
          }),
        );
        setDivergences(Object.fromEntries(entries));
      }
    } else setError(result.error.message);
    setLoading(false);
  }, [id]);
  useEffect(() => {
    queueMicrotask(
      () =>
        void listStockOrdersAction().then((result) => {
          if (result.ok) setOrders(result.data);
        }),
    );
  }, []);
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);
  if (loading) return <div className="h-80 animate-pulse rounded-xl bg-muted" />;
  if (!snapshot)
    return (
      <EmptyState
        title="Item não encontrado"
        description={error ?? "O registro não está disponível."}
        action={
          <Button asChild>
            <Link href="/dashboard/estoque">Voltar</Link>
          </Button>
        }
      />
    );
  const { item } = snapshot,
    quantity = (value: number) =>
      formatStockQuantity(value, item, stockUnitLabels[item.unit]);
  async function save(input: StockItemFormValues) {
    setBusy(true);
    const result = await updateStockItemAction(id, input);
    if (result.ok) {
      setEditing(false);
      setSuccess("Item atualizado.");
      await load();
    } else setError(result.error.message);
    setBusy(false);
  }
  async function move(input: StockMovementFormValues) {
    setBusy(true);
    const result = await createStockMovementAction(input);
    if (result.ok) {
      setMoving(false);
      setSuccess("Movimento registrado.");
      await load();
    } else setError(result.error.message);
    setBusy(false);
  }
  async function confirmArchive(reason: string) {
    setBusy(true);
    const result = await archiveStockItemAction(id, reason);
    if (result.ok) {
      setArchiving(false);
      setSuccess("Item arquivado.");
      await load();
    } else setError(result.error.message);
    setBusy(false);
  }
  async function cancel(reason: string) {
    if (!canceling) return;
    setBusy(true);
    const result = await cancelStockMovementAction(canceling.id, reason);
    if (result.ok) {
      setCanceling(null);
      setSuccess("Movimento cancelado e replay concluído.");
      await load();
    } else setError(result.error.message);
    setBusy(false);
  }
  async function reserve(input: StockReservationFormValues) {
    setBusy(true);
    setError(null);
    const result = await createStockReservationAction(input);
    if (result.ok) {
      setReservationOpen(false);
      setSuccess(
        result.data.existing ? "Reserva existente aberta." : "Material reservado.",
      );
      await load();
    } else setError(result.error.message);
    setBusy(false);
  }
  async function consume(input: StockReservationOperationValues) {
    setBusy(true);
    setError(null);
    const result = await consumeStockReservationAction(input);
    if (result.ok) {
      setConsuming(null);
      setSuccess("Consumo registrado.");
      await load();
    } else setError(result.error.message);
    setBusy(false);
  }
  async function release(input: StockReservationOperationValues) {
    setBusy(true);
    setError(null);
    const result = await releaseStockReservationAction(input);
    if (result.ok) {
      setReleasing(null);
      setSuccess("Reserva liberada.");
      await load();
    } else setError(result.error.message);
    setBusy(false);
  }
  async function returnConsumption(quantityValue: number, reason: string) {
    if (!returning) return;
    setBusy(true);
    const result = await returnStockConsumptionAction(
      returning.id,
      quantityValue,
      reason,
    );
    if (result.ok) {
      setReturning(null);
      setSuccess("Material devolvido com o custo original.");
      await load();
    } else setError(result.error.message);
    setBusy(false);
  }
  async function review(reservation: StockReservation, update: boolean) {
    const notes = window.prompt(
      "Observação da revisão:",
      update ? "Snapshot atualizado após conferência." : "Divergência conferida.",
    );
    if (notes === null) return;
    setBusy(true);
    const result = await reviewStockReservationAction(reservation.id, notes, update);
    if (result.ok) {
      setSuccess(update ? "Snapshot atualizado." : "Revisão registrada.");
      await load();
    } else setError(result.error.message);
    setBusy(false);
  }
  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card p-4">
        <div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/estoque">
              <ArrowLeft className="h-4 w-4" />
              Estoque
            </Link>
          </Button>
          <h1 className="mt-2 text-xl font-bold">
            {item.internalCode} · {item.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {item.description || "Sem descrição"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <Button onClick={() => setMoving(true)} disabled={Boolean(item.archivedAt)}>
            <Plus className="h-4 w-4" />
            Movimento
          </Button>
          <Button
            variant="secondary"
            onClick={() => setReservationOpen(true)}
            disabled={Boolean(item.archivedAt)}
          >
            Reservar material
          </Button>
          <Button
            variant="destructive"
            onClick={() => setArchiving(true)}
            disabled={Boolean(item.archivedAt)}
          >
            <Archive className="h-4 w-4" />
            Arquivar
          </Button>
        </div>
      </header>
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/30 p-3 text-sm text-rose-600"
        >
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 p-3 text-sm text-emerald-700"
        >
          {success}
        </div>
      ) : null}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Quantidade física", quantity(snapshot.physicalQuantity)],
          ["Reservado", quantity(snapshot.reservedQuantity)],
          ["Disponível", quantity(snapshot.availableQuantity)],
          ["Custo médio", money.format(snapshot.averageCostCents / 100)],
          ["Valor patrimonial", money.format(snapshot.totalValueCents / 100)],
          ["Estoque mínimo", quantity(item.minimumQuantity)],
          ["Status", snapshot.status],
          ["Unidade", stockUnitLabels[item.unit]],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <div className="grid gap-3 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Identificação</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <Info label="Categoria" value={stockCategoryLabels[item.category]} />
              <Info label="Fabricante" value={item.manufacturer ?? "Não informado"} />
              <Info label="Código de barras" value={item.barcode ?? "Não informado"} />
              <Info
                label="Localização"
                value={[item.location.name, item.location.room, item.location.container]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <Info
                label="Fornecedor preferencial"
                value={item.supplierReference ?? "Não informado"}
              />
              <Info label="Criado em" value={datetime.format(new Date(item.createdAt))} />
              <Info
                label="Atualizado em"
                value={datetime.format(new Date(item.updatedAt))}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Histórico operacional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.history
                .slice()
                .reverse()
                .map((h) => (
                  <div key={h.id} className="border-l-2 border-sky-500 pl-3">
                    <Badge variant="outline">{h.type}</Badge>
                    <p className="mt-1 text-sm">{h.description}</p>
                    <time className="text-xs text-muted-foreground">
                      {datetime.format(new Date(h.createdAt))}
                    </time>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Reservas e Ordens vinculadas</CardTitle>
            </CardHeader>
            <CardContent>
              <StockReservationsList
                reservations={snapshot.reservations}
                divergences={divergences}
                unitScale={item.unitScale}
                unitLabel={stockUnitLabels[item.unit]}
                onConsume={setConsuming}
                onRelease={setReleasing}
                onReview={review}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Movimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <TableFrame scrollHint>
                <Table framed={false} density="compact" className="min-w-[52rem]">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Quantidade</th>
                      <th>Custo aplicado</th>
                      <th>Total</th>
                      <th>Motivo</th>
                      <th>Status</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.movements.map((m) => (
                      <tr key={m.id}>
                        <td>{date.format(new Date(`${m.date}T12:00:00`))}</td>
                        <td>{movementLabels[m.type]}</td>
                        <td>{quantity(m.quantity)}</td>
                        <td>{money.format(m.unitCostCents / 100)}</td>
                        <td>{money.format(m.totalCostCents / 100)}</td>
                        <td>{m.reason}</td>
                        <td>
                          <Badge variant={m.canceledAt ? "neutral" : "success"}>
                            {m.canceledAt ? "Cancelado" : "Ativo"}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            {m.type === "CONSUMPTION" && !m.canceledAt ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setReturning(m)}
                              >
                                Devolver
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={Boolean(m.canceledAt)}
                              onClick={() => setCanceling(m)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableFrame>
            </CardContent>
          </Card>
        </div>
      </div>
      <StockFormDrawer
        open={editing}
        item={item}
        busy={busy}
        error={error}
        onClose={() => setEditing(false)}
        onSave={save}
      />
      <StockMovementDrawer
        open={moving}
        items={[snapshot]}
        initialItemId={id}
        busy={busy}
        error={error}
        onClose={() => setMoving(false)}
        onSave={move}
      />
      <StockConfirmationDialog
        open={archiving}
        title="Arquivar item?"
        description="Movimentos e histórico serão preservados."
        confirmLabel="Arquivar"
        busy={busy}
        onClose={() => setArchiving(false)}
        onConfirm={confirmArchive}
      />
      <StockReservationDialog
        open={reservationOpen}
        items={[snapshot]}
        orders={orders}
        initialItemId={id}
        busy={busy}
        error={error}
        onClose={() => setReservationOpen(false)}
        onSave={reserve}
      />
      <StockConsumptionDialog
        open={Boolean(consuming)}
        reservation={consuming}
        busy={busy}
        error={error}
        onClose={() => setConsuming(null)}
        onSave={consume}
      />
      <StockReleaseDialog
        open={Boolean(releasing)}
        reservation={releasing}
        busy={busy}
        error={error}
        onClose={() => setReleasing(null)}
        onSave={release}
      />
      <StockReturnDialog
        movement={returning}
        busy={busy}
        error={error}
        onClose={() => setReturning(null)}
        onSave={returnConsumption}
      />
      <StockConfirmationDialog
        open={Boolean(canceling)}
        title="Cancelar movimento?"
        description="O ledger será reprocessado. O cancelamento será bloqueado se produzir saldo histórico negativo."
        confirmLabel="Cancelar movimento"
        busy={busy}
        onClose={() => setCanceling(null)}
        onConfirm={cancel}
      />
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
