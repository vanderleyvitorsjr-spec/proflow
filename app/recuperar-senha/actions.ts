"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PasswordRecoveryState = {
  error?: string;
  success?: string;
};

const recoverySchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
});

function getOrigin(headerList: Headers) {
  const forwardedHost = headerList.get("x-forwarded-host");
  const host = forwardedHost ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Não foi possível identificar o endereço do ProFlow.");
  }

  return `${protocol}://${host}`;
}

export async function requestPasswordResetAction(
  _: PasswordRecoveryState,
  formData: FormData,
): Promise<PasswordRecoveryState> {
  const parsed = recoverySchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  try {
    const headerList = await headers();
    const origin = getOrigin(headerList);
    const callback = new URL("/auth/callback", origin);
    callback.searchParams.set("next", "/atualizar-senha");

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email.toLocaleLowerCase("pt-BR"),
      { redirectTo: callback.toString() },
    );

    if (error) {
      return {
        error:
          "Não foi possível enviar o link agora. Verifique o e-mail e tente novamente.",
      };
    }

    return {
      success:
        "Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.",
    };
  } catch {
    return {
      error:
        "Não foi possível solicitar a recuperação de senha. Tente novamente.",
    };
  }
}
