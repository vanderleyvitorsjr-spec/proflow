"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/providers/theme-provider";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  ChevronLeft,
  Home,
  LogOut,
  Menu,
  MoreHorizontal,
  Moon,
  Sun,
  UserRound,
  Users,
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
  const initials = context.userName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  const visibleNavigation = dashboardNavigation.filter(
    (item) => !item.permission || hasPermission(context.role, item.permission, context.permissions),
  );

  const sidebar = (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        isCollapsed ? "w-[4.75rem]" : "w-[17.5rem]",
      )}
    >
      <div className="flex h-[5.25rem] items-center gap-3 px-4">
        <Link href="/dashboard" className={cn("flex min-w-0 items-center gap-3", isCollapsed && "mx-auto")}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Wrench className="h-5 w-5" aria-hidden="true" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-[1.05rem] font-bold tracking-tight text-sidebar-foreground">ProFlow</p>
              <p className="truncate text-[0.68rem] font-medium text-sidebar-muted">Gestão técnica</p>
            </div>
          )}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto hidden h-8 w-8 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground lg:inline-flex"
          onClick={() => setIsCollapsed((value) => !value)}
          aria-label="Recolher menu"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto h-8 w-8 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      {!isCollapsed && (
        <Link
          href="/dashboard/perfil"
          onClick={() => setIsMobileOpen(false)}
          className="mx-3 mb-3 flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-card p-3 transition-colors hover:bg-sidebar-hover"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary ring-1 ring-primary/20">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{normalizeProperName(context.userName)}</p>
            <p className="truncate text-[0.68rem] text-sidebar-muted">{ROLE_LABELS[context.role]} · ver perfil</p>
          </div>
        </Link>
      )}

      <nav className="proflow-scrollbar flex-1 space-y-1 overflow-y-auto px-2.5 pb-4">
        {visibleNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              title={isCollapsed ? item.title : undefined}
              className={cn(
                "group relative flex min-h-10 items-center gap-3 rounded-xl px-3 text-[0.79rem] font-semibold transition-colors",
                isCollapsed && "justify-center px-0",
                isActive
                  ? "bg-sidebar-active text-sidebar-active-foreground"
                  : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
              )}
            >
              <span className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                isActive ? "bg-primary/15 text-primary" : "bg-sidebar-icon text-sidebar-muted group-hover:text-sidebar-foreground",
              )}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              {!isCollapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2.5">
        <form action={logoutAction}>
          <button
            type="submit"
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[0.79rem] font-semibold text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground",
              isCollapsed && "justify-center px-0",
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
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
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[4.25rem] items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
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

          <div className="min-w-0 lg:hidden">
            <p className="truncate text-base font-semibold tracking-tight text-foreground">{pageTitle}</p>
            <p className="hidden text-[0.68rem] font-medium text-muted-foreground sm:block">{normalizeProperName(context.companyName)}</p>
          </div>

          <div className="hidden w-full max-w-xl items-center lg:flex">
            <GlobalCommandCenter />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <div className="flex lg:hidden"><GlobalCommandCenter /></div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Alternar tema"
            >
              <Sun className="h-4 w-4 dark:hidden" aria-hidden="true" />
              <Moon className="hidden h-4 w-4 dark:block" aria-hidden="true" />
            </Button>
            <Link
              href="/dashboard/perfil"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-[0.68rem] font-bold text-primary ring-1 ring-primary/20 transition hover:bg-primary/20"
              aria-label="Perfil"
            >
              {initials}
            </Link>
          </div>
        </header>

        <main ref={mainScrollRef} className="proflow-scrollbar flex-1 overflow-y-auto px-3 pb-24 pt-4 sm:px-5 sm:pb-24 sm:pt-5 lg:px-8 lg:pb-8 lg:pt-7 xl:px-10">
          <div className="proflow-page">{children}</div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/98 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur lg:hidden" aria-label="Navegação principal móvel">
          {[
            { href: "/dashboard", label: "Início", icon: Home },
            { href: "/dashboard/agenda", label: "Agenda", icon: CalendarDays },
            { href: "/dashboard/ordens", label: "OS", icon: ClipboardList },
            { href: "/dashboard/clientes", label: "Clientes", icon: Users },
          ].map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            return (
              <Link key={item.href} href={item.href} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[0.65rem] font-semibold", active ? "text-primary" : "text-muted-foreground")}>
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button type="button" onClick={() => setIsMobileOpen(true)} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[0.65rem] font-semibold text-muted-foreground">
            <MoreHorizontal className="h-5 w-5" />
            <span>Mais</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
