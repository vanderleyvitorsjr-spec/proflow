import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="mx-auto max-w-3xl space-y-8 text-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            ProFlow
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
            Gestão operacional para empresas técnicas.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Plataforma multiempresa para climatização, refrigeração, elétrica e
            manutenção, preparada para CRM, ordens de serviço, financeiro, estoque e
            precificação inteligente.
          </p>
        </div>

        <Button asChild size="lg">
          <Link href="/login">
            Acessar o Sistema
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </section>
    </main>
  );
}
