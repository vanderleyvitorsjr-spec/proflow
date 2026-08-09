"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/context";
import { ROLES, type AppRole } from "@/lib/auth/permissions";
import { normalizeEmail } from "@/lib/br-formatters";

const inviteSchema = z.object({ email: z.string().email(), role: z.enum(ROLES).refine((r) => r !== "OWNER", "Convites não podem conceder a função Proprietário.") });
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createTeamInvitationAction(formData: FormData) {
  const context = await requirePermission("TEAM_MANAGE");
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Revise o convite." };
  const email = normalizeEmail(parsed.data.email);
  const duplicate = await prisma.companyInvitation.findFirst({
    where: { companyId: context.companyId, email, status: "PENDING", expiresAt: { gt: new Date() } },
  });
  if (duplicate) return { ok: false as const, error: "Já existe um convite ativo para este e-mail." };
  const token = randomBytes(32).toString("base64url");
  const invitation = await prisma.companyInvitation.create({
    data: { companyId: context.companyId, email, role: parsed.data.role, tokenHash: hash(token), createdById: context.internalUserId, expiresAt: new Date(Date.now() + 7 * 86_400_000) },
  });
  revalidatePath("/dashboard/equipe");
  return { ok: true as const, invitationId: invitation.id, link: `/convite/${token}` };
}
export async function cancelTeamInvitationAction(id: string) {
  const context = await requirePermission("TEAM_MANAGE");
  await prisma.companyInvitation.updateMany({ where: { id, companyId: context.companyId, status: "PENDING" }, data: { status: "CANCELED", canceledAt: new Date() } });
  revalidatePath("/dashboard/equipe");
}
export async function updateTeamMemberAction(id: string, role: AppRole, active: boolean) {
  const context = await requirePermission("TEAM_MANAGE");
  if (!ROLES.includes(role)) throw new Error("Função inválida.");
  const target = await prisma.usuario.findFirst({ where: { id, companyId: context.companyId, deletedAt: null } });
  if (!target) throw new Error("Integrante não encontrado.");
  if (target.role === "OWNER" && (!active || role !== "OWNER")) {
    const owners = await prisma.usuario.count({ where: { companyId: context.companyId, role: "OWNER", status: "ACTIVE", deletedAt: null } });
    if (owners <= 1) throw new Error("O último proprietário não pode ser removido ou desativado.");
  }
  await prisma.usuario.update({ where: { id }, data: { role, status: active ? "ACTIVE" : "INACTIVE" } });
  revalidatePath("/dashboard/equipe");
}
