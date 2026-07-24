"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  PackageCheck,
  Phone,
  Plus,
  Search,
  Trash2,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { MetricItem, MetricStrip } from "@/components/ui/metric-strip";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIcon,
  PageHeaderIdentity,
  PageHeaderToolbar,
} from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table } from "@/components/ui/table";
import { QuickActions } from "@/components/ui/quick-actions";
import { cn } from "@/lib/utils";

import {
  createClientAction,
  deleteClientAction,
  listClientsAction,
  updateClientAction,
} from "./actions";
import type { ClientFormValues } from "./cliente-schema";
import { ClientFormDrawer } from "./cliente-form-drawer";
import { DuplicateClientError } from "./clientes-repository";

import {
  type ClientRecord,
  type ClientSegment,
  type ClientStatus,
  type ClientType,
} from "./clientes-data";

type ClientView = "cards" | "list";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const typeLabels: Record<ClientType, string> = {
  RESIDENTIAL: "Residencial",
  COMPANY: "Empresa",
  CONDOMINIUM: "Condomínio",
};

const segmentLabels: Record<ClientSegment, string> = {
  CLIMATIZATION: "Climatização",
  ELECTRICAL: "Elétrica",
  BOTH: "Climatização e elétrica",
};

const statusConfig: Record<
  ClientStatus,
  {
    label: string;
    variant: "success" | "info" | "warning" | "neutral";
  }
> = {
  ACTIVE: {
    label: "Ativo",
    variant: "success",
  },
  RECURRING: {
    label: "Recorrente",
    variant: "info",
  },
  ATTENTION: {
    label: "Requer atenção",
    variant: "warning",
  },
  INACTIVE: {
    label: "Inativo",
    variant: "neutral",
  },
};

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return "Não informado";
  }

  return dateFormatter.format(new Date(value));
}

function formatPhone(value?: string) {
  if (!value) {
    return "Não informado";
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length === 11) {
    return digits.replace(
      /^(\d{2})(\d{1})(\d{4})(\d{4})$/,
      "($1) $2 $3-$4",
    );
  }

  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }

  return value;
}

function formatDocument(value?: string) {
  if (!value) {
    return "Não informado";
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length === 14) {
    return digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5",
    );
  }

  if (digits.length === 11) {
    return digits.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
      "$1.$2.$3-$4",
    );
  }

  return value;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase("pt-BR"))
    .join("");
}

function getTotalLifetimeValue(records: ClientRecord[]) {
  return records.reduce((total, client) => total + client.lifetimeValue, 0);
}

