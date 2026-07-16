"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { financialReasonSchema } from "./financeiro-schema";
export function FinanceiroCancelDialog({
  open,
  title,
  description,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState(""),
    [validation, setValidation] = useState("");
  useEffect(() => {
    if (open)
      queueMicrotask(() => {
        setReason("");
        setValidation("");
      });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [busy, onClose, open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reason-title"
        className="w-full max-w-md rounded-xl border border-border bg-background p-5 shadow-2xl"
      >
        <h2 id="reason-title" className="text-lg font-bold">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <div className="mt-4">
          <Label htmlFor="reason">Motivo obrigatório</Label>
          <textarea
            id="reason"
            autoFocus
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        {(validation || error) && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
          >
            {validation || error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => {
              const parsed = financialReasonSchema.safeParse({ reason });
              if (!parsed.success)
                setValidation(parsed.error.issues[0]?.message ?? "Informe o motivo.");
              else void onConfirm(parsed.data.reason);
            }}
          >
            {busy ? "Processando..." : "Confirmar"}
          </Button>
        </div>
      </section>
    </div>
  );
}
