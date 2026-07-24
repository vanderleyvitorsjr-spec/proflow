"use client";

import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { OrdemChecklistItem } from "./ordens-types";

const categories: Array<[OrdemChecklistItem["category"], string]> = [
  ["PRE_SERVICE", "Pré-atendimento"],
  ["MATERIALS", "Materiais"],
  ["INSTALLATION", "Instalação"],
  ["ELECTRICAL", "Elétrica"],
  ["TESTS", "Testes"],
  ["DOCUMENTATION", "Documentação"],
  ["DELIVERY", "Entrega"],
  ["POST_SERVICE", "Pós-atendimento"],
];
const statuses: Array<[OrdemChecklistItem["status"], string]> = [
  ["PENDING", "Pendente"],
  ["IN_PROGRESS", "Em andamento"],
  ["COMPLETED", "Concluído"],
  ["BLOCKED", "Bloqueado"],
  ["SKIPPED", "Ignorado"],
];

export function OrdemChecklist({
  items,
  saving,
  onSave,
}: {
  items: OrdemChecklistItem[];
  saving: boolean;
  onSave: (items: OrdemChecklistItem[]) => Promise<void>;
}) {
  const [draft, setDraft] = useState(items);
  const [filter, setFilter] = useState("ALL");
  const visible = useMemo(
    () =>
      draft
        .filter(
          (item) =>
            filter === "ALL" || item.status === filter || item.category === filter,
        )
        .sort((a, b) => a.order - b.order),
    [draft, filter],
  );
  const completed = draft.filter((item) => item.status === "COMPLETED").length;
  const update = (id: string, patch: Partial<OrdemChecklistItem>) =>
    setDraft((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  const move = (id: string, direction: -1 | 1) =>
    setDraft((current) => {
      const ordered = [...current].sort((a, b) => a.order - b.order);
      const index = ordered.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= ordered.length) return current;
      [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
      return ordered.map((item, order) => ({ ...item, order }));
    });
  const add = () => {
    const now = new Date().toISOString();
    setDraft((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        serviceOrderId: current[0]?.serviceOrderId ?? "",
        title: "",
        description: "",
        category: "PRE_SERVICE",
        status: "PENDING",
        required: false,
        responsible: "",
        order: current.length,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Checklist operacional</h2>
          <p className="text-xs text-muted-foreground">
            {draft.length ? Math.round((completed / draft.length) * 100) : 0}% concluído
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            className="w-44"
            value={filter}
            aria-label="Filtrar checklist"
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="ALL">Todos os itens</option>
            {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <Button size="sm" variant="secondary" onClick={add}>
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {visible.length ? (
        <div className="space-y-2">
          {visible.map((item) => (
            <article key={item.id} className="grid gap-2 rounded-lg border p-3 xl:grid-cols-[minmax(12rem,1fr)_10rem_10rem_11rem_auto]">
              <div className="space-y-2">
                <Input
                  value={item.title}
                  onChange={(event) => update(item.id, { title: event.target.value })}
                  placeholder="Ex.: Confirmar tensão elétrica do equipamento"
                  aria-label="Título do item"
                />
                <Input
                  value={item.description ?? ""}
                  onChange={(event) => update(item.id, { description: event.target.value })}
                  placeholder="Orientação opcional"
                  aria-label="Descrição do item"
                />
              </div>
              <Select
                value={item.category}
                aria-label="Categoria do item"
                onChange={(event) =>
                  update(item.id, {
                    category: event.target.value as OrdemChecklistItem["category"],
                  })
                }
              >
                {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
              <Select
                value={item.status}
                aria-label="Status do item"
                onChange={(event) =>
                  update(item.id, {
                    status: event.target.value as OrdemChecklistItem["status"],
                  })
                }
              >
                {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
              <div className="space-y-2">
                <Input
                  value={item.responsible}
                  onChange={(event) => update(item.id, { responsible: event.target.value })}
                  placeholder="Responsável"
                  aria-label="Responsável pelo item"
                />
                <Input
                  type="date"
                  value={item.dueDate ?? ""}
                  onChange={(event) => update(item.id, { dueDate: event.target.value || undefined })}
                  aria-label="Data prevista"
                />
              </div>
              <div className="flex items-start justify-end gap-1">
                <label className="flex h-9 items-center gap-1 px-2 text-xs">
                  <input
                    type="checkbox"
                    checked={item.required}
                    onChange={(event) => update(item.id, { required: event.target.checked })}
                  />
                  Obrigatório
                </label>
                <Button type="button" variant="ghost" size="icon" onClick={() => move(item.id, -1)} aria-label="Mover item para cima"><ArrowUp className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => move(item.id, 1)} aria-label="Mover item para baixo"><ArrowDown className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => setDraft((current) => current.filter((entry) => entry.id !== item.id))} aria-label="Remover item"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          size="compact"
          title={draft.length ? "Nenhum item corresponde ao filtro" : "Checklist ainda vazio"}
          description="Adicione as etapas necessárias para acompanhar a execução da Ordem."
        />
      )}
      <div className="flex justify-end">
        <Button
          onClick={() => void onSave(draft.filter((item) => item.title.trim()))}
          disabled={saving}
        >
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar checklist"}
        </Button>
      </div>
    </section>
  );
}
