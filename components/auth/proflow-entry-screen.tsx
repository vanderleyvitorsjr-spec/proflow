import Image from "next/image";
import {
  BadgeCheck,
  BarChart3,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Wrench,
  Workflow,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { LoginForm } from "@/app/login/login-form";

const highlightCards = [
  {
    icon: Workflow,
    title: "Operação em um só fluxo",
    description: "CRM, clientes, Ordens de Serviço, precificação e financeiro conectados.",
  },
  {
    icon: WalletCards,
    title: "Decisões com controle",
    description: "Indicadores e finanças organizados para reduzir retrabalho e dar clareza.",
  },
  {
    icon: Wrench,
    title: "Feito para empresas técnicas",
    description: "Atendimento, execução, acompanhamento e gestão no mesmo ambiente.",
  },
];

export type EntryQuery = {
  next?: string;
  reason?: string;
  error?: string;
  success?: string;
};

export function ProFlowEntryScreen({ query }: { query: EntryQuery }) {
  return (
    <main className="proflow-entry-page relative min-h-[100dvh] overflow-x-hidden bg-[#020817] text-white lg:h-[100dvh] lg:overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(14,165,233,0.18),transparent_29%),radial-gradient(circle_at_86%_12%,rgba(37,99,235,0.16),transparent_25%),radial-gradient(circle_at_70%_86%,rgba(56,189,248,0.09),transparent_27%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.14)_1px,transparent_1px)] [background-size:40px_40px]"
      />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[1500px] items-stretch p-0 sm:p-3 lg:h-[100dvh] lg:min-h-0 lg:items-center lg:p-4 xl:p-5">
        <div className="proflow-entry-panel grid w-full min-w-0 overflow-hidden border-white/8 bg-[#051227]/94 shadow-[0_24px_90px_rgba(2,8,23,.56)] backdrop-blur-xl sm:rounded-[28px] sm:border lg:h-full lg:max-h-[940px] lg:grid-cols-[minmax(0,1.08fr)_minmax(25rem,.92fr)]">
          <section className="proflow-entry-left relative flex min-w-0 flex-col border-b border-white/8 px-5 py-5 sm:px-7 sm:py-6 lg:min-h-0 lg:justify-between lg:border-b-0 lg:border-r lg:px-8 lg:py-7 xl:px-10 xl:py-8">
            <div className="min-w-0">
              <Image
                src="/proflow-logo-responsive.png"
                alt="ProFlow"
                width={220}
                height={54}
                className="h-10 w-auto max-w-[12rem] object-contain object-left sm:h-11 sm:max-w-[13rem] lg:h-12 lg:max-w-[14rem]"
                priority
              />

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-sky-200 sm:mt-6 sm:text-xs lg:mt-7">
                <Sparkles className="size-3.5" />
                Gestão operacional inteligente
              </div>

              <div className="mt-5 max-w-2xl sm:mt-6 lg:mt-7">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-300/90 sm:text-xs">
                  Operação, processos e crescimento
                </p>
                <h1 className="max-w-[15ch] text-[2.15rem] font-black leading-[0.98] tracking-[-0.05em] text-white sm:text-5xl lg:text-[clamp(2.55rem,4.2vw,4.3rem)]">
                  Seu negócio técnico,
                  <span className="block bg-gradient-to-r from-sky-300 via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                    em um só fluxo.
                  </span>
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7 lg:mt-5 lg:text-[clamp(.9rem,1.2vw,1.08rem)]">
                  Centralize a operação, acompanhe serviços e tome decisões com informações organizadas em tempo real.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300 sm:mt-6 sm:text-sm lg:mt-7">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-400" />
                  Dados protegidos
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-4 text-sky-300" />
                  Indicadores claros
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <CalendarDays className="size-4 text-blue-300" />
                  Rotina organizada
                </div>
              </div>
            </div>

            <div className="proflow-entry-features mt-6 hidden grid-cols-3 gap-3 xl:grid">
              {highlightCards.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 shadow-[0_12px_40px_rgba(2,8,23,.16)] backdrop-blur-sm"
                >
                  <div className="flex size-9 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300 ring-1 ring-sky-400/15">
                    <Icon className="size-4.5" />
                  </div>
                  <h2 className="mt-3 text-sm font-semibold text-slate-100">{title}</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="proflow-entry-login flex min-w-0 items-center justify-center px-4 py-5 sm:px-7 sm:py-7 lg:min-h-0 lg:px-8 lg:py-6 xl:px-10">
            <div className="w-full max-w-[470px]">
              <Card className="proflow-login-card border-white/10 bg-[#08172c]/92 p-5 text-white shadow-[0_24px_70px_rgba(2,8,23,.55)] backdrop-blur-xl sm:p-7">
                <div className="mb-5 sm:mb-6">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300 sm:mb-4">
                    <BadgeCheck className="size-3.5" />
                    Ambiente seguro
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Acessar o ProFlow
                  </h2>
                  <p className="mt-1.5 text-sm leading-6 text-slate-400 sm:mt-2">
                    Entre com sua conta Google ou utilize seu e-mail e senha.
                  </p>
                </div>

                {query.reason === "session-expired" ? (
                  <p role="status" className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
                    Sua sessão expirou. Entre novamente para continuar.
                  </p>
                ) : null}

                {query.error ? (
                  <p role="alert" className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
                    Não foi possível concluir o acesso com Google. Tente novamente.
                  </p>
                ) : null}

                {query.success === "password-updated" ? (
                  <p role="status" className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">
                    Senha atualizada com sucesso. Entre usando a nova senha.
                  </p>
                ) : null}

                <LoginForm next={query.next} />

                <p className="mt-5 text-center text-[11px] leading-5 text-slate-500 sm:text-xs">
                  Ao continuar, você acessará apenas os dados da empresa vinculada à sua conta.
                </p>
              </Card>

              <p className="mt-4 text-center text-[11px] text-slate-500 sm:text-xs">
                ProFlow · Gestão organizada para empresas de serviço
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
