"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Building2, ChevronLeft, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { logoutAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { dashboardNavigation } from "@/constants/navigation";
import type { CurrentUserContext } from "@/lib/auth/context";
import { hasPermission, ROLE_LABELS } from "@/lib/auth/permissions";
import { normalizeProperName } from "@/lib/br-formatters";
import { setCompanyStorageContext } from "@/lib/storage/company-storage-key";
import { cn } from "@/lib/utils";

function getPageTitle(pathname: string) {
  const item = [...dashboardNavigation]
    .sort((first, second) => second.href.length - first.href.length)
    .find((entry) =>
      entry.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname === entry.href || pathname.startsWith(`${entry.href}/`),
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
    setIsMobileOpen(false);
  }, [pathname]);

  const visibleNavigation = dashboardNavigation.filter(
    (item) => !item.permission || hasPermission(context.role, item.permission, context.permissions),
  );

  function Sidebar({ mobile = false }: { mobile?: boolean }) {
    const collapsed = mobile ? false : isCollapsed;
    return (
      <aside
        className={cn(
          "flex h-full min-h-0 flex-col border-r border-white/8 bg-sidebar text-sidebar-foreground shadow-[8px_0_32px_rgb(2_12_27_/_0.08)] transition-[width] duration-200",
          mobile ? "w-[min(88vw,18rem)]" : collapsed ? "w-[4.75rem]" : "w-64",
        )}
      >
        <div className="flex h-[4.25rem] shrink-0 items-center gap-3 border-b border-white/8 px-3.5 sm:px-4">
          {collapsed ? (
            <Image
              src="/proflow-mark-main.png"
              alt="ProFlow"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 object-contain"
              priority
            />
          ) : (
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src="/proflow-logo-responsive.png"
                alt="ProFlow"
                width={176}
                height={52}
                className="h-10 w-auto max-w-[11rem] object-contain object-left"
                priority
              />
            </div>
          )}

          {mobile ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto text-sidebar-muted hover:bg-white/8 hover:text-white"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto text-sidebar-muted hover:bg-white/8 hover:text-white"
              onClick={() => setIsCollapsed((value) => !value)}
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} aria-hidden="true" />
            </Button>
          )}
        </div>

        <nav className="proflow-scrollbar flex-1 space-y-1 overflow-y-auto px-2.5 py-3 sm:py-4">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.title : undefined}
                className={cn(
                  "group relative flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 text-[0.84rem] font-medium transition-all duration-150",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-sidebar-active text-white shadow-sm ring-1 ring-white/8 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-sky-400"
                    : "text-sidebar-muted hover:bg-white/[0.055] hover:text-white",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-white/8 p-2.5">
          <form action={logoutAction}>
            <button
              type="submit"
              className={cn(
                "flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-control)] px-3 text-[0.84rem] font-medium text-rose-300 transition-colors hover:bg-rose-400/10 hover:text-rose-200",
                collapsed && "justify-center px-0",
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              {!collapsed && <span>Sair</span>}
            </button>
          </form>
        </div>
      </aside>
    );
  }

  return (
    <div className="flex h-[100dvh] min-h-0 w-full overflow-hidden bg-background text-foreground">
      <div className="hidden shrink-0 lg:block">
        <Sidebar />
      </div>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 max-w-full">
            <Sidebar mobile />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex min-h-[3.75rem] shrink-0 items-center gap-2 border-b border-border bg-card/95 px-3 shadow-xs backdrop-blur supports-[backdrop-filter]:bg-card/88 sm:min-h-[4.25rem] sm:gap-3 sm:px-5 lg:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>

          <div className="min-w-0 flex-1 lg:flex-none">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base lg:text-lg">{pageTitle}</p>
            <p className="hidden truncate text-[0.68rem] font-medium text-muted-foreground sm:block lg:max-w-[18rem]">
              {normalizeProperName(context.companyName)}
            </p>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="hidden h-9 max-w-[16rem] items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface-subtle px-3 text-xs font-semibold text-foreground xl:flex">
              <Building2 className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              <span className="truncate">{normalizeProperName(context.companyName)}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Alternar tema"
            >
              <Sun className="h-5 w-5 dark:hidden" aria-hidden="true" />
              <Moon className="hidden h-5 w-5 dark:block" aria-hidden="true" />
            </Button>
            <Link
              href="/dashboard/perfil"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-gradient-to-br from-sky-500 to-blue-700 text-xs font-bold text-white shadow-sm ring-1 ring-blue-700/15 transition-transform hover:scale-[1.03]"
              aria-label="Perfil"
            >
              {context.userName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
            </Link>
            <span className="hidden text-[10px] text-muted-foreground 2xl:inline">{ROLE_LABELS[context.role]}</span>
          </div>
        </header>

        <main
          ref={mainScrollRef}
          className="proflow-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:p-4 lg:p-5 xl:p-6"
        >
          <div className="proflow-page">{children}</div>
        </main>
      </div>
    </div>
  );
}
