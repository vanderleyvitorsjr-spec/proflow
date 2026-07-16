import {
  financialAccountSchema,
  financialTransactionSchema,
  type FinancialAccountFormValues,
  type FinancialTransactionFormValues,
  financialObligationSchema,
  financialPaymentSchema,
  financialReasonSchema,
  type FinancialObligationFormValues,
  type FinancialPaymentFormValues,
} from "./financeiro-schema";
import { FinancialDomainError } from "./financeiro-errors";
import { distributeMoney, parseBrazilianMoney } from "./financeiro-money";
import { FinancialRepository } from "./financeiro-repository";
import type {
  FinancialHistoryEntry,
  FinancialInstallment,
  FinancialTransaction,
} from "./financeiro-types";
import {
  installmentOpenCents,
  transactionOpenCents,
  transactionPaidCents,
} from "./financeiro-status";
const history = (
  type: FinancialHistoryEntry["type"],
  description: string,
): FinancialHistoryEntry => ({
  id: crypto.randomUUID(),
  type,
  description,
  createdAt: new Date().toISOString(),
});
export class FinancialService {
  constructor(private readonly repository: FinancialRepository) {}
  listState() {
    return this.repository.readState();
  }
  getTransaction(id: string) {
    return this.repository.findTransaction(id);
  }
  async createAccount(input: FinancialAccountFormValues) {
    const value = financialAccountSchema.parse(input),
      state = await this.repository.readState();
    if (
      state.accounts.some(
        (item) =>
          !item.archivedAt &&
          item.name.toLocaleLowerCase("pt-BR") === value.name.toLocaleLowerCase("pt-BR"),
      )
    )
      throw new FinancialDomainError(
        "DUPLICATE",
        "Já existe uma conta ativa com este nome.",
      );
    const now = new Date().toISOString(),
      makeDefault = value.isDefault || !state.accounts.some((item) => !item.archivedAt);
    const account = {
      id: crypto.randomUUID(),
      name: value.name,
      type: value.type,
      openingBalanceCents: parseBrazilianMoney(value.openingBalance),
      isDefault: makeDefault,
      createdAt: now,
      updatedAt: now,
      history: [history("CREATED", "Conta financeira criada.")],
    };
    const accounts = state.accounts.map((item) =>
      makeDefault && item.isDefault
        ? {
            ...item,
            isDefault: false,
            updatedAt: now,
            history: [
              ...item.history,
              history("DEFAULT_CHANGED", "Conta deixou de ser padrão."),
            ],
          }
        : item,
    );
    return this.repository.saveState({ ...state, accounts: [account, ...accounts] });
  }
  async updateAccount(id: string, input: FinancialAccountFormValues) {
    const value = financialAccountSchema.parse(input),
      state = await this.repository.readState(),
      current = state.accounts.find((item) => item.id === id && !item.archivedAt);
    if (!current) throw new FinancialDomainError("NOT_FOUND", "Conta não encontrada.");
    if (
      state.accounts.some(
        (item) =>
          item.id !== id &&
          !item.archivedAt &&
          item.name.toLocaleLowerCase("pt-BR") === value.name.toLocaleLowerCase("pt-BR"),
      )
    )
      throw new FinancialDomainError(
        "DUPLICATE",
        "Já existe uma conta ativa com este nome.",
      );
    const now = new Date().toISOString(),
      accounts = state.accounts.map((item) =>
        item.id === id
          ? {
              ...current,
              name: value.name,
              type: value.type,
              openingBalanceCents: parseBrazilianMoney(value.openingBalance),
              isDefault: value.isDefault || current.isDefault,
              updatedAt: now,
              history: [
                ...current.history,
                history("UPDATED", "Conta financeira atualizada."),
              ],
            }
          : value.isDefault && item.isDefault
            ? {
                ...item,
                isDefault: false,
                updatedAt: now,
                history: [
                  ...item.history,
                  history("DEFAULT_CHANGED", "Conta deixou de ser padrão."),
                ],
              }
            : item,
      );
    return this.repository.saveState({ ...state, accounts });
  }
  async setDefaultAccount(id: string) {
    const state = await this.repository.readState();
    if (!state.accounts.some((item) => item.id === id && !item.archivedAt))
      throw new FinancialDomainError("NOT_FOUND", "Conta não encontrada.");
    const now = new Date().toISOString();
    return this.repository.saveState({
      ...state,
      accounts: state.accounts.map((item) =>
        item.isDefault !== (item.id === id)
          ? {
              ...item,
              isDefault: item.id === id,
              updatedAt: now,
              history: [
                ...item.history,
                history(
                  "DEFAULT_CHANGED",
                  item.id === id
                    ? "Conta definida como padrão."
                    : "Conta deixou de ser padrão.",
                ),
              ],
            }
          : item,
      ),
    });
  }
  async archiveAccount(id: string, confirmed: boolean) {
    const state = await this.repository.readState(),
      current = state.accounts.find((item) => item.id === id && !item.archivedAt);
    if (!current) throw new FinancialDomainError("NOT_FOUND", "Conta não encontrada.");
    const hasTransactions = state.transactions.some(
      (item) => item.accountId === id && !item.archivedAt,
    );
    if (hasTransactions && !confirmed)
      throw new FinancialDomainError(
        "CONFLICT",
        "A conta possui lançamentos ativos. Confirme o arquivamento para preservar os vínculos históricos.",
      );
    const now = new Date().toISOString(),
      fallback = state.accounts.find((item) => item.id !== id && !item.archivedAt);
    const accounts = state.accounts.map((item) =>
      item.id === id
        ? {
            ...item,
            archivedAt: now,
            isDefault: false,
            updatedAt: now,
            history: [
              ...item.history,
              history("ARCHIVED", "Conta financeira arquivada."),
            ],
          }
        : current.isDefault && item.id === fallback?.id
          ? {
              ...item,
              isDefault: true,
              updatedAt: now,
              history: [
                ...item.history,
                history(
                  "DEFAULT_CHANGED",
                  "Conta definida como padrão após arquivamento da conta anterior.",
                ),
              ],
            }
          : item,
    );
    return this.repository.saveState({ ...state, accounts });
  }
  async createTransaction(input: FinancialTransactionFormValues) {
    const value = financialTransactionSchema.parse(input),
      state = await this.repository.readState();
    this.requireAccount(value.accountId, state.accounts);
    const now = new Date().toISOString(),
      sequence = state.nextSequence;
    const record: FinancialTransaction = {
      id: crypto.randomUUID(),
      sequence,
      title: value.title,
      description: value.description,
      nature: value.nature,
      direction: value.direction,
      category: value.category,
      accountId: value.accountId,
      competenceDate: value.competenceDate,
      issueDate: value.issueDate,
      realizedAt: value.realizedAt,
      totalCents: parseBrazilianMoney(value.total),
      supplier: value.supplier,
      notes: value.notes,
      source: "MANUAL",
      kind: "REALIZED",
      installments: [],
      createdAt: now,
      updatedAt: now,
      history: [history("CREATED", "Lançamento manual criado.")],
    };
    await this.repository.saveState({
      ...state,
      nextSequence: sequence + 1,
      transactions: [record, ...state.transactions],
    });
    return record;
  }
  async updateTransaction(id: string, input: FinancialTransactionFormValues) {
    const value = financialTransactionSchema.parse(input),
      state = await this.repository.readState(),
      current = state.transactions.find((item) => item.id === id && !item.archivedAt);
    if (!current)
      throw new FinancialDomainError("NOT_FOUND", "Lançamento não encontrado.");
    this.requireAccount(value.accountId, state.accounts);
    const record: FinancialTransaction = {
      ...current,
      ...value,
      totalCents: parseBrazilianMoney(value.total),
      updatedAt: new Date().toISOString(),
      history: [...current.history, history("UPDATED", "Lançamento atualizado.")],
    };
    await this.repository.saveState({
      ...state,
      transactions: state.transactions.map((item) => (item.id === id ? record : item)),
    });
    return record;
  }
  async duplicateTransaction(id: string) {
    const state = await this.repository.readState(),
      current = state.transactions.find((item) => item.id === id && !item.archivedAt);
    if (!current)
      throw new FinancialDomainError("NOT_FOUND", "Lançamento não encontrado.");
    const now = new Date().toISOString(),
      record: FinancialTransaction = {
        ...current,
        id: crypto.randomUUID(),
        sequence: state.nextSequence,
        title: `${current.title} — Cópia`,
        createdAt: now,
        updatedAt: now,
        installments:
          current.kind === "REALIZED"
            ? []
            : current.installments.map((item) => ({
                ...item,
                id: crypto.randomUUID(),
                payments: [],
                canceledAt: undefined,
                cancellationReason: undefined,
                createdAt: now,
                updatedAt: now,
                history: [history("DUPLICATED", "Parcela duplicada sem pagamentos.")],
              })),
        canceledAt: undefined,
        cancellationReason: undefined,
        history: [
          history(
            "DUPLICATED",
            `Duplicado do lançamento FIN-${String(current.sequence).padStart(5, "0")}.`,
          ),
        ],
      };
    await this.repository.saveState({
      ...state,
      nextSequence: state.nextSequence + 1,
      transactions: [record, ...state.transactions],
    });
    return record;
  }
  async archiveTransaction(id: string) {
    const state = await this.repository.readState(),
      current = state.transactions.find((item) => item.id === id && !item.archivedAt);
    if (!current)
      throw new FinancialDomainError("NOT_FOUND", "Lançamento não encontrado.");
    const now = new Date().toISOString(),
      record = {
        ...current,
        archivedAt: now,
        updatedAt: now,
        history: [...current.history, history("ARCHIVED", "Lançamento arquivado.")],
      };
    await this.repository.saveState({
      ...state,
      transactions: state.transactions.map((item) => (item.id === id ? record : item)),
    });
    return record;
  }
  async createObligation(
    kind: "RECEIVABLE" | "PAYABLE",
    input: FinancialObligationFormValues,
    relation?: Partial<FinancialTransaction>,
  ) {
    const value = financialObligationSchema.parse(input),
      state = await this.repository.readState();
    this.requireAccount(value.accountId, state.accounts);
    const totalCents = parseBrazilianMoney(value.total),
      amounts = distributeMoney(totalCents, value.installmentCount);
    if (amounts.some((amount) => amount <= 0))
      throw new FinancialDomainError(
        "VALIDATION",
        "O valor total deve permitir parcelas maiores que zero.",
      );
    if (
      relation?.idempotencyKey &&
      state.transactions.some(
        (item) => item.idempotencyKey === relation.idempotencyKey && !item.archivedAt,
      )
    )
      throw new FinancialDomainError(
        "DUPLICATE",
        "Já existe um recebível para esta finalidade.",
      );
    const now = new Date().toISOString(),
      installments: FinancialInstallment[] = amounts.map((amountCents, index) => {
        const due = new Date(`${value.firstDueDate}T12:00:00`);
        due.setMonth(due.getMonth() + index);
        return {
          id: crypto.randomUUID(),
          number: index + 1,
          total: amounts.length,
          amountCents,
          dueDate: due.toISOString().slice(0, 10),
          payments: [],
          createdAt: now,
          updatedAt: now,
          history: [history("CREATED", `Parcela ${index + 1}/${amounts.length} criada.`)],
        };
      });
    const record: FinancialTransaction = {
      id: crypto.randomUUID(),
      sequence: state.nextSequence,
      title: value.title,
      description: value.description,
      nature: kind === "RECEIVABLE" ? "REVENUE" : "EXPENSE",
      direction: kind === "RECEIVABLE" ? "INCOME" : "EXPENSE",
      category: value.category,
      accountId: value.accountId,
      competenceDate: value.competenceDate,
      issueDate: value.issueDate,
      realizedAt: value.issueDate,
      totalCents,
      supplier: kind === "PAYABLE" ? value.supplier : "",
      customerName: kind === "RECEIVABLE" ? value.customerName : undefined,
      notes: value.notes,
      source: "MANUAL",
      kind,
      installments,
      createdAt: now,
      updatedAt: now,
      history: [
        history(
          "CREATED",
          kind === "RECEIVABLE" ? "Conta a receber criada." : "Conta a pagar criada.",
        ),
        ...(relation?.serviceOrderId
          ? [
              history(
                "RECONCILIATION",
                `Recebível gerado a partir da OS ${relation.serviceOrderNumberSnapshot}; cliente e snapshot financeiro vinculados.`,
              ),
            ]
          : relation?.clientId
            ? [history("RECONCILIATION", "Cliente persistido vinculado ao recebível.")]
            : []),
      ],
      ...relation,
    };
    await this.repository.saveState({
      ...state,
      nextSequence: state.nextSequence + 1,
      transactions: [record, ...state.transactions],
    });
    return record;
  }
  async reviewReconciliation(id: string, snapshot?: Partial<FinancialTransaction>) {
    const state = await this.repository.readState(),
      current = state.transactions.find((item) => item.id === id && !item.archivedAt);
    if (!current)
      throw new FinancialDomainError("NOT_FOUND", "Recebível não encontrado.");
    const now = new Date().toISOString(),
      updated: FinancialTransaction = {
        ...current,
        ...snapshot,
        reconciliationReviewedAt: now,
        updatedAt: now,
        history: [
          ...current.history,
          history(
            "RECONCILIATION",
            snapshot
              ? "Snapshot da Ordem atualizado após decisão explícita."
              : "Divergência marcada como revisada.",
          ),
        ],
      };
    await this.repository.saveState({
      ...state,
      transactions: state.transactions.map((item) => (item.id === id ? updated : item)),
    });
    return updated;
  }
  async addPayment(
    transactionId: string,
    installmentId: string,
    input: FinancialPaymentFormValues,
  ) {
    const value = financialPaymentSchema.parse(input),
      state = await this.repository.readState(),
      transaction = state.transactions.find(
        (item) => item.id === transactionId && !item.archivedAt,
      );
    if (!transaction || transaction.kind === "REALIZED")
      throw new FinancialDomainError("NOT_FOUND", "Conta financeira não encontrada.");
    if (transaction.canceledAt)
      throw new FinancialDomainError("CONFLICT", "O lançamento está cancelado.");
    this.requireAccount(value.accountId, state.accounts);
    const installment = transaction.installments.find(
      (item) => item.id === installmentId,
    );
    if (!installment)
      throw new FinancialDomainError("NOT_FOUND", "Parcela não encontrada.");
    if (installment.canceledAt)
      throw new FinancialDomainError("CONFLICT", "A parcela está cancelada.");
    const amountCents = parseBrazilianMoney(value.amount),
      open = installmentOpenCents(installment);
    if (amountCents <= 0)
      throw new FinancialDomainError("VALIDATION", "O valor deve ser positivo.");
    if (amountCents > open)
      throw new FinancialDomainError(
        "CONFLICT",
        "O valor informado excede o saldo aberto da parcela.",
      );
    const now = new Date().toISOString(),
      payment = {
        id: crypto.randomUUID(),
        amountCents,
        paidAt: value.paidAt,
        accountId: value.accountId,
        method: value.method,
        notes: value.notes,
        reference: value.reference,
        createdAt: now,
        history: [
          history(
            "PAYMENT",
            transaction.kind === "RECEIVABLE"
              ? "Recebimento registrado."
              : "Pagamento registrado.",
          ),
        ],
      };
    const updated = {
      ...transaction,
      updatedAt: now,
      installments: transaction.installments.map((item) =>
        item.id === installmentId
          ? {
              ...item,
              updatedAt: now,
              payments: [...item.payments, payment],
              history: [
                ...item.history,
                history(
                  "PAYMENT",
                  `${transaction.kind === "RECEIVABLE" ? "Recebido" : "Pago"} valor da parcela.`,
                ),
              ],
            }
          : item,
      ),
      history: [
        ...transaction.history,
        history(
          "PAYMENT",
          `${transaction.kind === "RECEIVABLE" ? "Recebimento" : "Pagamento"} registrado na parcela ${installment.number}/${installment.total}.`,
        ),
      ],
    };
    await this.repository.saveState({
      ...state,
      transactions: state.transactions.map((item) =>
        item.id === transactionId ? updated : item,
      ),
    });
    return updated;
  }
  async cancelInstallment(
    transactionId: string,
    installmentId: string,
    reasonInput: { reason: string },
  ) {
    const { reason } = financialReasonSchema.parse(reasonInput),
      state = await this.repository.readState(),
      transaction = state.transactions.find(
        (item) => item.id === transactionId && !item.archivedAt,
      );
    if (!transaction)
      throw new FinancialDomainError("NOT_FOUND", "Lançamento não encontrado.");
    const installment = transaction.installments.find(
      (item) => item.id === installmentId,
    );
    if (!installment)
      throw new FinancialDomainError("NOT_FOUND", "Parcela não encontrada.");
    if (installment.canceledAt)
      throw new FinancialDomainError("CONFLICT", "A parcela já está cancelada.");
    if (transactionPaidCents({ ...transaction, installments: [installment] }) > 0)
      throw new FinancialDomainError(
        "CONFLICT",
        "Estorne os pagamentos da parcela antes de cancelá-la.",
      );
    const now = new Date().toISOString(),
      updated = {
        ...transaction,
        updatedAt: now,
        installments: transaction.installments.map((item) =>
          item.id === installmentId
            ? {
                ...item,
                canceledAt: now,
                cancellationReason: reason,
                updatedAt: now,
                history: [
                  ...item.history,
                  history("CANCELED", `Parcela cancelada: ${reason}`),
                ],
              }
            : item,
        ),
        history: [
          ...transaction.history,
          history(
            "CANCELED",
            `Parcela ${installment.number}/${installment.total} cancelada: ${reason}`,
          ),
        ],
      };
    await this.repository.saveState({
      ...state,
      transactions: state.transactions.map((item) =>
        item.id === transactionId ? updated : item,
      ),
    });
    return updated;
  }
  async cancelTransaction(id: string, reasonInput: { reason: string }) {
    const { reason } = financialReasonSchema.parse(reasonInput),
      state = await this.repository.readState(),
      transaction = state.transactions.find((item) => item.id === id && !item.archivedAt);
    if (!transaction)
      throw new FinancialDomainError("NOT_FOUND", "Lançamento não encontrado.");
    if (transaction.canceledAt)
      throw new FinancialDomainError("CONFLICT", "O lançamento já está cancelado.");
    if (
      transaction.kind !== "REALIZED" &&
      transactionOpenCents(transaction) === 0 &&
      transactionPaidCents(transaction) > 0
    )
      throw new FinancialDomainError(
        "CONFLICT",
        "Um lançamento totalmente pago só pode ser cancelado após estornar os pagamentos.",
      );
    const now = new Date().toISOString(),
      updated = {
        ...transaction,
        canceledAt: now,
        cancellationReason: reason,
        updatedAt: now,
        installments: transaction.installments.map((item) =>
          installmentOpenCents(item) > 0
            ? {
                ...item,
                canceledAt: now,
                cancellationReason: reason,
                updatedAt: now,
                history: [
                  ...item.history,
                  history("CANCELED", `Saldo aberto cancelado: ${reason}`),
                ],
              }
            : item,
        ),
        history: [
          ...transaction.history,
          history("CANCELED", `Lançamento cancelado: ${reason}`),
        ],
      };
    await this.repository.saveState({
      ...state,
      transactions: state.transactions.map((item) => (item.id === id ? updated : item)),
    });
    return updated;
  }
  async reversePayment(
    transactionId: string,
    installmentId: string,
    paymentId: string,
    reasonInput: { reason: string },
  ) {
    const { reason } = financialReasonSchema.parse(reasonInput),
      state = await this.repository.readState(),
      transaction = state.transactions.find(
        (item) => item.id === transactionId && !item.archivedAt,
      );
    if (!transaction)
      throw new FinancialDomainError("NOT_FOUND", "Lançamento não encontrado.");
    const installment = transaction.installments.find(
        (item) => item.id === installmentId,
      ),
      payment = installment?.payments.find((item) => item.id === paymentId);
    if (!installment || !payment)
      throw new FinancialDomainError("NOT_FOUND", "Pagamento não encontrado.");
    if (payment.reversedAt)
      throw new FinancialDomainError("CONFLICT", "Este pagamento já foi estornado.");
    const now = new Date().toISOString(),
      updated = {
        ...transaction,
        updatedAt: now,
        installments: transaction.installments.map((item) =>
          item.id === installmentId
            ? {
                ...item,
                updatedAt: now,
                payments: item.payments.map((entry) =>
                  entry.id === paymentId
                    ? {
                        ...entry,
                        reversedAt: now,
                        reversalReason: reason,
                        history: [
                          ...entry.history,
                          history("REVERSED", `Pagamento estornado: ${reason}`),
                        ],
                      }
                    : entry,
                ),
                history: [
                  ...item.history,
                  history("REVERSED", `Pagamento estornado: ${reason}`),
                ],
              }
            : item,
        ),
        history: [
          ...transaction.history,
          history(
            "REVERSED",
            `Pagamento da parcela ${installment.number}/${installment.total} estornado: ${reason}`,
          ),
        ],
      };
    await this.repository.saveState({
      ...state,
      transactions: state.transactions.map((item) =>
        item.id === transactionId ? updated : item,
      ),
    });
    return updated;
  }
  private requireAccount(
    id: string,
    accounts: Awaited<ReturnType<FinancialRepository["readState"]>>["accounts"],
  ) {
    if (!accounts.some((item) => item.id === id && !item.archivedAt))
      throw new FinancialDomainError(
        "NOT_FOUND",
        "Selecione uma conta financeira válida.",
      );
  }
}
