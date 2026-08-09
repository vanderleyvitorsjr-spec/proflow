"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function EquipmentConfirmationDialog({
  open,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (open) queueMicrotask(() => setReason(""));
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="archive-title"
        className="w-full max-w-md rounded-xl border bg-background p-5 shadow-2xl"
      >
        <h2 id="archive-title" className="font-bold">
          Arquivar equipamento?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          O registro, aquisição, mídias e histórico serão preservados.
        </p>
        <div className="mt-4">
          <Label htmlFor="archive-reason">Motivo opcional</Label>
          <Input
            id="archive-reason"
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={() => void onConfirm(reason)}
            disabled={busy}
          >
            {busy ? "Arquivando..." : "Arquivar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
