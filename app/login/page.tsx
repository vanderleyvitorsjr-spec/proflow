import {
  BadgeCheck,
  BarChart3,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import { Card } from "@/components/ui/card";

import { LoginForm } from "./login-form";

const highlights = [
  {
    icon: Workflow,
    title: "Operação em um só lugar",
    description: "Clientes, oportunidades, Ordens, Agenda, Estoque e Financeiro conectados.",
  },
  {
    icon: BarChart3,
    title: "Decisões com clareza",
    description: "Indicadores e alertas para acompanhar o que exige atenção.",
  },
  {
    icon: CalendarDays,
    title: "Rotina organizada",
    description: "Compromissos, responsáveis e próximos passos sempre visíveis.",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    reason?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const query = await searchParams;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(14,165,233,0.20),transparent_32%),radial-gradient(circle_at_82%_78%,rgba(59,130,246,0.16),transparent_30%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1500px] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="hidden min-h-screen flex-col justify-between px-12 py-10 lg:flex xl:px-16 xl:py-14">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-sky-300/25 bg-sky-400/10 shadow-[0_0_40px_rgba(56,189,248,.16)]">
              <Workflow className="size-5 text-sky-300" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">ProFlow</p>
              <p className="text-xs text-slate-400">Gestão operacional inteligente</p>
            </div>
          </div>

          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold text-sky-200">
              <Sparkles className="size-3.5" />
              Mais controle. Menos retrabalho.
            </div>

            <h1 className="max-w-xl text-5xl font-black leading-[1.05] tracking-[-0.04em] xl:text-6xl">
              Sua operação,
              <span className="block bg-gradient-to-r from-sky-300 via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                fluindo com clareza.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Centralize a rotina da empresa, acompanhe os serviços e tome
              decisões com informações organizadas em tempo real.
            </p>

            <div className="mt-10 grid gap-4">
              {highlights.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="flex max-w-xl items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm"
                >
                  <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-100">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="size-4 text-emerald-400" />
            Sessão segura e dados isolados por empresa.
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:bg-black/10">
          <div className="w-full max-w-[470px]">
            <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-sky-300/25 bg-sky-400/10">
                <Workflow className="size-5 text-sky-300" />
              </div>
              <div>
                <p className="text-lg font-bold">ProFlow</p>
                <p className="text-xs text-slate-400">
                  Gestão operacional inteligente
                </p>
              </div>
            </div>

            <Card className="border-white/10 bg-slate-900/85 p-6 text-white shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8">
              <div className="mb-7">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  <BadgeCheck className="size-3.5" />
                  Ambiente seguro
                </div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Acessar o ProFlow
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Entre com sua conta Google ou utilize seu e-mail e senha.
                </p>
              </div>

              {query.reason === "session-expired" ? (
                <p
                  role="status"
                  className="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200"
                >
                  Sua sessão expirou. Entre novamente para continuar.
                </p>
              ) : null}

              {query.error ? (
                <p
                  role="alert"
                  className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200"
                >
                  Não foi possível concluir o acesso com Google. Tente novamente.
                </p>
              ) : null}

              {query.success === "password-updated" ? (
                <p
                  role="status"
                  className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200"
                >
                  Senha atualizada com sucesso. Entre usando a nova senha.
                </p>
              ) : null}

              <LoginForm next={query.next} />

              <p className="mt-6 text-center text-xs leading-5 text-slate-500">
                Ao continuar, você acessará apenas os dados da empresa vinculada
                à sua conta.
              </p>
            </Card>

            <p className="mt-5 text-center text-xs text-slate-500">
              ProFlow · Gestão organizada para empresas de serviço
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
