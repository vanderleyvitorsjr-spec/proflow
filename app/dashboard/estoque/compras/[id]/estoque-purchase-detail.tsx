"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricItem, MetricStrip } from "@/components/ui/metric-strip";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIcon,
  PageHeaderIdentity,
} from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  archiveStockPurchaseAction,
  cancelStockPurchaseAction,
  cancelStockPurchaseOpenFinancialAction,
  confirmStockPurchaseAction,
  createStockPurchaseFinancialAction,
  getStockPurchaseAction,
  getStockPurchaseReconciliationAction,
  listStockAction,
  listStockPurchaseFinancialAccountsAction,
  receiveStockPurchaseAction,
  returnStockPurchaseReceiptAction,
  reviewStockPurchaseReconciliationAction,
  updateStockPurchaseAction,
} from "../../estoque-actions";
import { StockConfirmationDialog } from "../../estoque-confirmation-dialog";
import { StockFinancialReconciliation } from "../../estoque-financial-reconciliation";
import { StockFinancialSummary } from "../../estoque-financial-summary";
import { StockPurchaseDialog } from "../../estoque-purchase-dialog";
import { StockPurchaseReceiptDialog } from "../../estoque-purchase-receipt-dialog";
import { StockPurchaseReturnDialog } from "../../estoque-purchase-return-dialog";
import type { StockPurchaseFinancialAccountReference } from "@/lib/contracts/financeiro.contract";
import type {
  StockPurchaseFinancialFormValues,
  StockPurchaseFormValues,
  StockPurchaseReceiptValues,
} from "../../estoque-schema";
import type {
  StockMovement,
  StockPurchase,
  StockPurchaseReconciliation,
  StockSnapshot,
} from "../../estoque-types";
import { stockUnitLabels } from "../../estoque-data";
import {
  formatBrazilianPhone,
  formatCpfCnpj,
  formatDateTimeBR,
} from "@/lib/br-formatters";
import { ptBrLabel } from "@/lib/pt-br-labels";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function EstoquePurchaseDetail({ purchaseId }: { purchaseId: string }) {
  const [purchase, setPurchase] = useState<StockPurchase | null>(null),
    [stock, setStock] = useState<StockSnapshot[]>([]),
    [accounts, setAccounts] = useState<StockPurchaseFinancialAccountReference[]>([]),
    [reconciliation, setReconciliation] = useState<StockPurchaseReconciliation>(
      "FINANCIAL_UNAVAILABLE",
    ),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [success, setSuccess] = useState<string | null>(null),
    [editing, setEditing] = useState(false),
    [receiving, setReceiving] = useState(false),
    [returning, setReturning] = useState(false),
    [confirming, setConfirming] = useState<"cancel" | "archive" | "financial" | null>(
      null,
    );
  const load = useCallback(async () => {
    setLoading(true);
    const [purchaseResult, stockResult, accountsResult, reconciliationResult] =
      await Promise.all([
        getStockPurchaseAction(purchaseId),
        listStockAction(),
        listStockPurchaseFinancialAccountsAction(),
        getStockPurchaseReconciliationAction(purchaseId),
      ]);
    if (purchaseResult.ok && purchaseResult.data)
      setPurchase(
        reconciliationResult.ok && reconciliationResult.data.summary
          ? {
              ...purchaseResult.data,
              financialSnapshot: reconciliationResult.data.summary,
            }
          : purchaseResult.data,
      );
    else if (!purchaseResult.ok) setError(purchaseResult.error.message);
    if (stockResult.ok) setStock(stockResult.data);
    if (accountsResult.ok) setAccounts(accountsResult.data);
    if (reconciliationResult.ok) setReconciliation(reconciliationResult.data.status);
    setLoading(false);
  }, [purchaseId]);
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);
  const receipts = useMemo<StockMovement[]>(
    () =>
      stock
        .flatMap((item) => item.movements)
        .filter(
          (movement) =>
            movement.purchaseId === purchaseId &&
            movement.type === "ENTRY" &&
            !movement.canceledAt,
        ),
    [stock, purchaseId],
  );
  const purchaseMovements = useMemo(
    () =>
      stock
        .flatMap((item) => item.movements)
        .filter((movement) => movement.purchaseId === purchaseId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [stock, purchaseId],
  );
  async function run<T>(
    work: () => Promise<
      { ok: true; data: T } | { ok: false; error: { message: string } }
    >,
    message: string,
  ) {
    setBusy(true);
    setError(null);
    const result = await work();
    if (result.ok) {
      setSuccess(message);
      await load();
    } else setError(result.error.message);
    setBusy(false);
    return result.ok;
  }
  if (loading)
    return (
      <div
        className="h-72 animate-pulse rounded-xl bg-muted"
        aria-label="Carregando compra"
      />
    );
  if (!purchase)
    return (
      <EmptyState
        title="Compra não encontrada"
        description={error ?? "O registro pode ter sido removido."}
        action={
          <Button asChild>
            <Link href="/dashboard/estoque">Voltar ao estoque</Link>
          </Button>
        }
      />
    );
  return (
    <div className="space-y-3">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <PageHeaderIcon>
              <PackageCheck className="h-4 w-4" />
            </PageHeaderIcon>
            <PageHeaderHeading
              title={`Compra #${String(purchase.sequence).padStart(4, "0")}`}
              description={`${purchase.supplier.name} · ${purchase.documentNumber || "sem documento"}`}
            />
          </PageHeaderIdentity>
          <PageHeaderActions>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/estoque">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Estoque
              </Link>
            </Button>
            {purchase.status === "DRAFT" ? (
              <>
                <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    void run(
                      () => confirmStockPurchaseAction(purchase.id),
                      "Compra confirmada.",
                    )
                  }
                >
                  Confirmar pedido
                </Button>
              </>
            ) : purchase.status === "ORDERED" && purchase.receivedTotalCents === 0 ? (
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                Ajustar pedido
              </Button>
            ) : null}
            {["ORDERED", "PARTIALLY_RECEIVED"].includes(purchase.status) ? (
              <Button size="sm" onClick={() => setReceiving(true)}>
                Receber itens
              </Button>
            ) : null}
            {receipts.length ? (
              <Button size="sm" variant="secondary" onClick={() => setReturning(true)}>
                Devolver item
              </Button>
            ) : null}
            {!purchase.canceledAt && !purchase.archivedAt ? (
              <Button size="sm" variant="ghost" onClick={() => setConfirming("cancel")}>
                Cancelar
              </Button>
            ) : null}
            {!purchase.archivedAt ? (
              <Button size="sm" variant="ghost" onClick={() => setConfirming("archive")}>
                Arquivar
              </Button>
            ) : null}
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 p-3 text-sm text-red-600"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-500/30 p-3 text-sm text-emerald-700"
        >
          {success}
        </p>
      ) : null}
      <MetricStrip className="sm:min-w-0 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-4">
        <MetricItem label="Situação" value={ptBrLabel(purchase.status)} />
        <MetricItem
          label="Total"
          value={money.format(purchase.totalCents / 100)}
          tone="info"
        />
        <MetricItem
          label="Recebido"
          value={money.format(purchase.receivedTotalCents / 100)}
          tone="success"
        />
        <MetricItem
          label="Previsão"
          value={
            purchase.expectedDate
              ? new Date(`${purchase.expectedDate}T12:00:00`).toLocaleDateString("pt-BR")
              : "Não informada"
          }
        />
      </MetricStrip>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.8fr)]">
        <section className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Itens e recebimentos</h2>
          </div>
          <TableFrame className="rounded-none border-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Pedido</TableHead>
                  <TableHead className="text-right">Recebido</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.nameSnapshot}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.internalCodeSnapshot}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.orderedQuantity / item.unitScaleSnapshot}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.receivedQuantity / item.unitScaleSnapshot}
                    </TableCell>
                    <TableCell className="text-right">
                      {money.format(item.unitCostCents / 100)}
                    </TableCell>
                    <TableCell className="text-right">
                      {money.format(item.totalCents / 100)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableFrame>
        </section>
        <div className="space-y-3">
          <StockFinancialSummary
            purchase={purchase}
            accounts={accounts}
            busy={busy}
            onCreate={async (
              input: StockPurchaseFinancialFormValues,
              additional?: boolean,
            ) => {
              const ok = await run(
                () =>
                  createStockPurchaseFinancialAction(
                    purchase.id,
                    input,
                    additional
                      ? purchase.history.filter(
                          (event) => event.type === "FINANCIAL_CREATED",
                        ).length + 1
                      : undefined,
                  ),
                "Conta a pagar vinculada.",
              );
              if (ok) setSuccess("Conta a pagar vinculada sem duplicidade.");
            }}
            onCancelOpen={() => setConfirming("financial")}
          />
          <StockFinancialReconciliation
            status={reconciliation}
            reviewedAt={purchase.reconciliationReviewedAt}
            busy={busy}
            onReview={async () => {
              await run(
                () =>
                  reviewStockPurchaseReconciliationAction(
                    purchase.id,
                    "Divergência revisada pelo usuário.",
                  ),
                "Conciliação revisada.",
              );
            }}
          />
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold">Fornecedor e dados gerais</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Fornecedor</dt>
              <dd>{purchase.supplier.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Documento</dt>
              <dd>{formatCpfCnpj(purchase.supplier.document) || "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Telefone</dt>
              <dd>{formatBrazilianPhone(purchase.supplier.phone) || "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">E-mail</dt>
              <dd className="break-all">{purchase.supplier.email || "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Criada em</dt>
              <dd>{formatDateTimeBR(purchase.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Atualizada em</dt>
              <dd>{formatDateTimeBR(purchase.updatedAt)}</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold">Movimentos gerados</h2>
          {purchaseMovements.length ? (
            <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
              {purchaseMovements.map((movement) => (
                <li
                  key={movement.id}
                  className="flex items-center justify-between gap-3 border-b pb-2"
                >
                  <span>
                    {movement.type === "ENTRY"
                      ? "Recebimento"
                      : "Devolução ao fornecedor"}{" "}
                    ·{" "}
                    {(() => {
                      const item = purchase.items.find(
                        (candidate) => candidate.id === movement.purchaseItemId,
                      );
                      return item
                        ? `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(movement.quantity / item.unitScaleSnapshot)} ${stockUnitLabels[item.unitSnapshot]}`
                        : movement.quantity;
                    })()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(`${movement.date}T12:00:00`).toLocaleDateString("pt-BR")}
                    {movement.canceledAt ? " · cancelado" : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhum recebimento registrado.
            </p>
          )}
        </section>
      </div>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold">Histórico</h2>
        <ol className="mt-3 space-y-2">
          {[...purchase.history].reverse().map((event) => (
            <li
              key={event.id}
              className="flex justify-between gap-3 border-b pb-2 text-sm last:border-0"
            >
              <span>{event.description}</span>
              <time className="shrink-0 text-xs text-muted-foreground">
                {new Date(event.createdAt).toLocaleString("pt-BR")}
              </time>
            </li>
          ))}
        </ol>
      </section>
      <StockPurchaseDialog
        open={editing}
        purchase={purchase}
        stock={stock}
        busy={busy}
        error={error}
        onClose={() => setEditing(false)}
        onSave={async (input: StockPurchaseFormValues) => {
          if (
            await run(
              () => updateStockPurchaseAction(purchase.id, input),
              "Compra atualizada.",
            )
          )
            setEditing(false);
        }}
      />
      <StockPurchaseReceiptDialog
        open={receiving}
        purchase={purchase}
        busy={busy}
        error={error}
        onClose={() => setReceiving(false)}
        onSave={async (input: StockPurchaseReceiptValues) => {
          if (
            await run(() => receiveStockPurchaseAction(input), "Recebimento registrado.")
          )
            setReceiving(false);
        }}
      />
      <StockPurchaseReturnDialog
        open={returning}
        receipts={receipts}
        busy={busy}
        error={error}
        onClose={() => setReturning(false)}
        getReceiptLabel={(movement) => {
          const item = purchase.items.find(
            (candidate) => candidate.id === movement.purchaseItemId,
          );
          return item
            ? `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(movement.quantity / item.unitScaleSnapshot)} ${stockUnitLabels[item.unitSnapshot]}`
            : String(movement.quantity);
        }}
        onSave={async (movementId, quantity, reason) => {
          if (
            await run(
              () => returnStockPurchaseReceiptAction(movementId, quantity, reason),
              "Devolução registrada.",
            )
          )
            setReturning(false);
        }}
      />
      <StockConfirmationDialog
        open={Boolean(confirming)}
        title={
          confirming === "archive"
            ? "Arquivar compra?"
            : confirming === "financial"
              ? "Cancelar saldo financeiro?"
              : "Cancelar compra?"
        }
        description="O histórico será preservado. Esta ação não apaga recebimentos nem lançamentos financeiros."
        confirmLabel={
          confirming === "archive"
            ? "Arquivar"
            : confirming === "financial"
              ? "Cancelar saldo"
              : "Cancelar compra"
        }
        busy={busy}
        onClose={() => setConfirming(null)}
        onConfirm={async (reason) => {
          const ok =
            confirming === "financial"
              ? await run(
                  () => cancelStockPurchaseOpenFinancialAction(purchase.id, reason),
                  "Saldo financeiro aberto cancelado.",
                )
              : confirming === "archive"
                ? await run(
                    () => archiveStockPurchaseAction(purchase.id, reason),
                    "Compra arquivada.",
                  )
                : await run(
                    () => cancelStockPurchaseAction(purchase.id, reason),
                    "Compra cancelada.",
                  );
          if (ok) setConfirming(null);
        }}
      />
    </div>
  );
}
