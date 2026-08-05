import "server-only";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasPermission, PERMISSIONS, type AppRole, type Permission } from "./permissions";

export type CurrentUserContext = {
  authUserId: string; internalUserId: string; companyId: string; companyName: string;
  userName: string; email: string; role: AppRole; permissions: Permission[]; deniedPermissions: Permission[]; userStatus: string;
};

export async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login?reason=session-expired");
  return data.user;
}

export async function getCurrentUserContext(): Promise<CurrentUserContext | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const user = await prisma.usuario.findUnique({
    where: { authUserId: data.user.id },
    include: { company: true, permissoes: { where: { deletedAt: null } } },
  });
  if (!user || user.deletedAt || user.status !== "ACTIVE" || !user.company.active) return null;
  const permissions: Permission[] = [];
  const deniedPermissions: Permission[] = [];
  for (const item of user.permissoes) {
    const prefix = item.module.toUpperCase();
    const candidates: Array<[boolean, string]> = [
      [item.canRead, `${prefix}_VIEW`],
      [item.canCreate, `${prefix}_CREATE`],
      [item.canUpdate, `${prefix}_UPDATE`],
      [item.canDelete, `${prefix}_DELETE`],
      [item.canExport, `${prefix}_EXPORT`],
    ];
    for (const [allowed, candidate] of candidates) {
      if (!PERMISSIONS.includes(candidate as Permission)) continue;
      (allowed ? permissions : deniedPermissions).push(candidate as Permission);
    }
  }
  return {
    authUserId: data.user.id, internalUserId: user.id, companyId: user.company.id,
    companyName: user.company.name, userName: user.name, email: user.email,
    role: user.role as AppRole, permissions, deniedPermissions, userStatus: user.status,
  };
}

export async function requireCompanyContext() {
  const context = await getCurrentUserContext();
  if (!context) redirect("/onboarding");
  return context;
}
export const requireActiveCompany = requireCompanyContext;

export async function requirePermission(permission: Permission) {
  const context = await requireCompanyContext();
  if (!hasPermission(context.role, permission, { allow: context.permissions, deny: context.deniedPermissions })) redirect("/acesso-negado");
  return context;
}

export async function requireCompanyResource<T>(
  loader: (companyId: string) => Promise<T | null>,
) {
  const context = await requireCompanyContext();
  const resource = await loader(context.companyId);
  if (!resource) throw new Error("Recurso não encontrado ou acesso não permitido.");
  return { context, resource };
}
