"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Plus,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIcon,
  PageHeaderIdentity,
} from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import {
  archiveFinancialAccountAction,
  archiveFinancialTransactionAction,
  createFinancialAccountAction,
  createFinancialObligationAction,
  createFinancialTransactionAction,
  duplicateFinancialTransactionAction,
  listFinancialStateAction,
  setDefaultFinancialAccountAction,
  updateFinancialAccountAction,
  updateFinancialTransactionAction,
  createServiceOrderReceivableAction,
  listFinancialRelationsAction,
  listFinancialDivergencesAction,
  createFinancialComplementAction,
  reviewFinancialReconciliationAction,
} from "./financeiro-actions";
import { FinanceiroAccountFormDrawer } from "./financeiro-account-form-drawer";
import { FinanceiroChart } from "./financeiro-chart";
import { FinanceiroConfirmationDialog } from "./financeiro-confirmation-dialog";
import { FinanceiroSummary } from "./financeiro-summary";
import { FinancialObligationFormDrawer } from "./financeiro-receivable-form-drawer";
import { FinancialObligationsList } from "./financeiro-receivables";
import { FinanceiroTransactionFormDrawer } from "./financeiro-transaction-form-drawer";
import { FinanceiroTransactions } from "./financeiro-transactions";
import { FinanceiroOrderReceivableDrawer } from "./financeiro-order-receivable-drawer";
import { FinanceiroDivergences } from "./financeiro-divergences";
import type { FinancialRelationOrder } from "./financeiro-relations-gateway";
import type { FinancialDivergence } from "./financeiro-reconciliation";
import type { ClientPublicReference } from "@/lib/contracts/clientes.contract";
import type {
  FinancialAccountFormValues,
  FinancialObligationFormValues,
  FinancialTransactionFormValues,
} from "./financeiro-schema";
import {
  accountsWithBalance,
  financialMetrics,
  monthlyCashFlow,
  transactionsWithAccount,
} from "./financeiro-selectors";
import type {
  FinancialAccountWithBalance,
  FinancialNature,
  FinancialStorageState,
  FinancialTransactionView,
} from "./financeiro-types";
const views = [
  { value: "overview", label: "Visão geral", icon: CircleDollarSign },
  { value: "transactions", label: "Movimentações", icon: ReceiptText },
  { value: "receivables", label: "Contas a receber", icon: ArrowUpRight },
  { value: "payables", label: "Contas a pagar", icon: ArrowDownRight },
] as const;
type ConfirmState =
  | { kind: "transaction"; item: FinancialTransactionView }
  | { kind: "account"; item: FinancialAccountWithBalance }
  | null;
