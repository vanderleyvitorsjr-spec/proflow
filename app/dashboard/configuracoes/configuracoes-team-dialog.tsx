"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { TeamMember } from "./configuracoes-types";
type Draft = Omit<TeamMember, "id" | "createdAt" | "updatedAt" | "history">;
const empty: Draft = {
  name: "",
  role: "TECHNICIAN",
  specialties: [],
  phone: "",
  email: "",
  document: "",
  hourlyCostCents: 0,
  burdenRateBasisPoints: 0,
  active: true,
  colorIdentifier: "sky",
  availability: "Segunda a sexta, 08:00 às 18:00",
  notes: "",
};
export function ConfigurationTeamDialog({
  open,
  member,
  onClose,
  onSave,
}: {
  open: boolean;
  member?: TeamMember;
  onClose: () => void;
  onSave: (value: Draft, id?: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(empty),
    [saving, setSaving] = useState(false),
    first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setDraft(
          member
            ? {
              name: member.name,
              role: member.role,
              specialties: member.specialties,
              phone: member.phone,
              email: member.email,
              document: member.document,
              hourlyCostCents: member.hourlyCostCents,
              burdenRateBasisPoints: member.burdenRateBasisPoints,
              active: member.active,
              colorIdentifier: member.colorIdentifier,
              availability: member.availability,
              notes: member.notes,
                archivedAt: member.archivedAt,
              }
            : empty,
        );
        first.current?.focus();
      });
    }
  }, [open, member]);
  if (!open) return null;
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-3"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <form
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-card p-5 shadow-xl"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          await onSave(draft, member?.id);
          setSaving(false);
        }}
      >
        <h2 className="text-base font-semibold">
          {member ? "Editar integrante" : "Novo integrante"}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">
            Nome
            <Input
              ref={first}
              className="mt-1"
              required
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </label>
          <label className="text-xs font-medium">
            Perfil organizacional
            <Select
              className="mt-1"
              value={draft.role}
              onChange={(e) => update("role", e.target.value)}
            >
              {[
                "ADMINISTRATOR",
                "MANAGER",
                "ATTENDANT",
                "SELLER",
                "TECHNICIAN",
                "ASSISTANT",
                "ELECTRICIAN",
                "SUPERVISOR",
                "FINANCIAL",
                "OTHER",
              ].map((role) => (
                <option key={role}>{role}</option>
              ))}
            </Select>
          </label>
          <label className="text-xs font-medium">
            Telefone
            <Input
              className="mt-1"
              value={draft.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="(73) 9 8893-6763"
            />
          </label>
          <label className="text-xs font-medium">
            E-mail
            <Input
              className="mt-1"
              type="email"
              value={draft.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </label>
          <label className="text-xs font-medium">
            CPF/CNPJ opcional
            <Input
              className="mt-1"
              value={draft.document}
              onChange={(e) => update("document", e.target.value)}
            />
          </label>
          <label className="text-xs font-medium">
            Especialidades, separadas por vírgula
            <Input
              className="mt-1"
              value={draft.specialties.join(", ")}
              onChange={(e) =>
                update(
                  "specialties",
                  e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                )
              }
            />
          </label>
          <label className="text-xs font-medium">
            Custo/hora (R$)
            <Input
              className="mt-1"
              type="number"
              min="0"
              step="0.01"
              value={draft.hourlyCostCents / 100}
              onChange={(e) =>
                update("hourlyCostCents", Math.round(Number(e.target.value) * 100))
              }
            />
          </label>
          <label className="text-xs font-medium">
            Encargos (%)
            <Input
              className="mt-1"
              type="number"
              min="0"
              step="0.01"
              value={draft.burdenRateBasisPoints / 100}
              onChange={(e) =>
                update("burdenRateBasisPoints", Math.round(Number(e.target.value) * 100))
              }
            />
          </label>
          <label className="text-xs font-medium sm:col-span-2">
            Disponibilidade padrão
            <Input
              className="mt-1"
              value={draft.availability}
              onChange={(e) => update("availability", e.target.value)}
            />
          </label>
          <label className="text-xs font-medium sm:col-span-2">
            Observações
            <textarea
              className="mt-1 min-h-20 w-full rounded-md border bg-background p-2 text-sm"
              value={draft.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={saving}>
            {saving ? "Salvando..." : "Salvar integrante"}
          </Button>
        </div>
      </form>
    </div>
  );
}
