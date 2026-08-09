"use client";

import Link from "next/link";
import { Check, HandCoins, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  acceptFinancialSuggestionAction,
  discardFinancialSuggestionAction,
} from "@/automation/suggestions/financial-suggestion-actions";
import type {
  FinancialSuggestion,
  FinancialSuggestionStatus,
} from "@/automation/suggestions/financial-suggestion-types";
import { confirmFinancialSuggestionDraftAction } from "@/automation/integrations/financial-suggestion-conversion";
import { listFinancialStateAction } from "@/app/dashboard/financeiro/financeiro-actions";
import { FinancialObligationFormDrawer } from "@/app/dashboard/financeiro/financeiro-receivable-form-drawer";
import type { FinancialObligationFormValues } from "@/app/dashboard/financeiro/financeiro-schema";
import type { FinancialAccountWithBalance } from "@/app/dashboard/financeiro/financeiro-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { Select } from "@/components/ui/select";
import {
  formatCurrencyBRLFromCents,
  formatDateBR,
  normalizeProperName,
} from "@/lib/br-formatters";

const statusLabels: Record<FinancialSuggestionStatus, string> = {
  PENDING: "Pendente",
  ACCEPTED: "Aceita",
  DISCARDED: "Descartada",
  CONVERTED: "Convertida",
};

