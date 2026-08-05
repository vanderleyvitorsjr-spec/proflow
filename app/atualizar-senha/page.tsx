import { KeyRound, ShieldCheck, Workflow } from "lucide-react";

import { Card } from "@/components/ui/card";

import { PasswordUpdateForm } from "./password-update-form";

export default function PasswordUpdatePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(14,165,233,0.19),transparent_32%),radial-gradient(circle_at_84%_82%,rgba(59,130,246,0.14),transparent_30%)]"
      />

      <Card className="relative w-full max-w-md border-white/10 bg-slate-900/90 p-6 text-white shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-sky-300/25 bg-sky-400/10">
            <Workflow className="size-5 text-sky-300" />
          </div>
          <div>
            <p className="font-bold">ProFlow</p>
            <p className="text-xs text-slate-400">Proteção da conta</p>
          </div>
        </div>

        <div className="mb-7">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <ShieldCheck className="size-3.5" />
            Sessão de recuperação confirmada
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <KeyRound className="size-6 text-sky-300" />
            Criar nova senha
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Use uma senha exclusiva, com pelo menos oito caracteres.
          </p>
        </div>

        <PasswordUpdateForm />
      </Card>
    </main>
  );
}
