"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Wrench } from "lucide-react";
import { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SESSION_KEY = "proflow-session";

export default function Login() {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        user: "Pedro Vieira",
        company: "ProFlow Services LTDA",
        signedAt: new Date().toISOString(),
      }),
    );

    router.replace("/dashboard");
  }

  return (
    <main className="grid min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden flex-col justify-between bg-blue-700 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <Wrench className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold">ProFlow</span>
        </div>
        <div className="max-w-xl space-y-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">
            Gestão operacional completa
          </p>
          <h1 className="text-5xl font-extrabold leading-tight">
            Controle clientes, equipes, serviços e finanças em um só lugar.
          </h1>
          <p className="text-lg text-blue-100">
            MVP navegável para operação técnica com dashboard, CRM, agenda, estoque,
            financeiro e relatórios.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {["38 OS ativas", "92% SLA", "R$ 86 mil/mês"].map((item) => (
            <div key={item} className="rounded-xl bg-white/10 p-4 font-semibold">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-xl p-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-blue-600">ProFlow</p>
            <h2 className="text-3xl font-bold text-slate-950 dark:text-white">
              Acessar sistema
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Qualquer e-mail e senha válidos liberam o acesso.
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="********" required />
            </div>

            <div className="flex items-center justify-between text-sm">
              <Label className="flex cursor-pointer items-center gap-2 font-normal text-slate-600 dark:text-slate-400">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                Lembrar-me
              </Label>
              <Link href="/login" className="font-medium text-blue-600 hover:underline">
                Recuperar senha
              </Link>
            </div>

            <Button type="submit" className="w-full rounded-xl">
              Entrar
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        </Card>
      </section>
    </main>
  );
}
