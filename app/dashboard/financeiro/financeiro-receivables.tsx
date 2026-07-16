"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatMoneyCents } from "./financeiro-money";
import {
  nextOpenInstallment,
  transactionOpenCents,
  transactionPaidCents,
  transactionStatus,
} from "./financeiro-status";
import type { FinancialTransactionView } from "./financeiro-types";
const labels = {
  PENDING: "Pendente",
  OVERDUE: "Vencida",
  PARTIALLY_PAID: "Parcial",
  PAID: "Paga",
  CANCELED: "Cancelada",
} as const;
const variants = {
  PENDING: "neutral",
  OVERDUE: "destructive",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  CANCELED: "neutral",
} as const;
const date = (value: string) =>
  new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`));
export function FinancialObligationsList({
  transactions,
  kind,
  onNew,
}: {
  transactions: FinancialTransactionView[];
  kind: "RECEIVABLE" | "PAYABLE";
  onNew: () => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return transactions.filter((item) => {
      const status = transactionStatus(item);
      return (
        (statusFilter === "ALL" || status === statusFilter) &&
        (!term ||
          [
            item.title,
            item.description,
            item.category,
            item.customerName,
            item.supplier,
          ].some((value) => value?.toLocaleLowerCase("pt-BR").includes(term)))
      );
    });
  }, [search, statusFilter, transactions]);
  return (
    <Card className="overflow-hidden">
      <header className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {kind === "RECEIVABLE" ? "Contas a receber" : "Contas a pagar"}
          </p>
          <h2 className="text-base font-bold">Parcelas, vencimentos e saldo aberto</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            aria-label={`Buscar ${kind === "RECEIVABLE" ? "contas a receber" : "contas a pagar"}`}
            placeholder="Buscar por título, categoria ou contato..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:w-72"
          />
          <Select
            aria-label="Filtrar por status financeiro"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">Todos os status</option>
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Button onClick={onNew}>
            {kind === "RECEIVABLE" ? "Nova conta a receber" : "Nova conta a pagar"}
          </Button>
        </div>
      </header>
      {filtered.length ? (
        <div className="divide-y divide-border">
          {filtered.map((item) => {
            const status = transactionStatus(item),
              next = nextOpenInstallment(item);
            return (
              <article
                key={item.id}
                className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_repeat(3,minmax(7rem,auto))_auto] md:items-center"
              >
                <div>
                  <p className="font-semibold">
                    FIN-{String(item.sequence).padStart(5, "0")} · {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {kind === "RECEIVABLE"
                      ? item.customerName || "Cliente não informado"
                      : item.supplier || "Fornecedor não informado"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-semibold">{formatMoneyCents(item.totalCents)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Realizado</p>
                  <p className="font-semibold">
                    {formatMoneyCents(transactionPaidCents(item))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo / próximo</p>
                  <p className="font-semibold">
                    {formatMoneyCents(transactionOpenCents(item))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {next ? date(next.dueDate) : "Sem saldo aberto"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={variants[status]}>{labels[status]}</Badge>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/dashboard/financeiro/${item.id}`}>Abrir</Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          className="m-4"
          title={
            kind === "RECEIVABLE" ? "Nenhuma conta a receber" : "Nenhuma conta a pagar"
          }
          description={
            transactions.length
              ? "Nenhum registro corresponde à busca e aos filtros atuais."
              : "Crie uma obrigação manual para acompanhar parcelas e pagamentos."
          }
        />
      )}
    </Card>
  );
}
