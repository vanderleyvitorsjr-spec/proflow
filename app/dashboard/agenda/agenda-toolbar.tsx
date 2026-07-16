import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

import type { AgendaView } from "./agenda-data";

type AgendaToolbarProps = {
  view: AgendaView;
  searchTerm: string;
  typeFilter: string;
  technicianFilter: string;
  periodLabel: string;
  eventTypes: Array<{
    value: string;
    label: string;
  }>;
  technicians: string[];
  onViewChange: (view: AgendaView) => void;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onTechnicianFilterChange: (value: string) => void;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
  onToday: () => void;
  onNewEvent: () => void;
};

const views: Array<{
  value: AgendaView;
  label: string;
}> = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

export function AgendaToolbar({
  view,
  searchTerm,
  typeFilter,
  technicianFilter,
  periodLabel,
  eventTypes,
  technicians,
  onViewChange,
  onSearchChange,
  onTypeFilterChange,
  onTechnicianFilterChange,
  onPreviousPeriod,
  onNextPeriod,
  onToday,
  onNewEvent,
}: AgendaToolbarProps) {
  return (
    <PageHeader>
      <PageHeaderContent>
        <PageHeaderIdentity>
          <PageHeaderIcon>
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </PageHeaderIcon>
          <PageHeaderHeading
            title="Agenda"
            description="Organize atendimentos, equipes, visitas e Ordens de Serviço."
          />
        </PageHeaderIdentity>

        <PageHeaderActions>
          <Button type="button" variant="secondary" size="sm">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Mais filtros
          </Button>

          <Button type="button" variant="secondary" size="sm">
            Nova OS
          </Button>

          <Button type="button" size="sm" onClick={onNewEvent}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo evento
          </Button>
        </PageHeaderActions>
      </PageHeaderContent>

      <PageHeaderToolbar className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_12rem_14rem]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />

          <Input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Pesquisar cliente, serviço, OS, técnico ou cidade..."
            className="h-9 pl-10"
            aria-label="Pesquisar eventos"
          />
        </div>

        <Select
          value={typeFilter}
          onChange={(event) => onTypeFilterChange(event.target.value)}
          className="h-9 text-xs font-medium"
          aria-label="Filtrar por tipo de evento"
        >
          <option value="ALL">Todos os serviços</option>

          {eventTypes.map((eventType) => (
            <option key={eventType.value} value={eventType.value}>
              {eventType.label}
            </option>
          ))}
        </Select>

        <Select
          value={technicianFilter}
          onChange={(event) => onTechnicianFilterChange(event.target.value)}
          className="h-9 text-xs font-medium"
          aria-label="Filtrar por técnico"
        >
          <option value="ALL">Todos os responsáveis</option>

          {technicians.map((technician) => (
            <option key={technician} value={technician}>
              {technician}
            </option>
          ))}
        </Select>
      </PageHeaderToolbar>

      <div className="flex flex-col gap-2 border-t border-border px-4 py-2.5 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onToday}
          >
            Hoje
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onPreviousPeriod}
            aria-label="Período anterior"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onNextPeriod}
            aria-label="Próximo período"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>

          <p className="ml-1 text-sm font-bold capitalize text-foreground">
            {periodLabel}
          </p>
        </div>

        <div className="flex w-full rounded-lg border border-border bg-background p-1 lg:w-auto">
          {views.map((item) => (
            <Button
              key={item.value}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 px-4 lg:flex-none",
                view === item.value &&
                  "bg-card text-foreground shadow-sm hover:bg-card",
              )}
              onClick={() => onViewChange(item.value)}
              aria-pressed={view === item.value}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </PageHeader>
  );
}
