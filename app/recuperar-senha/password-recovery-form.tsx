"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { requestPasswordResetAction } from "./actions";

export function PasswordRecoveryForm() {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    {},
  );

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="recovery-email" className="text-slate-200">
          E-mail da conta
        </Label>
        <Input
          id="recovery-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="seu@email.com"
          required
          className="h-11 rounded-xl border-slate-700 bg-slate-950/60 text-white placeholder:text-slate-600"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-300">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm leading-6 text-emerald-200"
        >
          {state.success}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-sky-500 font-semibold text-slate-950 hover:bg-sky-400"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
        {pending ? "Enviando..." : "Enviar link de recuperação"}
      </Button>

      <Button asChild variant="ghost" className="w-full text-slate-300">
        <Link href="/login">
          <ArrowLeft className="size-4" />
          Voltar para o acesso
        </Link>
      </Button>
    </form>
  );
}
