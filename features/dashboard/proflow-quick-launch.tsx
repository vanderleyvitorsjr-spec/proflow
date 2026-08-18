import Link from "next/link";
import { CalendarDays, ClipboardList, FileText, ReceiptText, UserPlus, Wrench } from "lucide-react";

const actions = [
  { href: "/dashboard/ordens", label: "Nova OS", detail: "Abrir atendimento", icon: ClipboardList },
  { href: "/dashboard/orcamentos/novo", label: "Novo orçamento", detail: "Montar proposta", icon: FileText },
  { href: "/dashboard/clientes", label: "Novo cliente", detail: "Cadastrar contato", icon: UserPlus },
  { href: "/dashboard/agenda", label: "Agenda", detail: "Programar visita", icon: CalendarDays },
  { href: "/dashboard/servicos", label: "Serviços", detail: "Clima, elétrica e T.I.", icon: Wrench },
  { href: "/dashboard/recibos", label: "Recibo", detail: "Registrar recebimento", icon: ReceiptText },
] as const;

export function ProFlowQuickLaunch() {
  return (
    <section className="space-y-2" aria-label="Atalhos operacionais">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Acesso rápido</p>
          <h2 className="text-base font-semibold">Operação do dia</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href} className="group flex min-h-20 items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/45 hover:bg-muted/35">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15"><Icon className="h-4 w-4" /></span>
              <span className="min-w-0"><span className="block truncate text-sm font-semibold">{action.label}</span><span className="block truncate text-[0.68rem] text-muted-foreground">{action.detail}</span></span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
