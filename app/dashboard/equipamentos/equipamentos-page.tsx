"use client";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  archiveEquipmentAction,
  createEquipmentAction,
  listEquipmentStateAction,
  updateEquipmentAction,
} from "./equipamentos-actions";
import { EquipmentConfirmationDialog } from "./equipamento-confirmation-dialog";
import { EquipmentFormDrawer } from "./equipamento-form-drawer";
import { EquipamentosFilters, type EquipmentFilters } from "./equipamentos-filters";
import { EquipamentosList } from "./equipamentos-list";
import { EquipamentosSummary } from "./equipamentos-summary";
import { depreciation, equipmentIndicators, warrantyStatus } from "./equipamentos-selectors";
import type { EquipmentFormValues } from "./equipamentos-schema";
import type {
  EquipmentAsset,
  EquipmentStorageState,
  EquipmentView,
} from "./equipamentos-types";
const initial: EquipmentFilters = {
  search: "",
  type: "ALL",
  category: "ALL",
  ownership: "ALL",
  status: "ALL",
  condition: "ALL",
  depreciation: "ALL",
  maintenance: "ALL",
  warranty: "ALL",
  critical: "ALL",
};
export function EquipamentosPageContent() {
  const [state, setState] = useState<EquipmentStorageState | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [view, setView] = useState<EquipmentView>("list"),
    [filters, setFilters] = useState(initial),
    [drawer, setDrawer] = useState(false),
    [editing, setEditing] = useState<EquipmentAsset | null>(null),
    [archive, setArchive] = useState<EquipmentAsset | null>(null),
    [busy, setBusy] = useState(false),
    [formError, setFormError] = useState("");
  const load = async () => {
    const r = await listEquipmentStateAction();
    if (r.ok) {
      setState(r.data);
      setError("");
    } else setError(r.error.message);
    setLoading(false);
  };
  useEffect(() => {
    void listEquipmentStateAction().then((r) => {
      if (r.ok) setState(r.data);
      else setError(r.error.message);
      setLoading(false);
    });
  }, []);
  const active = state?.assets.filter((a) => !a.archivedAt) ?? [],
    categories = [...new Set(active.map((a) => a.category))].sort(),
    filtered = (() => {
      const q = filters.search.trim().toLocaleLowerCase("pt-BR");
      return active.filter((a) => {
          const maintenance = state?.maintenanceRecords.filter((item) => item.assetId === a.id) ?? [];
          const links = state?.serviceOrderLinks.filter((item) => item.assetId === a.id && !item.unlinkedAt) ?? [];
          const indicators = equipmentIndicators(a, maintenance);
          return (
          (!q ||
            [
              a.name,
              a.internalCode,
              a.manufacturer,
              a.model,
              a.serialNumber,
              a.patrimonyNumber,
              a.responsible,
              a.location.name,
              a.location.room,
              a.location.container,
              a.clientNameSnapshot,
              ...maintenance.map((item) => item.supplier),
              ...links.map((item) => item.serviceOrderNumberSnapshot),
            ].some((x) => x?.toLocaleLowerCase("pt-BR").includes(q))) &&
          (filters.type === "ALL" || a.assetType === filters.type) &&
          (filters.category === "ALL" || a.category === filters.category) &&
          (filters.ownership === "ALL" || a.ownership === filters.ownership) &&
          (filters.status === "ALL" || a.status === filters.status) &&
          (filters.condition === "ALL" || a.condition === filters.condition) &&
          (filters.depreciation === "ALL" ||
            a.depreciation.mode === filters.depreciation) &&
          (filters.warranty === "ALL" || warrantyStatus(a) === filters.warranty) &&
          (filters.critical === "ALL" || indicators.critical) &&
          (filters.maintenance === "ALL" ||
            (filters.maintenance === "OVERDUE"
              ? indicators.maintenanceOverdue
              : maintenance.some((item) => item.status === filters.maintenance)))
          );
      });
    })();
  const save = async (v: EquipmentFormValues) => {
    setBusy(true);
    const r = editing
      ? await updateEquipmentAction(editing.id, v)
      : await createEquipmentAction(v);
    if (r.ok) {
      await load();
      setDrawer(false);
      setNotice(editing ? "Equipamento atualizado." : "Equipamento cadastrado.");
    } else setFormError(r.error.message);
    setBusy(false);
  };
  const confirmArchive = async (reason: string) => {
    if (!archive) return;
    setBusy(true);
    const r = await archiveEquipmentAction(archive.id, reason);
    if (r.ok) {
      await load();
      setArchive(null);
      setNotice("Equipamento arquivado com histórico preservado.");
    } else setError(r.error.message);
    setBusy(false);
  };
  if (loading) return <div className="h-80 animate-pulse rounded-xl bg-muted" />;
  if (!state)
    return <EmptyState title="Equipamentos indisponíveis" description={error} />;
  const patrimonial = active
    .filter((a) => a.ownership === "COMPANY")
    .reduce((s, a) => s + depreciation(a).currentValueCents, 0);
  return (
    <div className="space-y-3">
      <EquipamentosFilters
        view={view}
        filters={filters}
        categories={categories}
        onViewChange={setView}
        onChange={setFilters}
        onNew={() => {
          setEditing(null);
          setFormError("");
          setDrawer(true);
        }}
      />
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      <EquipamentosSummary
        total={active.length}
        critical={active.filter((a) => equipmentIndicators(a, state.maintenanceRecords.filter((item) => item.assetId === a.id)).critical).length}
        maintenance={active.filter((a) => a.status === "UNDER_MAINTENANCE").length}
        available={active.filter((a) => a.status === "AVAILABLE").length}
        patrimonialValueCents={patrimonial}
        warrantyAlerts={active.filter((a) => ["EXPIRED", "EXPIRING_SOON"].includes(warrantyStatus(a))).length}
      />
      <EquipamentosList
        view={view}
        assets={filtered}
        maintenanceRecords={state.maintenanceRecords}
        onEdit={(a) => {
          setEditing(a);
          setFormError("");
          setDrawer(true);
        }}
        onArchive={setArchive}
      />
      <EquipmentFormDrawer
        open={drawer}
        asset={editing}
        busy={busy}
        error={formError}
        onClose={() => setDrawer(false)}
        onSubmit={save}
      />
      <EquipmentConfirmationDialog
        open={Boolean(archive)}
        busy={busy}
        onClose={() => setArchive(null)}
        onConfirm={confirmArchive}
      />
    </div>
  );
}
export default EquipamentosPageContent;
