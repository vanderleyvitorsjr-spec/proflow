"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  archiveStockItemAction,
  createStockItemAction,
  createStockMovementAction,
  getStockPreferencesAction,
  listStockAction,
  recoverStockBackupAction,
  saveStockPreferencesAction,
  updateStockItemAction,
  createStockPurchaseAction,
  listStockPurchasesAction,
} from "./estoque-actions";
import { EstoqueFilters } from "./estoque-filters";
import { StockFormDrawer } from "./estoque-form-drawer";
import { EstoqueList } from "./estoque-list";
import { StockMovementDrawer } from "./estoque-movement-drawer";
import { StockConfirmationDialog } from "./estoque-confirmation-dialog";
import { defaultStockPreferences } from "./estoque-storage-adapter";
import { EstoqueSummary } from "./estoque-summary";
import { StockPurchaseDialog } from "./estoque-purchase-dialog";
import { StockPurchasesList } from "./estoque-purchases-list";
import type {
  StockItemFormValues,
  StockMovementFormValues,
  StockPurchaseFormValues,
} from "./estoque-schema";
import type {
  StockMovementType,
  StockPreferences,
  StockPurchase,
  StockSnapshot,
} from "./estoque-types";
export function EstoquePageContent() {
  const [items, setItems] = useState<StockSnapshot[]>([]),
    [purchases, setPurchases] = useState<StockPurchase[]>([]),
    [preferences, setPreferences] = useState<StockPreferences>(defaultStockPreferences),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [success, setSuccess] = useState<string | null>(null),
    [formOpen, setFormOpen] = useState(false),
    [purchaseOpen, setPurchaseOpen] = useState(false),
    [editing, setEditing] = useState<StockSnapshot | null>(null),
    [movement, setMovement] = useState<{
      item?: StockSnapshot;
      type: StockMovementType;
    } | null>(null),
    [archiving, setArchiving] = useState<StockSnapshot | null>(null);
  async function load() {
    setLoading(true);
    const [result, prefs, purchaseResult] = await Promise.all([
      listStockAction(),
      getStockPreferencesAction(),
      listStockPurchasesAction(),
    ]);
    if (result.ok) setItems(result.data);
    else setError(result.error.message);
    if (prefs.ok) setPreferences(prefs.data);
    if (purchaseResult.ok) setPurchases(purchaseResult.data);
    setLoading(false);
  }
  useEffect(() => {
    queueMicrotask(() => void load());
  }, []);
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => void saveStockPreferencesAction(preferences), 250);
    return () => clearTimeout(timer);
  }, [preferences, loading]);
  const filtered = useMemo(
    () =>
      items.filter((s) => {
        const q = preferences.searchTerm.trim().toLocaleLowerCase("pt-BR"),
          item = s.item,
          text = [
            item.name,
            item.internalCode,
            item.barcode,
            item.manufacturer,
            item.location.name,
            item.location.room,
            item.location.container,
            item.supplierReference,
            ...s.reservations.flatMap((reservation) => [
              reservation.serviceOrderNumberSnapshot,
              reservation.serviceOrderTitleSnapshot,
              reservation.purpose,
              reservation.status,
            ]),
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase("pt-BR");
        return (
          (!q || text.includes(q)) &&
          (preferences.statusFilter === "ALL" || s.status === preferences.statusFilter) &&
          (preferences.categoryFilter === "ALL" ||
            item.category === preferences.categoryFilter) &&
          (preferences.unitFilter === "ALL" || item.unit === preferences.unitFilter) &&
          (preferences.locationFilter === "ALL" ||
            item.location.name === preferences.locationFilter) &&
          (preferences.stockFilter === "ALL" ||
            (preferences.stockFilter === "WITH_STOCK" && s.physicalQuantity > 0) ||
            (preferences.stockFilter === "WITHOUT_STOCK" && s.physicalQuantity <= 0) ||
            (preferences.stockFilter === "BELOW_MINIMUM" &&
              s.physicalQuantity <= item.minimumQuantity)) &&
          (!item.archivedAt ||
            preferences.includeArchived ||
            preferences.statusFilter === "ARCHIVED")
        );
      }),
    [items, preferences],
  );
  const locations = useMemo(
    () => Array.from(new Set(items.map((s) => s.item.location.name))).sort(),
    [items],
  );
  async function saveItem(input: StockItemFormValues) {
    setBusy(true);
    setError(null);
    if (editing) {
      const result = await updateStockItemAction(editing.item.id, input);
      if (result.ok) {
        setSuccess("Item atualizado.");
        setFormOpen(false);
        setEditing(null);
        await load();
      } else setError(result.error.message);
    } else {
      const result = await createStockItemAction(input);
      if (result.ok) {
        setSuccess(result.data.warning ?? "Item cadastrado.");
        setFormOpen(false);
        await load();
      } else setError(result.error.message);
    }
    setBusy(false);
  }
  async function saveMovement(input: StockMovementFormValues) {
    setBusy(true);
    setError(null);
    const result = await createStockMovementAction(input);
    if (result.ok) {
      setSuccess("Movimento registrado e saldos recalculados.");
      setMovement(null);
      await load();
    } else setError(result.error.message);
    setBusy(false);
  }
  async function savePurchase(input: StockPurchaseFormValues) {
    setBusy(true);
    setError(null);
    const result = await createStockPurchaseAction(input);
    if (result.ok) {
      setSuccess("Compra cadastrada como rascunho.");
      setPurchaseOpen(false);
      await load();
    } else setError(result.error.message);
    setBusy(false);
  }
  async function archive(reason: string) {
    if (!archiving) return;
    setBusy(true);
    const result = await archiveStockItemAction(archiving.item.id, reason);
    if (result.ok) {
      setSuccess("Item arquivado com histórico preservado.");
      setArchiving(null);
      await load();
    } else setError(result.error.message);
    setBusy(false);
  }
  return (
    <div className="space-y-3">
      <EstoqueFilters
        preferences={preferences}
        locations={locations}
        onChange={setPreferences}
        onNew={() => {
          setEditing(null);
          setError(null);
          setFormOpen(true);
        }}
        onMovement={(type) => {
          setError(null);
          setMovement({ type });
        }}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setError(null);
            setPurchaseOpen(true);
          }}
        >
          Nova compra
        </Button>
      </div>
      {error && !formOpen && !movement ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-rose-500/30 p-3 text-sm text-rose-600"
        >
          <span>{error}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              const result = await recoverStockBackupAction();
              if (result.ok) {
                setError(null);
                setSuccess("Backup recuperado.");
                await load();
              } else setError(result.error.message);
            }}
          >
            Recuperar backup
          </Button>
        </div>
      ) : null}
      {success ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 p-3 text-sm text-emerald-700 dark:text-emerald-300"
        >
          {success}
        </div>
      ) : null}
      {loading ? (
        <div
          className="h-64 animate-pulse rounded-xl bg-muted"
          aria-label="Carregando estoque"
        />
      ) : (
        <>
          <EstoqueSummary items={items} purchases={purchases} />
          <StockPurchasesList purchases={purchases} />
          {items.length === 0 ? (
            <EmptyState
              title="Estoque vazio"
              description="Cadastre o primeiro material ou insumo."
              action={<Button onClick={() => setFormOpen(true)}>Novo item</Button>}
            />
          ) : (
            <EstoqueList
              view={preferences.view}
              items={filtered}
              onEdit={(s) => {
                setEditing(s);
                setError(null);
                setFormOpen(true);
              }}
              onArchive={setArchiving}
              onMovement={(item, type) => {
                setError(null);
                setMovement({ item, type });
              }}
            />
          )}
        </>
      )}
      <StockFormDrawer
        open={formOpen}
        item={editing?.item}
        busy={busy}
        error={error}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
          setError(null);
        }}
        onSave={saveItem}
      />
      <StockMovementDrawer
        open={Boolean(movement)}
        items={items}
        initialItemId={movement?.item?.item.id}
        initialType={movement?.type}
        busy={busy}
        error={error}
        onClose={() => {
          setMovement(null);
          setError(null);
        }}
        onSave={saveMovement}
      />
      <StockPurchaseDialog
        open={purchaseOpen}
        stock={items}
        busy={busy}
        error={error}
        onClose={() => {
          setPurchaseOpen(false);
          setError(null);
        }}
        onSave={savePurchase}
      />
      <StockConfirmationDialog
        open={Boolean(archiving)}
        title="Arquivar item?"
        description="O cadastro, os movimentos e o histórico serão preservados. Novos movimentos serão bloqueados."
        confirmLabel="Arquivar"
        busy={busy}
        onClose={() => setArchiving(null)}
        onConfirm={archive}
      />
    </div>
  );
}
export default EstoquePageContent;
