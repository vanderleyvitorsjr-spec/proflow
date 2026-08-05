"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Building2,
  ChevronLeft,
  LogOut,
  Menu,
  Moon,
  Sun,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { dashboardNavigation } from "@/constants/navigation";
import { logoutAction } from "@/app/login/actions";
import type { CurrentUserContext } from "@/lib/auth/context";
import { hasPermission, ROLE_LABELS } from "@/lib/auth/permissions";
import { normalizeProperName } from "@/lib/br-formatters";
import { setCompanyStorageContext } from "@/lib/storage/company-storage-key";
import { cn } from "@/lib/utils";
import { GlobalCommandCenter } from "./global-command-center";

function getPageTitle(pathname: string) {
  const item = [...dashboardNavigation]
    .sort((first, second) => second.href.length - first.href.length)
    .find(
    (entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`),
  );

  return item?.title ?? "Dashboard";
}

export function DashboardShell({ children, context }: { children: React.ReactNode; context: CurrentUserContext }) {
  setCompanyStorageContext(context.companyId);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const mainScrollRef = useRef<HTMLElement>(null);

  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  const visibleNavigation = dashboardNavigation.filter(
    (item) => !item.permission || hasPermission(context.role, item.permission, context.permissions),
  );

  const sidebar = (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-white/8 bg-sidebar text-sidebar-foreground shadow-[8px_0_32px_rgb(2_12_27_/_0.08)] transition-[width] duration-200",
        isCollapsed ? "w-[4.75rem]" : "w-64",
      )}
    >
      <div className="flex h-[4.25rem] items-center gap-3 border-b border-white/8 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.7rem] bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md shadow-blue-950/25">
          <Wrench className="h-5 w-5" aria-hidden="true" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-tight text-white">
              ProFlow
            </p>
            <p className="truncate text-[0.68rem] font-medium text-sidebar-muted">
              Operação técnica
            </p>
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto hidden text-sidebar-muted hover:bg-white/8 hover:text-white lg:inline-flex"
          onClick={() => setIsCollapsed((value) => !value)}
          aria-label="Recolher menu"
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")}
            aria-hidden="true"
          />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto text-sidebar-muted hover:bg-white/8 hover:text-white lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      <nav className="proflow-scrollbar flex-1 space-y-1 overflow-y-auto px-2.5 py-4">
        {visibleNavigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              title={isCollapsed ? item.title : undefined}
              className={cn(
                "group relative flex h-10 items-center gap-3 rounded-[var(--radius-control)] px-3 text-[0.82rem] font-medium transition-all duration-150",
                isCollapsed && "justify-center px-0",
                isActive
                  ? "bg-sidebar-active text-white shadow-sm ring-1 ring-white/8 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-sky-400"
                  : "text-sidebar-muted hover:bg-white/[0.055] hover:text-white",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {!isCollapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/8 p-2.5">
        <form action={logoutAction}>
        <button type="submit"
          className={cn(
            "flex h-10 w-full items-center gap-3 rounded-[var(--radius-control)] px-3 text-[0.82rem] font-medium text-rose-300 transition-colors hover:bg-rose-400/10 hover:text-rose-200",
            isCollapsed && "justify-center px-0",
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          {!isCollapsed && <span>Sair</span>}
        </button>
        </form>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <div className="hidden lg:block">{sidebar}</div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[4.25rem] items-center gap-3 border-b border-border bg-card/95 px-4 shadow-xs backdrop-blur supports-[backdrop-filter]:bg-card/88 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>

          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {pageTitle}
            </p>
            <p className="hidden text-[0.68rem] font-medium text-muted-foreground sm:block">
              {normalizeProperName(context.companyName)}
            </p>
          </div>

          <div className="ml-auto hidden w-full max-w-md items-center lg:flex">
            <GlobalCommandCenter />
          </div>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <div className="hidden h-9 items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface-subtle px-3 text-xs font-semibold text-foreground md:flex">
              <Building2 className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              {normalizeProperName(context.companyName)}
            </div>
            <div className="flex lg:hidden"><GlobalCommandCenter /></div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Alternar tema"
            >
              <Sun className="h-5 w-5 dark:hidden" aria-hidden="true" />
              <Moon className="hidden h-5 w-5 dark:block" aria-hidden="true" />
            </Button>
            <Link
              href="/dashboard/perfil"
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] bg-gradient-to-br from-sky-500 to-blue-700 text-xs font-bold text-white shadow-sm ring-1 ring-blue-700/15 transition-transform hover:scale-[1.03]"
              aria-label="Perfil"
            >
              {context.userName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
            </Link>
            <span className="hidden text-[10px] text-muted-foreground xl:inline">{ROLE_LABELS[context.role]}</span>
          </div>
        </header>

        <main ref={mainScrollRef} className="proflow-scrollbar flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
          <div className="proflow-page">{children}</div>
        </main>
      </div>
    </div>
  );
}
