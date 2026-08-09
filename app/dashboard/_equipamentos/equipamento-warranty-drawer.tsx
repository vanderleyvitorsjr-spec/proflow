"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpHint } from "@/components/ui/help-hint";
import { warrantyFormSchema, type WarrantyFormValues } from "./equipamentos-schema";
import type { EquipmentWarranty } from "./equipamentos-types";
const empty: WarrantyFormValues = { startDate: "", endDate: "", supplier: "", description: "", documentReference: "", notes: "" };
export function EquipmentWarrantyDrawer({ open, warranty, busy, error, onClose, onSubmit, onRemove }: { open: boolean; warranty?: EquipmentWarranty; busy: boolean; error?: string; onClose: () => void; onSubmit: (value: WarrantyFormValues) => Promise<void>; onRemove: () => Promise<void> }) {
  const [value, setValue] = useState(empty), [validation, setValidation] = useState("");
  useEffect(() => { if (open) queueMicrotask(() => setValue(warranty ? { startDate: warranty.startDate ?? "", endDate: warranty.endDate ?? "", supplier: warranty.supplier, description: warranty.description, documentReference: warranty.documentReference, notes: warranty.notes } : empty)); }, [open, warranty]);
  useEffect(() => { if (!open) return; const key = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [busy, onClose, open]);
  if (!open) return null;
  const set = (field: keyof WarrantyFormValues, next: string) => setValue((current) => ({ ...current, [field]: next }));
  const submit = async (event: FormEvent) => { event.preventDefault(); const parsed = warrantyFormSchema.safeParse(value); if (!parsed.success) { setValidation(parsed.error.issues[0]?.message ?? "Revise os campos."); return; } await onSubmit(parsed.data); };
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45"><form role="dialog" aria-modal="true" aria-labelledby="warranty-title" onSubmit={submit} className="h-full w-full max-w-lg overflow-y-auto border-l bg-background p-5 shadow-2xl"><h2 id="warranty-title" className="text-lg font-bold">Garantia do equipamento</h2><p className="text-sm text-muted-foreground">O estado é derivado automaticamente pela data atual.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field id="warranty-start" label="Início" type="date" autoFocus value={value.startDate} onChange={(v) => set("startDate", v)} /><Field id="warranty-end" label="Fim" type="date" value={value.endDate} onChange={(v) => set("endDate", v)} /><Field id="warranty-supplier" label="Fornecedor" value={value.supplier} onChange={(v) => set("supplier", v)} /><Field id="warranty-document" label="Referência documental" value={value.documentReference} onChange={(v) => set("documentReference", v)} /><Field id="warranty-description" label="Descrição" value={value.description} onChange={(v) => set("description", v)} /><Field id="warranty-notes" label="Observações" value={value.notes} onChange={(v) => set("notes", v)} /></div>{validation || error ? <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{validation || error}</p> : null}<footer className="mt-6 flex flex-wrap justify-end gap-2">{warranty ? <Button type="button" variant="destructive" disabled={busy} onClick={() => void onRemove()}>Remover garantia</Button> : null}<Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button><Button disabled={busy}>{busy ? "Salvando..." : "Salvar garantia"}</Button></footer></form></div>;
}
const warrantyHelp: Record<string, string> = {
  "warranty-start": "Data em que a cobertura começou.",
  "warranty-end": "Após esta data, o equipamento será indicado como fora da garantia.",
  "warranty-supplier": "Empresa responsável por atender a garantia.",
  "warranty-document": "Número da nota fiscal, certificado ou termo de garantia.",
};
function Field({ id, label, value, onChange, type = "text", autoFocus }: { id: string; label: string; value: string; onChange: (value: string) => void; type?: string; autoFocus?: boolean }) { return <div><Label htmlFor={id}>{label}</Label><Input id={id} type={type} autoFocus={autoFocus} value={value} onChange={(event) => onChange(event.target.value)} />{warrantyHelp[id] ? <HelpHint text={warrantyHelp[id]} className="mt-1.5" /> : null}</div>; }
