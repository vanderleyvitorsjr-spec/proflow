"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { nextBusinessDay, tomorrow } from "./central-operacional-state";

const reasons = [
  "Aguardando Cliente",
  "Aguardando Material",
  "Aguardando Técnico",
  "Aguardando Pagamento",
  "Aguardando Documento",
  "Reagendamento",
  "Dependência Externa",
  "Revisão Necessária",
  "Outro",
];
const results = [
  "Resolvido",
  "Não Aplicável",
  "Cancelado",
  "Duplicado",
  "Corrigido",
  "Concluído por Outra Ação",
];
const localInput = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export function OperationalItemDialog({
  mode,
  title,
  onClose,
  onConfirm,
}: {
  mode: "SNOOZE" | "RESOLVE" | "REOPEN";
  title: string;
  onClose: () => void;
  onConfirm: (value: {
    until?: string;
    reason: string;
    note?: string;
    responsible?: string;
    priority?: string;
    result?: string;
  }) => Promise<void>;
}) {
  const [until, setUntil] = useState(localInput(tomorrow()));
  const [reason, setReason] = useState(mode === "SNOOZE" ? reasons[0]! : "");
  const [note, setNote] = useState("");
  const [responsible, setResponsible] = useState("");
  const [priority, setPriority] = useState("WARNING");
  const [result, setResult] = useState(results[0]!);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialogTitle =
    mode === "SNOOZE"
      ? "Adiar Pendência"
      : mode === "RESOLVE"
        ? "Resolver Pendência"
        : "Reabrir Pendência";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-3">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="operational-item-title"
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            await onConfirm({
              until: mode === "SNOOZE" ? new Date(until).toISOString() : undefined,
              reason,
              note,
              responsible,
              priority,
              result,
            });
            onClose();
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Não foi possível concluir a ação.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <header className="border-b p-4">
          <h2 id="operational-item-title" className="font-semibold">{dialogTitle}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{title}</p>
        </header>
        <div className="space-y-3 overflow-y-auto p-4">
          {mode === "SNOOZE" ? (
            <>
              <div className="flex flex-wrap gap-2" aria-label="Opções rápidas de adiamento">
                <Button type="button" size="sm" variant="secondary" onClick={() => setUntil(localInput(tomorrow()))}>Amanhã</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setUntil(localInput(nextBusinessDay()))}>Próximo Dia Útil</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => { const date = new Date(); date.setDate(date.getDate() + 3); setUntil(localInput(date)); }}>Em 3 Dias</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => { const date = new Date(); date.setDate(date.getDate() + 7); setUntil(localInput(date)); }}>Em 7 Dias</Button>
              </div>
              <Field label="Nova Data e Horário"><Input type="datetime-local" value={until} onChange={(event) => setUntil(event.target.value)} /></Field>
              <Field label="Motivo"><Select value={reason} onChange={(event) => setReason(event.target.value)}>{reasons.map((item) => <option key={item}>{item}</option>)}</Select></Field>
              <Field label="Prioridade Após o Adiamento"><Select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="CRITICAL">Crítica</option><option value="WARNING">Alta</option><option value="MEDIUM">Média</option><option value="LOW">Baixa</option><option value="INFO">Informativa</option></Select></Field>
            </>
          ) : mode === "RESOLVE" ? (
            <>
              <Field label="Resolução"><Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ex.: Cadastro corrigido após contato com o cliente" /></Field>
              <Field label="Resultado"><Select value={result} onChange={(event) => setResult(event.target.value)}>{results.map((item) => <option key={item}>{item}</option>)}</Select></Field>
            </>
          ) : (
            <Field label="Motivo da Reabertura"><Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explique por que a pendência precisa voltar à lista ativa" /></Field>
          )}
          <Field label="Responsável Opcional"><Input value={responsible} onChange={(event) => setResponsible(event.target.value)} placeholder="Ex.: Equipe Administrativa" /></Field>
          <Field label="Observação Opcional"><textarea className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm" value={note} onChange={(event) => setNote(event.target.value)} /></Field>
          {error ? <p role="alert" className="text-sm text-rose-600">{error}</p> : null}
        </div>
        <footer className="flex justify-end gap-2 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button disabled={busy}>{busy ? "Salvando..." : "Confirmar"}</Button>
        </footer>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1 text-xs font-medium text-muted-foreground"><span>{label}</span>{children}</label>;
}