export function FinanceiroPageContent() {
  const [state, setState] = useState<FinancialStorageState | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [clients, setClients] = useState<ClientPublicReference[]>([]),
    [orders, setOrders] = useState<FinancialRelationOrder[]>([]),
    [divergences, setDivergences] = useState<FinancialDivergence[]>([]),
    [orderDrawer, setOrderDrawer] = useState(false),
    [reconciliationTarget, setReconciliationTarget] = useState<{
      item: FinancialDivergence;
      action: "complement" | "review" | "snapshot";
    } | null>(null);
  const [view, setView] = useState<(typeof views)[number]["value"]>("overview");
  const [search, setSearch] = useState(""),
    [natureFilter, setNatureFilter] = useState("ALL"),
    [accountFilter, setAccountFilter] = useState("ALL"),
    [categoryFilter, setCategoryFilter] = useState("ALL"),
    [fromDate, setFromDate] = useState(""),
    [toDate, setToDate] = useState("");
  const [obligationKind, setObligationKind] = useState<"RECEIVABLE" | "PAYABLE" | null>(
    null,
  );
  const [accountDrawer, setAccountDrawer] = useState(false),
    [editingAccount, setEditingAccount] = useState<FinancialAccountWithBalance | null>(
      null,
    ),
    [transactionDrawer, setTransactionDrawer] = useState(false),
    [editingTransaction, setEditingTransaction] =
      useState<FinancialTransactionView | null>(null),
    [transactionNature, setTransactionNature] = useState<FinancialNature>("REVENUE"),
    [busy, setBusy] = useState(false),
    [formError, setFormError] = useState(""),
    [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const load = useCallback(async () => {
    const [result, relations, reconciliation] = await Promise.all([
      listFinancialStateAction(),
      listFinancialRelationsAction(),
      listFinancialDivergencesAction(),
    ]);
    if (result.ok) {
      setState(result.data);
      setError("");
    } else setError(result.error.message);
    if (relations.ok) {
      setClients(relations.data.clients);
      setOrders(relations.data.orders);
    }
    if (reconciliation.ok) setDivergences(reconciliation.data);
    setLoading(false);
  }, []);
  useEffect(() => {
    void Promise.all([
      listFinancialStateAction(),
      listFinancialRelationsAction(),
      listFinancialDivergencesAction(),
    ])
      .then(([result, relations, reconciliation]) => {
        if (result.ok) setState(result.data);
        else setError(result.error.message);
        if (relations.ok) {
          setClients(relations.data.clients);
          setOrders(relations.data.orders);
        }
        if (reconciliation.ok) setDivergences(reconciliation.data);
      })
      .finally(() => setLoading(false));
  }, []);
  const createFromOrder = async (
    orderId: string,
    value: FinancialObligationFormValues,
  ) => {
    setBusy(true);
    const result = await createServiceOrderReceivableAction(orderId, value);
    if (result.ok) {
      await load();
      setOrderDrawer(false);
      setView("receivables");
      setNotice(
        result.data.existing
          ? "O recebível principal já existia e foi preservado."
          : "Recebível da Ordem criado.",
      );
      if (result.data.existing)
        window.location.assign(`/dashboard/financeiro/${result.data.transaction.id}`);
    } else setFormError(result.error.message);
    setBusy(false);
  };
  const confirmReconciliation = async () => {
    if (!reconciliationTarget) return;
    setBusy(true);
    const { item, action } = reconciliationTarget;
    const base: FinancialObligationFormValues = {
      title: `Complemento da OS ${item.transaction.serviceOrderNumberSnapshot}`,
      description: item.transaction.serviceOrderTitleSnapshot ?? "Complemento financeiro",
      category: item.transaction.category,
      accountId: item.transaction.accountId,
      total: "0,00",
      issueDate: new Date().toISOString().slice(0, 10),
      competenceDate: new Date().toISOString().slice(0, 10),
      firstDueDate: new Date().toISOString().slice(0, 10),
      installmentCount: 1,
      supplier: "",
      customerName: item.transaction.clientNameSnapshot ?? "",
      clientId: item.transaction.clientId ?? "",
      notes: "Complemento confirmado na reconciliação.",
    };
    const result =
      action === "complement"
        ? await createFinancialComplementAction(item.transaction.id, base)
        : await reviewFinancialReconciliationAction(
            item.transaction.id,
            action === "snapshot",
          );
    if (result.ok) {
      await load();
      setNotice(
        action === "complement" ? "Complemento criado." : "Reconciliação registrada.",
      );
      setReconciliationTarget(null);
    } else setError(result.error.message);
    setBusy(false);
  };
  const accounts = useMemo(() => (state ? accountsWithBalance(state) : []), [state]),
    allTransactions = useMemo(
      () => (state ? transactionsWithAccount(state) : []),
      [state],
    );
  const categories = useMemo(
    () =>
      Array.from(new Set(allTransactions.map((item) => item.category))).sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [allTransactions],
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return allTransactions.filter(
      (item) =>
        item.kind === "REALIZED" &&
        (!term ||
          [
            item.title,
            item.description,
            item.category,
            item.accountName,
            item.supplier,
            item.notes,
          ].some((value) => value.toLocaleLowerCase("pt-BR").includes(term))) &&
        (natureFilter === "ALL" || item.nature === natureFilter) &&
        (accountFilter === "ALL" || item.accountId === accountFilter) &&
        (categoryFilter === "ALL" || item.category === categoryFilter) &&
        (!fromDate || item.realizedAt >= fromDate) &&
        (!toDate || item.realizedAt <= toDate) &&
        (view !== "receivables" || item.direction === "INCOME") &&
        (view !== "payables" || item.direction === "EXPENSE"),
    );
  }, [
    accountFilter,
    allTransactions,
    categoryFilter,
    fromDate,
    natureFilter,
    search,
    toDate,
    view,
  ]);
  const metrics = state
    ? financialMetrics(state, fromDate || undefined, toDate || undefined)
    : {
        totalBalanceCents: 0,
        incomeCents: 0,
        expenseCents: 0,
        investmentCents: 0,
        resultCents: 0,
      };
  const obligations = allTransactions.filter(
    (item) => item.kind === (view === "receivables" ? "RECEIVABLE" : "PAYABLE"),
  );
  const saveObligation = async (value: FinancialObligationFormValues) => {
    if (!obligationKind) return;
    setBusy(true);
    const result = await createFinancialObligationAction(obligationKind, value);
    if (result.ok) {
      await load();
      setObligationKind(null);
      setNotice(
        obligationKind === "RECEIVABLE"
          ? "Conta a receber criada."
          : "Conta a pagar criada.",
      );
    } else setFormError(result.error.message);
    setBusy(false);
  };
  const openTransaction = (nature: FinancialNature, item?: FinancialTransactionView) => {
    setTransactionNature(nature);
    setEditingTransaction(item ?? null);
    setFormError("");
    setTransactionDrawer(true);
  };
  const saveTransaction = async (value: FinancialTransactionFormValues) => {
    setBusy(true);
    const result = editingTransaction
      ? await updateFinancialTransactionAction(editingTransaction.id, value)
      : await createFinancialTransactionAction(value);
    if (result.ok) {
      await load();
      setTransactionDrawer(false);
      setNotice(editingTransaction ? "Lançamento atualizado." : "Lançamento criado.");
    } else setFormError(result.error.message);
    setBusy(false);
  };
  const saveAccount = async (value: FinancialAccountFormValues) => {
    setBusy(true);
    const result = editingAccount
      ? await updateFinancialAccountAction(editingAccount.id, value)
      : await createFinancialAccountAction(value);
    if (result.ok) {
      await load();
      setAccountDrawer(false);
      setNotice(editingAccount ? "Conta atualizada." : "Conta criada.");
    } else setFormError(result.error.message);
    setBusy(false);
  };
  const duplicate = async (item: FinancialTransactionView) => {
    setBusy(true);
    const result = await duplicateFinancialTransactionAction(item.id);
    if (result.ok) {
      await load();
      setNotice("Lançamento duplicado.");
    } else setError(result.error.message);
    setBusy(false);
  };
  const confirm = async () => {
    if (!confirmState) return;
    setBusy(true);
    if (confirmState.kind === "transaction") {
      const result = await archiveFinancialTransactionAction(confirmState.item.id);
      if (result.ok) setNotice("Lançamento arquivado.");
      else setError(result.error.message);
    } else {
      const result = await archiveFinancialAccountAction(confirmState.item.id, true);
      if (result.ok) setNotice("Conta arquivada com os vínculos históricos preservados.");
      else setError(result.error.message);
    }
    await load();
    setConfirmState(null);
    setBusy(false);
  };
  if (loading)
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Carregando Financeiro...
      </div>
    );
  if (!state)
    return (
      <EmptyState
        title="Financeiro indisponível"
        description={error || "Não foi possível carregar os dados."}
      />
    );
  return (
    <div className="space-y-3">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <PageHeaderIcon>
              <WalletCards className="h-5 w-5" />
            </PageHeaderIcon>
            <PageHeaderHeading
              title="Financeiro"
              description="Controle receitas, despesas, contas e o fluxo de caixa da empresa."
            />
          </PageHeaderIdentity>
          <PageHeaderActions>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFormError("");
                setOrderDrawer(true);
              }}
            >
              <ReceiptText className="h-4 w-4" />
              Gerar recebível da OS
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFormError("");
                setObligationKind("RECEIVABLE");
              }}
            >
              <ArrowUpRight className="h-4 w-4" />A receber
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFormError("");
                setObligationKind("PAYABLE");
              }}
            >
              <ArrowDownRight className="h-4 w-4" />A pagar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditingAccount(null);
                setFormError("");
                setAccountDrawer(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nova conta
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openTransaction("INVESTMENT")}
            >
              <TrendingUp className="h-4 w-4" />
              Investimento
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openTransaction("EXPENSE")}
            >
              <ArrowDownRight className="h-4 w-4" />
              Nova despesa
            </Button>
            <Button size="sm" onClick={() => openTransaction("REVENUE")}>
              <Plus className="h-4 w-4" />
              Nova receita
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>
        <div className="proflow-scrollbar flex overflow-x-auto border-t border-border px-4 py-2">
          <div className="flex min-w-max gap-1">
            {views.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.value}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    view === item.value &&
                      "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
                  )}
                  aria-pressed={view === item.value}
                  onClick={() => setView(item.value)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      </PageHeader>
      {notice && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          {notice}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
        >
          {error}
        </div>
      )}
      <FinanceiroSummary {...metrics} />
      {view === "overview" && (
        <FinanceiroChart
          cashFlow={monthlyCashFlow(state)}
          accounts={accounts}
          onNewAccount={() => {
            setEditingAccount(null);
            setAccountDrawer(true);
          }}
          onEditAccount={(item) => {
            setEditingAccount(item);
            setAccountDrawer(true);
          }}
          onSetDefault={async (item) => {
            const result = await setDefaultFinancialAccountAction(item.id);
            if (!result.ok) setError(result.error.message);
            else {
              await load();
              setNotice("Conta padrão atualizada.");
            }
          }}
          onArchiveAccount={(item) => setConfirmState({ kind: "account", item })}
        />
      )}
      {(view === "overview" || view === "transactions") && (
        <FinanceiroTransactions
          transactions={filtered}
          accounts={accounts}
          categories={categories}
          searchTerm={search}
          natureFilter={natureFilter}
          accountFilter={accountFilter}
          categoryFilter={categoryFilter}
          fromDate={fromDate}
          toDate={toDate}
          onSearchChange={setSearch}
          onNatureFilterChange={setNatureFilter}
          onAccountFilterChange={setAccountFilter}
          onCategoryFilterChange={setCategoryFilter}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onEdit={(item) => openTransaction(item.nature, item)}
          onDuplicate={(item) => void duplicate(item)}
          onArchive={(item) => setConfirmState({ kind: "transaction", item })}
        />
      )}
      {(view === "receivables" || view === "payables") && (
        <FinancialObligationsList
          transactions={obligations}
          kind={view === "receivables" ? "RECEIVABLE" : "PAYABLE"}
          onNew={() =>
            setObligationKind(view === "receivables" ? "RECEIVABLE" : "PAYABLE")
          }
        />
      )}
      {view === "receivables" && (
        <FinanceiroDivergences
          items={divergences}
          onComplement={(item) => setReconciliationTarget({ item, action: "complement" })}
          onCancelOpen={(item) =>
            window.location.assign(`/dashboard/financeiro/${item.transaction.id}`)
          }
          onReview={(item) => setReconciliationTarget({ item, action: "review" })}
          onUpdateSnapshot={(item) =>
            setReconciliationTarget({ item, action: "snapshot" })
          }
        />
      )}
      <FinanceiroAccountFormDrawer
        open={accountDrawer}
        account={editingAccount}
        busy={busy}
        error={formError}
        onClose={() => setAccountDrawer(false)}
        onSubmit={saveAccount}
      />
      <FinanceiroTransactionFormDrawer
        open={transactionDrawer}
        nature={transactionNature}
        transaction={editingTransaction}
        accounts={accounts}
        busy={busy}
        error={formError}
        onClose={() => setTransactionDrawer(false)}
        onSubmit={saveTransaction}
      />
      <FinanceiroOrderReceivableDrawer
        open={orderDrawer}
        orders={orders}
        accounts={accounts}
        busy={busy}
        error={formError}
        onClose={() => setOrderDrawer(false)}
        onSubmit={createFromOrder}
      />
      <FinanceiroConfirmationDialog
        open={Boolean(reconciliationTarget)}
        title={
          reconciliationTarget?.action === "complement"
            ? "Criar complemento financeiro?"
            : reconciliationTarget?.action === "snapshot"
              ? "Atualizar snapshot da OS?"
              : "Marcar divergência como revisada?"
        }
        description="A operação será registrada no histórico e não altera pagamentos já realizados."
        busy={busy}
        confirmLabel="Confirmar"
        onCancel={() => setReconciliationTarget(null)}
        onConfirm={() => void confirmReconciliation()}
      />
      <FinancialObligationFormDrawer
        open={Boolean(obligationKind)}
        kind={obligationKind ?? "RECEIVABLE"}
        accounts={accounts}
        clients={clients}
        busy={busy}
        error={formError}
        onClose={() => setObligationKind(null)}
        onSubmit={saveObligation}
      />
      <FinanceiroConfirmationDialog
        open={Boolean(confirmState)}
        title={
          confirmState?.kind === "account"
            ? "Arquivar conta financeira?"
            : "Arquivar lançamento?"
        }
        description={
          confirmState?.kind === "account"
            ? "A conta e seus vínculos históricos serão preservados. Lançamentos ativos deixarão de compor as visões após o arquivamento da conta somente quando forem arquivados individualmente."
            : "O lançamento deixará de compor saldos, métricas e gráfico, mas seu histórico será preservado."
        }
        busy={busy}
        confirmLabel="Arquivar"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => void confirm()}
      />
    </div>
  );
}
export default FinanceiroPageContent;