function ClientCard({ client, onEdit, onDelete }: { client: ClientRecord; onEdit: () => void; onDelete: () => void }) {
  const status = statusConfig[client.status];

  return (
    <Card className="group overflow-hidden rounded-[var(--radius-card)] border-border bg-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md dark:hover:border-sky-500/40">
      <CardContent className="p-0">
        <div className="border-b border-border bg-muted/25 p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#08182c] text-xs font-bold text-white">
              {getInitials(client.name)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-foreground">
                    {client.name}
                  </h3>

                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {typeLabels[client.type]}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="-mr-2 -mt-2 h-8 w-8 shrink-0 text-muted-foreground"
                  aria-label={`Editar ${client.name}`}
                  onClick={onEdit}
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant={status.variant}>{status.label}</Badge>

                <Badge variant="outline">
                  {segmentLabels[client.segment]}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 p-3">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Phone
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
            <span>{formatPhone(client.phone)}</span>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Mail
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">
              {client.email ?? "Não informado"}
            </span>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
            <span>
              {client.city}, {client.state}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border pt-2.5">
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
                OS ativas
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {numberFormatter.format(client.activeServiceOrders)}
              </p>
            </div>

            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
                Equipamentos
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {numberFormatter.format(client.installedEquipment)}
              </p>
            </div>

            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
                Contratos
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {numberFormatter.format(client.contracts)}
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-3 rounded-lg bg-muted/55 p-2.5">
            <div>
              <p className="text-[0.65rem] font-medium text-muted-foreground">
                Valor acumulado
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {formatCurrency(client.lifetimeValue)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[0.65rem] font-medium text-muted-foreground">
                Última interação
              </p>
              <p className="mt-1 text-xs font-semibold text-foreground">
                {formatDate(client.lastInteractionAt)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href={`/dashboard/clientes/${client.id}`}>Ver ficha<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={onEdit} aria-label={`Editar ${client.name}`}><Pencil className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="icon" onClick={onDelete} aria-label={`Excluir ${client.name}`}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientesPageContent() {
  const [view, setView] = useState<ClientView>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [clientRecords, setClientRecords] = useState<ClientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<ClientRecord | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [createdClient, setCreatedClient] = useState<ClientRecord | null>(null);

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    try {
      setClientRecords(await listClientsAction());
    } catch (error) {
      setFeedback({ tone: "error", message: error instanceof Error ? error.message : "Não foi possível carregar os clientes." });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void listClientsAction()
      .then((records) => {
        if (active) setClientRecords(records);
      })
      .catch((error: unknown) => {
        if (active) setFeedback({ tone: "error", message: error instanceof Error ? error.message : "Não foi possível carregar os clientes." });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function handleSave(values: ClientFormValues) {
    setIsSaving(true);
    try {
      if (editingClient) await updateClientAction(editingClient.id, values);
      else setCreatedClient(await createClientAction(values));
      setIsFormOpen(false);
      setEditingClient(null);
      setFeedback({ tone: "success", message: editingClient ? "Cliente atualizado com sucesso." : "Cliente cadastrado com sucesso." });
      await loadClients();
    } catch (error) {
      const message = error instanceof DuplicateClientError
        ? `Cadastro não realizado. Já existe: ${error.matches.map((item) => item.name).join(", ")}.`
        : error instanceof Error ? error.message : "Não foi possível salvar o cliente.";
      setFeedback({ tone: "error", message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingClient) return;
    setIsDeleting(true);
    try {
      await deleteClientAction(deletingClient.id);
      setFeedback({ tone: "success", message: "Cliente excluído com segurança." });
      setDeletingClient(null);
      await loadClients();
    } catch (error) {
      setFeedback({ tone: "error", message: error instanceof Error ? error.message : "Não foi possível excluir o cliente." });
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredClients = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLocaleLowerCase("pt-BR");

    return clientRecords.filter((client) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          client.name,
          client.phone,
          client.email,
          client.city,
          client.document,
          segmentLabels[client.segment],
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLocaleLowerCase("pt-BR")
              .includes(normalizedSearch),
          );

      const matchesStatus =
        statusFilter === "ALL" || client.status === statusFilter;

      const matchesType =
        typeFilter === "ALL" || client.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [clientRecords, searchTerm, statusFilter, typeFilter]);

  const activeClients = clientRecords.filter(
    (client) =>
      client.status === "ACTIVE" || client.status === "RECURRING",
  ).length;

  const recurringClients = clientRecords.filter(
    (client) => client.status === "RECURRING",
  ).length;

  const attentionClients = clientRecords.filter(
    (client) =>
      client.status === "ATTENTION" || client.pendingAmount > 0,
  ).length;

  const totalLifetimeValue = getTotalLifetimeValue(clientRecords);

  const summaryCards = [
    {
      label: "Clientes ativos",
      value: numberFormatter.format(activeClients),
      description: "Ativos e recorrentes",
      icon: UsersRound,
      tone: "info" as const,
    },
    {
      label: "Clientes recorrentes",
      value: numberFormatter.format(recurringClients),
      description: "Com contratos ativos",
      icon: BriefcaseBusiness,
      tone: "violet" as const,
    },
    {
      label: "Requerem atenção",
      value: numberFormatter.format(attentionClients),
      description: "Pendências ou acompanhamento",
      icon: AlertCircle,
      tone: "warning" as const,
    },
    {
      label: "Valor da carteira",
      value: formatCurrency(totalLifetimeValue),
      description: "Receita acumulada dos clientes",
      icon: CircleDollarSign,
      tone: "success" as const,
    },
  ];

  return (
    <div className="space-y-3">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <PageHeaderIcon>
              <UsersRound className="h-5 w-5" aria-hidden="true" />
            </PageHeaderIcon>
            <PageHeaderHeading
              title="Clientes"
              description="Gerencie contatos, contratos, equipamentos e histórico de atendimento."
            />
          </PageHeaderIdentity>

          <PageHeaderActions>
            <div className="flex rounded-lg border border-border bg-background p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-2.5",
                  view === "cards" &&
                    "bg-card text-foreground shadow-sm hover:bg-card",
                )}
                onClick={() => setView("cards")}
                aria-pressed={view === "cards"}
              >
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Cartões</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-2.5",
                  view === "list" &&
                    "bg-card text-foreground shadow-sm hover:bg-card",
                )}
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
              >
                <List className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Lista</span>
              </Button>
            </div>

            <Button type="button" size="sm" onClick={() => { setEditingClient(null); setIsFormOpen(true); }}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo cliente
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>

        <PageHeaderToolbar className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_12rem_12rem]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Pesquisar nome, telefone, e-mail, cidade ou documento..."
              className="h-9 pl-10"
              aria-label="Pesquisar clientes"
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-9 text-xs font-medium"
            aria-label="Filtrar por status"
          >
            <option value="ALL">Todos os status</option>
            <option value="ACTIVE">Ativos</option>
            <option value="RECURRING">Recorrentes</option>
            <option value="ATTENTION">Requerem atenção</option>
            <option value="INACTIVE">Inativos</option>
          </Select>

          <Select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="h-9 text-xs font-medium"
            aria-label="Filtrar por tipo"
          >
            <option value="ALL">Todos os tipos</option>
            <option value="RESIDENTIAL">Residencial</option>
            <option value="COMPANY">Empresa</option>
            <option value="CONDOMINIUM">Condomínio</option>
          </Select>
        </PageHeaderToolbar>
      </PageHeader>

      <MetricStrip className="sm:min-w-0 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((metric) => {
          const Icon = metric.icon;

          return (
            <MetricItem
              key={metric.label}
              label={metric.label}
              value={metric.value}
              description={metric.description}
              tone={metric.tone}
              icon={<Icon className="h-4 w-4" aria-hidden="true" />}
            />
          );
        })}
      </MetricStrip>

      {isLoading ? (
        <section className="space-y-2 rounded-xl border bg-card p-3" aria-label="Carregando clientes">
          {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-lg bg-muted" />)}
        </section>
      ) : view === "cards" ? (
        <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={() => { setEditingClient(client); setIsFormOpen(true); }}
              onDelete={() => setDeletingClient(client)}
            />
          ))}

          {filteredClients.length === 0 && (
            <EmptyState
              className="col-span-full"
              size="compact"
              icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
              title="Nenhum cliente encontrado"
              description={clientRecords.length === 0 ? "Cadastre o primeiro cliente para iniciar a carteira." : "Ajuste os termos da pesquisa ou os filtros aplicados."}
            />
          )}
        </section>
      ) : (
        <Table density="compact" scrollHint className="min-w-[75rem]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th className="px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Cliente
                  </th>

                  <th className="px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Contato
                  </th>

                  <th className="px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Localização
                  </th>

                  <th className="px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>

                  <th className="px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Operação
                  </th>

                  <th className="px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Valor acumulado
                  </th>

                  <th className="px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Última interação
                  </th>

                  <th className="w-12 px-3 py-2.5" />
                </tr>
              </thead>

              <tbody className="divide-y divide-border [&_td]:!px-3 [&_td]:!py-2.5">
                {filteredClients.map((client) => {
                  const status = statusConfig[client.status];

                  return (
                    <tr
                      key={client.id}
                      className="transition-colors hover:bg-muted/35"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#08182c] text-xs font-bold text-white">
                            {getInitials(client.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {client.name}
                            </p>

                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {typeLabels[client.type]} ·{" "}
                              {formatDocument(client.document)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-foreground">
                          {formatPhone(client.phone)}
                        </p>

                        <p className="mt-1 max-w-52 truncate text-xs text-muted-foreground">
                          {client.email ?? "Não informado"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-foreground">
                          {client.city}, {client.state}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {segmentLabels[client.segment]}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <Badge variant={status.variant}>
                          {status.label}
                        </Badge>

                        {client.pendingAmount > 0 && (
                          <p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            {formatCurrency(client.pendingAmount)} pendente
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 font-medium text-muted-foreground">
                            <ClipboardList
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {numberFormatter.format(
                              client.activeServiceOrders,
                            )}{" "}
                            OS
                          </span>

                          <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 font-medium text-muted-foreground">
                            <Wrench
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {numberFormatter.format(
                              client.installedEquipment,
                            )}
                          </span>

                          <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 font-medium text-muted-foreground">
                            <PackageCheck
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {numberFormatter.format(client.contracts)}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-foreground">
                        {formatCurrency(client.lifetimeValue)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <CalendarDays
                            className="h-4 w-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                          {formatDate(client.lastInteractionAt)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                        <Button
                          asChild
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Abrir ficha de ${client.name}`}
                        >
                          <Link href={`/dashboard/clientes/${client.id}`}>
                            <ArrowRight
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </Link>
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => { setEditingClient(client); setIsFormOpen(true); }} aria-label={`Editar ${client.name}`}><Pencil className="h-4 w-4" /></Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setDeletingClient(client)} aria-label={`Excluir ${client.name}`}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-8">
                      <EmptyState
                        size="compact"
                        icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
                        title="Nenhum cliente encontrado"
                        description={clientRecords.length === 0 ? "Cadastre o primeiro cliente para iniciar a carteira." : "Ajuste os termos da pesquisa ou os filtros aplicados."}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
        </Table>
      )}

      <ClientFormDrawer
        open={isFormOpen}
        client={editingClient}
        saving={isSaving}
        onClose={() => { if (!isSaving) { setIsFormOpen(false); setEditingClient(null); } }}
        onSubmit={handleSave}
      />

      {createdClient ? (
        <QuickActions
          title={`Cliente ${createdClient.name} cadastrado`}
          description="Escolha o próximo passo para continuar o atendimento."
          actions={[
            { label: "Cadastrar oportunidade", description: "Iniciar uma negociação no CRM.", href: "/dashboard/crm/novo-lead", icon: <BriefcaseBusiness className="h-4 w-4" /> },
            { label: "Criar Ordem de Serviço", description: "Abrir o cadastro de uma nova Ordem.", href: "/dashboard/ordens", icon: <Wrench className="h-4 w-4" /> },
            { label: "Agendar visita", description: "Escolher data, horário e responsável.", href: "/dashboard/agenda", icon: <CalendarDays className="h-4 w-4" /> },
            { label: "Abrir histórico", description: "Ver a ficha e a linha do tempo do cliente.", href: `/dashboard/clientes/${createdClient.id}`, icon: <ClipboardList className="h-4 w-4" /> },
            { label: "Enviar orçamento", description: "Preparar uma precificação para este atendimento.", href: "/dashboard/precificacao", icon: <CircleDollarSign className="h-4 w-4" /> },
          ]}
        />
      ) : null}

      {deletingClient ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-[2px]">
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-client-title" className="w-full max-w-md rounded-xl border bg-card p-5 shadow-2xl">
            <h2 id="delete-client-title" className="text-base font-semibold text-foreground">Excluir cliente?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              <strong className="text-foreground">{deletingClient.name}</strong> será removido das listagens. O registro será mantido localmente como excluído para preservar o histórico.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button autoFocus type="button" variant="secondary" onClick={() => setDeletingClient(null)} disabled={isDeleting}>Cancelar</Button>
              <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={isDeleting}>
                {isDeleting ? "Excluindo..." : <><Trash2 className="h-4 w-4" />Confirmar exclusão</>}
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {feedback ? (
        <div
          role={feedback.tone === "error" ? "alert" : "status"}
          aria-live="polite"
          className={cn(
            "fixed bottom-4 right-4 z-[60] max-w-sm rounded-xl border bg-card px-4 py-3 text-sm font-medium shadow-xl",
            feedback.tone === "success" ? "border-emerald-500/30 text-emerald-600" : "border-rose-500/30 text-rose-600",
          )}
        >
          <div className="flex items-start gap-3"><span>{feedback.message}</span><button type="button" onClick={() => setFeedback(null)} aria-label="Fechar mensagem"><X className="h-4 w-4" /></button></div>
        </div>
      ) : null}
    </div>
  );
}

export default ClientesPageContent;
