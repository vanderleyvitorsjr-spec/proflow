"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { loginAction } from "./actions";

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.64-2.37l-3.24-2.54c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.92A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.46H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.54l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.51 3.83 1.5l2.88-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.46l3.35 2.62C7.18 7.71 9.39 5.95 12 5.95Z"
      />
    </svg>
  );
}

function safeNext(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, {});
  const [showPassword, setShowPassword] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setGooglePending(true);
    setGoogleError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", safeNext(next));

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callback.toString(),
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        setGoogleError(
          "Não foi possível iniciar o acesso com Google. Tente novamente.",
        );
        setGooglePending(false);
      }
    } catch {
      setGoogleError(
        "Não foi possível iniciar o acesso com Google. Tente novamente.",
      );
      setGooglePending(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={signInWithGoogle}
        disabled={googlePending || pending}
        className="h-11 w-full rounded-xl border-slate-700 bg-white text-slate-900 hover:bg-slate-100"
      >
        {googlePending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        {googlePending ? "Conectando ao Google..." : "Continuar com Google"}
      </Button>

      {googleError ? (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {googleError}
        </p>
      ) : null}

      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-slate-800" />
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          ou entre com e-mail
        </span>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <form className="space-y-4" action={action}>
        <input type="hidden" name="next" value={safeNext(next)} />

        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-200">
            E-mail
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="seu@email.com"
            required
            className="h-11 rounded-xl border-slate-700 bg-slate-950/60 text-white placeholder:text-slate-600"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-200">
            Senha
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Digite sua senha"
              required
              className="h-11 rounded-xl border-slate-700 bg-slate-950/60 pr-11 text-white placeholder:text-slate-600"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link
            href="/recuperar-senha"
            className="text-sm font-medium text-sky-300 underline-offset-4 hover:text-sky-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            Esqueci minha senha
          </Link>
        </div>

        {state.error ? (
          <p role="alert" className="text-sm text-red-300">
            {state.error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={pending || googlePending}
          className="h-11 w-full rounded-xl bg-sky-500 font-semibold text-slate-950 hover:bg-sky-400"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          {pending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
