"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updatePasswordAction } from "./actions";

export function PasswordUpdateForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, {});
  const [visible, setVisible] = useState(false);

  return (
    <form action={action} className="space-y-5">
      <PasswordField
        id="new-password"
        name="password"
        label="Nova senha"
        visible={visible}
        autoComplete="new-password"
      />
      <PasswordField
        id="confirm-password"
        name="confirmation"
        label="Confirmar nova senha"
        visible={visible}
        autoComplete="new-password"
      />

      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="inline-flex items-center gap-2 text-sm font-medium text-sky-300 hover:text-sky-200"
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        {visible ? "Ocultar senhas" : "Mostrar senhas"}
      </button>

      {state.error ? (
        <p role="alert" className="text-sm leading-6 text-red-300">
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-sky-500 font-semibold text-slate-950 hover:bg-sky-400"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {pending ? "Salvando..." : "Salvar nova senha"}
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

function PasswordField({
  id,
  name,
  label,
  visible,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  visible: boolean;
  autoComplete: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-slate-200">
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        minLength={8}
        placeholder="Mínimo de 8 caracteres"
        className="h-11 rounded-xl border-slate-700 bg-slate-950/60 text-white placeholder:text-slate-600"
      />
    </div>
  );
}
