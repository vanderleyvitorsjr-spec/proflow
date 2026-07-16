"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
export function FinanceiroConfirmationDialog({
  open,
  title,
  description,
  busy,
  confirmLabel = "Confirmar",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  busy?: boolean;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [busy, onCancel, open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 p-4">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="financial-confirm-title"
        aria-describedby="financial-confirm-description"
        className="w-full max-w-md rounded-xl border border-border bg-background p-5 shadow-2xl"
      >
        <h2 id="financial-confirm-title" className="text-lg font-bold">
          {title}
        </h2>
        <p
          id="financial-confirm-description"
          className="mt-2 text-sm text-muted-foreground"
        >
          {description}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Voltar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy ? "Processando..." : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
