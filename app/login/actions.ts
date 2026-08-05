"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };
const schema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
  next: z.string().optional(),
});
function safePath(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}
export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email.toLocaleLowerCase("pt-BR"),
    password: parsed.data.password,
  });
  if (error) return { error: "E-mail ou senha incorretos. Verifique os dados e tente novamente." };
  redirect(safePath(parsed.data.next));
}
export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
