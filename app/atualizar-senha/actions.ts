"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PasswordUpdateState = { error?: string };

const updateSchema = z
  .object({
    password: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres."),
    confirmation: z.string(),
  })
  .refine((value) => value.password === value.confirmation, {
    path: ["confirmation"],
    message: "A confirmação deve ser igual à nova senha.",
  });

export async function updatePasswordAction(
  _: PasswordUpdateState,
  formData: FormData,
): Promise<PasswordUpdateState> {
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return {
      error:
        "O link expirou ou a sessão de recuperação não está disponível. Solicite um novo link.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      error:
        "Não foi possível atualizar a senha. Solicite um novo link e tente novamente.",
    };
  }

  await supabase.auth.signOut();
  redirect("/login?success=password-updated");
}
