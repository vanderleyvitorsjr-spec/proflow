"use client";
import { Button } from "@/components/ui/button";
export function ConfigurationConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  danger = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        className="w-full max-w-md rounded-xl border bg-card p-5 shadow-xl"
      >
        <h2 id="confirmation-title" className="text-base font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button autoFocus variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={danger ? "destructive" : "default"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