export function FinancialSuggestions({
  suggestions,
  onChanged,
}: {
  suggestions: FinancialSuggestion[];
  onChanged: () => Promise<void>;
}) {
  const [status, setStatus] = useState("ALL");
  const [processingId, setProcessingId] = useState("");
  const [draft, setDraft] = useState<FinancialSuggestion | null>(null);
  const [accounts, setAccounts] = useState<FinancialAccountWithBalance[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filtered = useMemo(
    () =>
      suggestions.filter(
        (suggestion) => status === "ALL" || suggestion.status === status,
      ),
    [status, suggestions],
  );

  async function openDraft(suggestion: FinancialSuggestion) {
    setProcessingId(suggestion.id);
    setError("");
    try {
      if (suggestion.status === "PENDING")
        await acceptFinancialSuggestionAction(suggestion.id);
      const state = await listFinancialStateAction();
      if (!state.ok) throw new Error(state.error.message);
      setAccounts(
        state.data.accounts
          .filter((account) => !account.archivedAt)
          .map((account) => ({ ...account, currentBalanceCents: 0 })),
      );
      setDraft({ ...suggestion, status: "ACCEPTED" });
      setMessage(
        "Sugestão aceita. Revise o rascunho antes de confirmar a criação.",
      );
      await onChanged();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível preparar o rascunho financeiro.",
      );
    } finally {
      setProcessingId("");
    }
  }

  async function discard(id: string) {
    setProcessingId(id);
    setError("");
    try {
      await discardFinancialSuggestionAction(id);
      setMessage("Sugestão descartada.");
      await onChanged();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível descartar a sugestão.",
      );
    } finally {
      setProcessingId("");
    }
  }

  async function confirm(values: FinancialObligationFormValues) {
    if (!draft) return;
    setProcessingId(draft.id);
    setError("");
    try {
      const result = await confirmFinancialSuggestionDraftAction(draft.id, values);
      setDraft(null);
      setMessage(
        result.existing
          ? "O recebível já existia e foi vinculado à sugestão."
          : "Conta a receber criada como pendente. Nenhum pagamento ou saldo foi alterado.",
      );
      await onChanged();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível confirmar o rascunho financeiro.",
      );
    } finally {
      setProcessingId("");
    }
  }

  const counts = Object.fromEntries(
    (["PENDING", "ACCEPTED", "DISCARDED", "CONVERTED"] as const).map((item) => [
      item,
      suggestions.filter((suggestion) => suggestion.status === item).length,
    ]),
  ) as Record<FinancialSuggestionStatus, number>;

  return (
    <>
      <Card id="sugestoes-financeiras" className="scroll-mt-20">
        <CardHeader className="border-b px-4 py-3">
          <SectionHeader
            compact
            title="Sugestões Financeiras"
            description="Revise recebimentos sugeridos automaticamente após a conclusão das Ordens."
            actions={
              <Select
                className="w-44"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-label="Filtrar sugestões por status"
              >
                <option value="ALL">Todos os status</option>
                <option value="PENDING">Pendentes ({counts.PENDING})</option>
                <option value="ACCEPTED">Aceitas ({counts.ACCEPTED})</option>
                <option value="DISCARDED">Descartadas ({counts.DISCARDED})</option>
                <option value="CONVERTED">Convertidas ({counts.CONVERTED})</option>
              </Select>
            }
          />
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusLabels).map(([key, label]) => (
              <Badge key={key} variant="outline">
                {label}: {counts[key as FinancialSuggestionStatus]}
              </Badge>
            ))}
          </div>
          {message ? <p role="status" className="text-xs text-emerald-700 dark:text-emerald-300">{message}</p> : null}
          {error ? <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">{error}</p> : null}
          {filtered.length ? (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[56rem] text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Origem automática</th>
                    <th className="px-3 py-2 font-medium">Cliente</th>
                    <th className="px-3 py-2 font-medium">Valor</th>
                    <th className="px-3 py-2 font-medium">Data</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((suggestion) => (
                    <tr key={suggestion.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-3 py-2.5">
                        <Link href={`/dashboard/ordens/${suggestion.sourceId}`} className="font-semibold text-primary hover:underline">{suggestion.orderNumber}</Link>
                        <p className="text-xs text-muted-foreground">Motor de Automações · Ordem de Serviço</p>
                      </td>
                      <td className="px-3 py-2.5 font-medium">{normalizeProperName(suggestion.clientName)}</td>
                      <td className="px-3 py-2.5 font-semibold tabular-nums">{formatCurrencyBRLFromCents(suggestion.amountCents)}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {formatDateBR(suggestion.occurredAt)}
                        {suggestion.convertedAt ? <p className="text-xs">Convertida em {formatDateBR(suggestion.convertedAt)}</p> : null}
                      </td>
                      <td className="px-3 py-2.5"><Badge variant={suggestion.status === "CONVERTED" ? "success" : suggestion.status === "DISCARDED" ? "secondary" : suggestion.status === "ACCEPTED" ? "info" : "warning"}>{statusLabels[suggestion.status]}</Badge></td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-2">
                          {suggestion.status === "CONVERTED" && suggestion.financialEntryId ? <Button asChild size="sm" variant="secondary"><Link href={`/dashboard/financeiro/${suggestion.financialEntryId}`}>Abrir lançamento</Link></Button> : null}
                          {suggestion.status === "PENDING" || suggestion.status === "ACCEPTED" ? (
                            <>
                              <Button size="sm" variant="secondary" disabled={Boolean(processingId)} onClick={() => void discard(suggestion.id)}><Trash2 className="h-3.5 w-3.5" />Descartar</Button>
                              <Button size="sm" disabled={Boolean(processingId)} onClick={() => void openDraft(suggestion)}><Check className="h-3.5 w-3.5" />{suggestion.status === "ACCEPTED" ? "Continuar preenchimento" : "Aceitar"}</Button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState size="compact" icon={<HandCoins className="h-5 w-5" />} title="Nenhuma sugestão neste status" description="Altere o filtro para consultar outras sugestões financeiras." />
          )}
        </CardContent>
      </Card>

      {draft ? (
        <FinancialObligationFormDrawer
          open
          kind="RECEIVABLE"
          accounts={accounts}
          busy={processingId === draft.id}
          error={error}
          title={`Revisar recebível da ${draft.orderNumber}`}
          initialValues={{
            title: `Recebível da ${draft.orderNumber}`,
            description: `Serviço concluído para ${draft.clientName}`,
            category: "Serviços",
            total: (draft.amountCents / 100).toFixed(2).replace(".", ","),
            issueDate: draft.occurredAt.slice(0, 10),
            competenceDate: draft.occurredAt.slice(0, 10),
            firstDueDate: draft.occurredAt.slice(0, 10),
            installmentCount: 1,
            supplier: "",
            customerName: draft.clientName,
            clientId: draft.clientId,
            notes: `Origem automática: Ordem de Serviço ${draft.orderNumber}. Revise antes de confirmar.`,
          }}
          onClose={() => {
            setDraft(null);
            setMessage("Rascunho fechado sem criar lançamento. A sugestão permanece aceita.");
          }}
          onSubmit={confirm}
        />
      ) : null}
    </>
  );
}
