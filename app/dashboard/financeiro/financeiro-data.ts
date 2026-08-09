import type { FinancialStorageState } from "./financeiro-types";

export type FinancialView = "overview" | "transactions" | "receivables" | "payables";

export const financialCategories = [
  "Serviços",
  "Vendas",
  "Materiais e peças",
  "Combustível",
  "Assinaturas",
  "Equipamentos",
  "Impostos",
  "Outros",
];

export const accountTypeLabels = {
  CASH: "Caixa",
  CHECKING: "Conta corrente",
  SAVINGS: "Poupança",
  DIGITAL_WALLET: "Carteira digital",
  INVESTMENT: "Investimento",
  OTHER: "Outro",
} as const;

export const natureLabels = {
  REVENUE: "Receita",
  EXPENSE: "Despesa",
  INVESTMENT: "Investimento",
} as const;

const now = new Date().toISOString();

export const initialFinancialState: FinancialStorageState = {
  version: 3,
  revision: 0,
  nextSequence: 1,
  distribution: {
    salaryBasisPoints: 4000,
    companyBasisPoints: 4000,
    reserveBasisPoints: 2000,
  },
  accounts: [
    {
      id: "account-main",
      name: "Conta principal",
      type: "CHECKING",
      openingBalanceCents: 0,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      history: [],
    },
  ],
  transactions: [],
};
