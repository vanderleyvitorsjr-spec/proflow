import { createHash } from "crypto";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/context";
import { normalizeEmail } from "@/lib/br-formatters";
import { prisma } from "@/lib/prisma";

import { acceptInvitationAction } from "./actions";

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const auth = await requireAuthenticatedUser();
  const { token } = await params;
  const invitation = await prisma.companyInvitation.findUnique({
    where: { tokenHash: createHash("sha256").update(token).digest("hex") },
    include: { company: { select: { name: true } } },
  });

  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt <= new Date()) {
    redirect("/acesso-negado");
  }
  if (normalizeEmail(auth.email) !== invitation.email) redirect("/acesso-negado");

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl items-center px-4 py-10">
      <section className="w-full rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Convite para equipe</p>
        <h1 className="mt-2 text-2xl font-semibold">Entrar em {invitation.company.name}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Confirme para vincular sua conta a esta empresa. Nenhum dado será alterado antes da confirmação.
        </p>
        <form action={acceptInvitationAction.bind(null, token)} className="mt-6 flex gap-3">
          <button
            type="submit"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Aceitar Convite
          </button>
          <a
            href="/login"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium"
          >
            Cancelar
          </a>
        </form>
      </section>
    </main>
  );
}
