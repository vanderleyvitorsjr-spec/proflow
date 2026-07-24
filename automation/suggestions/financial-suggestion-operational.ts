import type { FinancialSuggestion } from "./financial-suggestion-types";

export type FinancialSuggestionOperationalItem = {
  id: string;
  type: "FINANCIAL_SUGGESTION";
  title: string;
  description: string;
  priority: "INFO";
  module: "FINANCE";
  action: { label: string; href: string };
  detectedAt: string;
};

export function financialSuggestionsToOperationalItems(
  suggestions: FinancialSuggestion[],
): FinancialSuggestionOperationalItem[] {
  return suggestions
    .filter(
      (suggestion) =>
        suggestion.status === "PENDING" || suggestion.status === "ACCEPTED",
    )
    .map((suggestion) => ({
      id: `financial-suggestion-${suggestion.id}`,
      type: "FINANCIAL_SUGGESTION",
      title:
        suggestion.status === "ACCEPTED"
          ? "Rascunho financeiro aguardando conclusão"
          : "Sugestão de recebimento pendente",
      description:
        suggestion.status === "ACCEPTED"
          ? `${suggestion.orderNumber} foi aceita e precisa ser revisada no Financeiro.`
          : `${suggestion.orderNumber} de ${suggestion.clientName} aguarda revisão.`,
      priority: "INFO",
      module: "FINANCE",
      action: {
        label: "Revisar sugestão",
        href: "/dashboard/central-operacional#sugestoes-financeiras",
      },
      detectedAt: suggestion.acceptedAt ?? suggestion.createdAt,
    }));
}
