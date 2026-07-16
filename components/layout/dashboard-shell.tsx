"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Bell,
  Building2,
  ChevronLeft,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardNavigation } from "@/constants/navigation";
import { cn } from "@/lib/utils";

const SESSION_KEY = "proflow-session";

function getPageTitle(pathname: string) {
  const item = [...dashboardNavigation]
    .sort((first, second) => second.href.length - first.href.length)
    .find(
    (entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`),
  );

  return item?.title ?? "Dashboard";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const mainScrollRef = useRef<HTMLElement>(null);

  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const session = window.localStorage.getItem(SESSION_KEY);

      if (!session) {
        router.replace("/login");
        return;
      }

      setIsReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [router]);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  function handleLogout() {
    window.localStorage.removeItem(SESSION_KEY);
    router.replace("/login");
  }

  if (!isReady) {
    return (
      <div className="flex h-screen overflow-hidden bg-background" aria-label="Carregando painel">
        <aside className="hidden w-64 shrink-0 border-r border-white/8 bg-sidebar p-4 lg:block">
          <div className="flex h-10 items-center gap-3">
            <Skeleton className="size-9 bg-white/15" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24 bg-white/15" />
              <Skeleton className="h-2.5 w-16 bg-white/10" />
            </div>
          </div>
          <div className="mt-8 space-y-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full bg-white/8" />
            ))}
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-[4.25rem] items-center gap-3 border-b bg-card px-4 sm:px-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="ml-auto hidden h-9 w-72 lg:block" />
            <Skeleton className="size-9" />
            <Skeleton className="size-9" />
          </header>
          <main className="flex-1 p-4 sm:p-5 lg:p-6">
            <div className="mx-auto max-w-[100rem] space-y-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 rounded-none bg-card" />
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <Skeleton className="h-72 rounded-xl lg:col-span-2" />
                <Skeleton className="h-72 rounded-xl" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
        {dashboardNavigation.map((item) => {
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
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "flex h-10 w-full items-center gap-3 rounded-[var(--radius-control)] px-3 text-[0.82rem] font-medium text-rose-300 transition-colors hover:bg-rose-400/10 hover:text-rose-200",
            isCollapsed && "justify-center px-0",
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          {!isCollapsed && <span>Logout</span>}
        </button>
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
              ProFlow Services LTDA
            </p>
          </div>

          <div className="ml-auto hidden w-full max-w-md items-center lg:flex">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Pesquisa global"
                placeholder="Pesquisar clientes, OS, equipamentos..."
                className="h-9 bg-surface-subtle pl-9 shadow-none"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <div className="hidden h-9 items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface-subtle px-3 text-xs font-semibold text-foreground md:flex">
              <Building2 className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              ProFlow Services
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label="Notificações">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </Button>
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
              PV
            </Link>
          </div>
        </header>

        <main ref={mainScrollRef} className="proflow-scrollbar flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
          <div className="proflow-page">{children}</div>
        </main>
      </div>
    </div>
  );
}
