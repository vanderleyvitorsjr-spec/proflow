"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function PricingCompositionDialog({
  open,
  busy,
  onClose,
  onSave,
}: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, busy, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="composition-title"
        className="w-full max-w-md rounded-xl border bg-background p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          void onSave(String(d.get("name")), String(d.get("description")));
        }}
      >
        <h2 id="composition-title" className="font-semibold">
          Nova composição
        </h2>
        <div className="mt-4">
          <Label htmlFor="composition-name">Nome</Label>
          <Input id="composition-name" name="name" autoFocus required />
        </div>
        <div className="mt-3">
          <Label htmlFor="composition-description">Descrição</Label>
          <Input id="composition-description" name="description" />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={busy}>Criar composição</Button>
        </div>
      </form>
    </div>
  );
}
