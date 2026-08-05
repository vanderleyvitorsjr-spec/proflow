"use server";

import { createHash } from "crypto";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/context";
import { normalizeEmail, normalizeProperName } from "@/lib/br-formatters";
import { prisma } from "@/lib/prisma";

export async function acceptInvitationAction(token: string) {
  const auth = await requireAuthenticatedUser();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const invitation = await tx.companyInvitation.findUnique({ where: { tokenHash } });

    if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt <= now) {
      throw new Error("Este convite não está mais disponível.");
    }
    if (normalizeEmail(auth.email) !== invitation.email) {
      throw new Error("Este convite foi emitido para outro endereço de e-mail.");
    }

    const existingUser = await tx.usuario.findUnique({ where: { authUserId: auth.id } });
    if (existingUser) {
      if (existingUser.companyId === invitation.companyId) {
        await tx.companyInvitation.updateMany({
          where: { id: invitation.id, status: "PENDING" },
          data: { status: "ACCEPTED", acceptedAt: now },
        });
        return;
      }
      throw new Error("Este usuário já está vinculado a outra empresa.");
    }

    await tx.usuario.create({
      data: {
        companyId: invitation.companyId,
        authUserId: auth.id,
        name: normalizeProperName(
          String(auth.user_metadata?.full_name ?? auth.email?.split("@")[0] ?? "Integrante"),
        ),
        email: invitation.email,
        role: invitation.role,
        status: "ACTIVE",
        lastLoginAt: now,
      },
    });

    const accepted = await tx.companyInvitation.updateMany({
      where: { id: invitation.id, status: "PENDING" },
      data: { status: "ACCEPTED", acceptedAt: now },
    });
    if (accepted.count !== 1) throw new Error("O convite já foi utilizado.");
  });

  redirect("/dashboard");
}
