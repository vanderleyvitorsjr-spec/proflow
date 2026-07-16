import Link from "next/link";
import {
  CalendarDays,
  Plus,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type DashboardHeaderProps = {
  userName?: string;
  period?: string;
  onRefresh?: () => void;
  onChangePeriod?: () => void;
};

function getGreeting() {
  const currentHour = new Date().getHours();

  if (currentHour < 12) {
    return "Bom dia";
  }

  if (currentHour < 18) {
    return "Boa tarde";
  }

  return "Boa noite";
}

export function DashboardHeader({
  userName,
  period = "Últimos 30 dias",
  onRefresh,
  onChangePeriod,
}: DashboardHeaderProps) {
  const greeting = getGreeting();
  const displayName = userName?.trim();

  return (
    <header className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-card px-4 py-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {displayName
              ? `${greeting}, ${displayName}.`
              : "Dashboard"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Visão executiva da operação · {period}
          </p>
      </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onChangePeriod}
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Alterar período
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Atualizar
          </Button>

          <Button
            asChild
            size="sm"
          >
            <Link href="/dashboard/ordens">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova OS
            </Link>
          </Button>
        </div>
    </header>
  );
}

export default DashboardHeader;
