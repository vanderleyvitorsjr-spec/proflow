"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { EquipmentServiceOrderReference } from "./equipamentos-relations-gateway";
export function EquipmentServiceOrderDialog({ open, orders, busy, onClose, onLink }: { open: boolean; orders: EquipmentServiceOrderReference[]; busy: boolean; onClose: () => void; onLink: (id: string, purpose: string) => Promise<void> }) {
  const [id, setId] = useState(""), [purpose, setPurpose] = useState("");
  useEffect(() => { if (open) queueMicrotask(() => { setId(orders[0]?.id ?? ""); setPurpose(""); }); }, [open, orders]);
  useEffect(() => { if (!open) return; const key = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [busy, onClose, open]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"><section role="dialog" aria-modal="true" aria-labelledby="order-link-title" className="w-full max-w-lg rounded-xl border bg-background p-5 shadow-2xl"><h2 id="order-link-title" className="font-bold">Vincular Ordem de Serviço</h2><p className="mt-1 text-sm text-muted-foreground">Ordens canceladas ou arquivadas não são elegíveis.</p><div className="mt-4 space-y-3"><div><Label htmlFor="equipment-order">Ordem</Label><Select id="equipment-order" autoFocus value={id} onChange={(event) => setId(event.target.value)}><option value="">Selecione</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.number} · {order.title}</option>)}</Select></div><div><Label htmlFor="equipment-order-purpose">Finalidade</Label><Input id="equipment-order-purpose" value={purpose} onChange={(event) => setPurpose(event.target.value)} /></div></div><footer className="mt-5 flex justify-end gap-2"><Button variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button><Button disabled={busy || !id} onClick={() => void onLink(id, purpose)}>{busy ? "Vinculando..." : "Vincular"}</Button></footer></section></div>;
}
