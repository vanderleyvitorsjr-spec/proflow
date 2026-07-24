"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpHint } from "@/components/ui/help-hint";
import { Select } from "@/components/ui/select";
import { maintenanceFormSchema, type MaintenanceFormValues } from "./equipamentos-schema";
import type { EquipmentServiceOrderReference } from "./equipamentos-relations-gateway";
import type { MaintenanceRecord } from "./equipamentos-types";
const empty: MaintenanceFormValues = { type: "PREVENTIVE", title: "", description: "", supplier: "", cost: "0,00", scheduledAt: "", nextMaintenanceAt: "", serviceOrderId: "", responsible: "", notes: "" };
const fromRecord = (record: MaintenanceRecord): MaintenanceFormValues => ({ type: record.type, title: record.title, description: record.description, supplier: record.supplier, cost: (record.costCents / 100).toFixed(2).replace(".", ","), scheduledAt: record.scheduledAt.slice(0, 10), nextMaintenanceAt: record.nextMaintenanceAt?.slice(0, 10) ?? "", serviceOrderId: record.serviceOrderId ?? "", responsible: record.responsible, notes: record.notes });
export function EquipmentMaintenanceDrawer({ open, record, orders, busy, error, onClose, onSubmit }: { open: boolean; record?: MaintenanceRecord | null; orders: EquipmentServiceOrderReference[]; busy: boolean; error?: string; onClose: () => void; onSubmit: (value: MaintenanceFormValues) => Promise<void> }) {
  const [value, setValue] = useState(empty), [validation, setValidation] = useState("");
  useEffect(() => { if (open) queueMicrotask(() => { setValue(record ? fromRecord(record) : empty); setValidation(""); }); }, [open, record]);
  useEffect(() => { if (!open) return; const key = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [busy, onClose, open]);
  if (!open) return null;
  const set = <K extends keyof MaintenanceFormValues>(field: K, next: MaintenanceFormValues[K]) => setValue((current) => ({ ...current, [field]: next }));
  const submit = async (event: FormEvent) => { event.preventDefault(); const parsed = maintenanceFormSchema.safeParse(value); if (!parsed.success) { setValidation(parsed.error.issues[0]?.message ?? "Revise os campos."); return; } await onSubmit(parsed.data); };
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45"><form role="dialog" aria-modal="true" aria-labelledby="maintenance-title" onSubmit={submit} className="h-full w-full max-w-2xl overflow-y-auto border-l bg-background p-5 shadow-2xl"><h2 id="maintenance-title" className="text-lg font-bold">{record ? "Editar manutenção" : "Registrar manutenção"}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><Label htmlFor="maintenance-type">Tipo</Label><Select id="maintenance-type" autoFocus value={value.type} onChange={(e) => set("type", e.target.value as MaintenanceFormValues["type"])}><option value="PREVENTIVE">Preventiva</option><option value="CORRECTIVE">Corretiva</option></Select></div><Field id="maintenance-title-field" label="Título" value={value.title} onChange={(v) => set("title", v)} /><Field id="maintenance-date" label="Programada para" type="date" value={value.scheduledAt} onChange={(v) => set("scheduledAt", v)} /><Field id="maintenance-next" label="Próxima manutenção" type="date" value={value.nextMaintenanceAt} onChange={(v) => set("nextMaintenanceAt", v)} /><Field id="maintenance-supplier" label="Fornecedor" value={value.supplier} onChange={(v) => set("supplier", v)} /><Field id="maintenance-cost" label="Custo (R$)" value={value.cost} onChange={(v) => set("cost", v)} /><Field id="maintenance-responsible" label="Responsável" value={value.responsible} onChange={(v) => set("responsible", v)} /><div><Label htmlFor="maintenance-order">Ordem de Serviço</Label><Select id="maintenance-order" value={value.serviceOrderId} onChange={(e) => set("serviceOrderId", e.target.value)}><option value="">Sem vínculo</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.number} · {order.title}</option>)}</Select></div><Field id="maintenance-description" label="Descrição" value={value.description} onChange={(v) => set("description", v)} /><Field id="maintenance-notes" label="Observações" value={value.notes} onChange={(v) => set("notes", v)} /></div>{validation || error ? <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{validation || error}</p> : null}<footer className="mt-6 flex justify-end gap-2"><Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button><Button disabled={busy}>{busy ? "Salvando..." : "Salvar manutenção"}</Button></footer></form></div>;
}
const maintenanceHelp: Record<string, string> = {
  "maintenance-title-field": "Identifique o serviço realizado ou programado.",
  "maintenance-date": "Data prevista para executar a manutenção.",
  "maintenance-next": "Próxima data recomendada após este atendimento.",
  "maintenance-cost": "Valor total previsto ou cobrado pela manutenção.",
  "maintenance-responsible": "Pessoa que executará ou acompanhará o serviço.",
};
function Field({ id, label, value, onChange, type = "text" }: { id: string; label: string; value: string; onChange: (value: string) => void; type?: string }) { return <div><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />{maintenanceHelp[id] ? <HelpHint text={maintenanceHelp[id]} className="mt-1.5" /> : null}</div>; }
