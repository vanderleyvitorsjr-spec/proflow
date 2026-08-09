"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { EquipmentClientReference } from "./equipamentos-relations-gateway";

export function EquipmentClientDialog({ open, clients, currentId, busy, onClose, onLink, onUnlink }: {
  open: boolean; clients: EquipmentClientReference[]; currentId?: string; busy: boolean;
  onClose: () => void; onLink: (id: string) => Promise<void>; onUnlink: () => Promise<void>;
}) {
  const [id, setId] = useState(currentId ?? "");
  useEffect(() => { if (open) queueMicrotask(() => setId(currentId ?? clients[0]?.id ?? "")); }, [clients, currentId, open]);
  useEffect(() => { if (!open) return; const key = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [busy, onClose, open]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"><section role="dialog" aria-modal="true" aria-labelledby="client-link-title" className="w-full max-w-md rounded-xl border bg-background p-5 shadow-2xl"><h2 id="client-link-title" className="font-bold">Vínculo com cliente</h2><p className="mt-1 text-sm text-muted-foreground">Somente clientes ativos podem receber novos vínculos.</p><div className="mt-4"><Label htmlFor="equipment-client">Cliente</Label><Select id="equipment-client" autoFocus value={id} onChange={(event) => setId(event.target.value)}><option value="">Selecione</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</Select></div>{currentId ? <Link className="mt-3 inline-block text-sm text-primary hover:underline" href={`/dashboard/clientes/${currentId}`}>Abrir cliente atual</Link> : null}<footer className="mt-5 flex flex-wrap justify-end gap-2">{currentId ? <Button variant="destructive" disabled={busy} onClick={() => void onUnlink()}>Remover vínculo</Button> : null}<Button variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button><Button disabled={busy || !id} onClick={() => void onLink(id)}>{busy ? "Salvando..." : currentId ? "Alterar cliente" : "Vincular cliente"}</Button></footer></section></div>;
}
