import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Copy,
  Edit3,
  ExternalLink,
  Search,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { natureLabels } from "./financeiro-data";
import { formatMoneyCents } from "./financeiro-money";
import type {
  FinancialAccountWithBalance,
  FinancialTransactionView,
} from "./financeiro-types";
const date = (value: string) =>
  new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`));
export function FinanceiroTransactions({
  transactions,
  accounts,
  categories,
  searchTerm,
  natureFilter,
  accountFilter,
  categoryFilter,
  fromDate,
  toDate,
  onSearchChange,
  onNatureFilterChange,
  onAccountFilterChange,
  onCategoryFilterChange,
  onFromDateChange,
  onToDateChange,
  onEdit,
  onDuplicate,
  onArchive,
}: {
  transactions: FinancialTransactionView[];
  accounts: FinancialAccountWithBalance[];
  categories: string[];
  searchTerm: string;
  natureFilter: string;
  accountFilter: string;
  categoryFilter: string;
  fromDate: string;
  toDate: string;
  onSearchChange: (value: string) => void;
  onNatureFilterChange: (value: string) => void;
  onAccountFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onEdit: (transaction: FinancialTransactionView) => void;
  onDuplicate: (transaction: FinancialTransactionView) => void;
  onArchive: (transaction: FinancialTransactionView) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <header className="border-b border-border p-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Movimentações
          </p>
          <h2 className="text-base font-bold">Lançamentos realizados</h2>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_10rem_11rem_11rem_9rem_9rem]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
              placeholder="Buscar lançamentos..."
              aria-label="Pesquisar lançamentos"
            />
          </div>
          <Select
            value={natureFilter}
            onChange={(e) => onNatureFilterChange(e.target.value)}
            aria-label="Filtrar por natureza"
          >
            <option value="ALL">Todas naturezas</option>
            <option value="REVENUE">Receitas</option>
            <option value="EXPENSE">Despesas</option>
            <option value="INVESTMENT">Investimentos</option>
          </Select>
          <Select
            value={accountFilter}
            onChange={(e) => onAccountFilterChange(e.target.value)}
            aria-label="Filtrar por conta"
          >
            <option value="ALL">Todas as contas</option>
            {accounts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            aria-label="Filtrar por categoria"
          >
            <option value="ALL">Todas categorias</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            aria-label="Período inicial"
          />
          <Input
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            aria-label="Período final"
          />
        </div>
      </header>
      {transactions.length ? (
        <TableFrame>
          <Table density="compact">
            <TableHeader>
              <TableRow>
                <TableHead>Lançamento</TableHead>
                <TableHead>Natureza</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Realização</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-semibold">
                      FIN-{String(item.sequence).padStart(5, "0")} · {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.category}
                      {item.supplier ? ` · ${item.supplier}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.nature === "REVENUE"
                          ? "success"
                          : item.nature === "INVESTMENT"
                            ? "info"
                            : "destructive"
                      }
                    >
                      {item.nature === "REVENUE" ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {natureLabels[item.nature]}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.accountName}</TableCell>
                  <TableCell>{date(item.realizedAt)}</TableCell>
                  <TableCell
                    className={
                      item.direction === "INCOME"
                        ? "font-bold text-emerald-600"
                        : "font-bold text-rose-600"
                    }
                  >
                    {item.direction === "INCOME" ? "+ " : "− "}
                    {formatMoneyCents(item.totalCents)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        aria-label={`Abrir ${item.title}`}
                      >
                        <Link href={`/dashboard/financeiro/${item.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(item)}
                        aria-label={`Editar ${item.title}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDuplicate(item)}
                        aria-label={`Duplicar ${item.title}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onArchive(item)}
                        aria-label={`Arquivar ${item.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableFrame>
      ) : (
        <EmptyState
          className="m-4"
          title="Nenhum lançamento encontrado"
          description="Crie um lançamento ou ajuste os filtros aplicados."
        />
      )}
    </Card>
  );
}
