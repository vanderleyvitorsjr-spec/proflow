import { z } from "zod";
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.");
export const financialAccountSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da conta."),
  type: z.enum(["CASH", "CHECKING", "SAVINGS", "DIGITAL_WALLET", "INVESTMENT", "OTHER"]),
  openingBalance: z.string().trim().min(1, "Informe o saldo inicial."),
  isDefault: z.boolean(),
});
export const financialTransactionSchema = z
  .object({
    title: z.string().trim().min(3, "Informe uma identificação para o lançamento."),
    description: z.string().trim().min(3, "Descreva o motivo da movimentação financeira."),
    nature: z.enum(["REVENUE", "EXPENSE", "INVESTMENT"]),
    direction: z.enum(["INCOME", "EXPENSE"]),
    category: z.string().trim().min(2, "Informe a categoria financeira do lançamento."),
    accountId: z.string().min(1, "Selecione a conta que será movimentada."),
    competenceDate: date,
    issueDate: date,
    realizedAt: date,
    total: z.string().trim().min(1, "Informe o valor."),
    supplier: z.string().trim(),
    notes: z.string().trim(),
  })
  .superRefine((value, ctx) => {
    if (value.nature === "REVENUE" && value.direction !== "INCOME")
      ctx.addIssue({
        code: "custom",
        path: ["direction"],
        message: "Receitas devem ser entradas.",
      });
    if (value.nature === "EXPENSE" && value.direction !== "EXPENSE")
      ctx.addIssue({
        code: "custom",
        path: ["direction"],
        message: "Despesas devem ser saídas.",
      });
  });
export type FinancialAccountFormValues = z.infer<typeof financialAccountSchema>;
export type FinancialTransactionFormValues = z.infer<typeof financialTransactionSchema>;
export const financialObligationSchema = z.object({
  title: z.string().trim().min(3, "Informe uma identificação para a conta."),
  description: z.string().trim().min(3, "Descreva o que será recebido ou pago."),
  category: z.string().trim().min(2, "Informe a categoria financeira da conta."),
  accountId: z.string().min(1, "Selecione a conta financeira vinculada."),
  total: z.string().trim().min(1, "Informe o valor."),
  issueDate: date,
  competenceDate: date,
  firstDueDate: date,
  installmentCount: z.coerce.number().int().min(1).max(120),
  supplier: z.string().trim(),
  customerName: z.string().trim(),
  clientId: z.string().trim().optional().default(""),
  notes: z.string().trim(),
});
export const financialPaymentSchema = z.object({
  amount: z.string().trim().min(1, "Informe o valor."),
  paidAt: date,
  accountId: z.string().min(1, "Selecione a conta."),
  method: z.string().trim().min(2, "Informe o método de pagamento."),
  notes: z.string().trim(),
  reference: z.string().trim(),
});
export const financialReasonSchema = z.object({
  reason: z.string().trim().min(3, "Informe um motivo com pelo menos 3 caracteres."),
});
export type FinancialObligationFormValues = z.infer<typeof financialObligationSchema>;
export type FinancialPaymentFormValues = z.infer<typeof financialPaymentSchema>;
export type FinancialReasonFormValues = z.infer<typeof financialReasonSchema>;
