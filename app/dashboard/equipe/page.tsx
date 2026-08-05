import { Users } from "lucide-react";
import { requirePermission } from "@/lib/auth/context";
import { ROLE_LABELS, type AppRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatDateBR, formatBrazilianPhone, normalizeProperName } from "@/lib/br-formatters";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, PageHeaderActions, PageHeaderContent, PageHeaderHeading, PageHeaderIdentity } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableFrame, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InviteTeamMember } from "./equipe-page-client";

export default async function TeamPage() {
  const context = await requirePermission("TEAM_VIEW");
  const members = await prisma.usuario.findMany({ where: { companyId: context.companyId, deletedAt: null }, orderBy: { name: "asc" } });
  return <div className="space-y-4">
    <PageHeader><PageHeaderContent><PageHeaderIdentity><PageHeaderHeading title="Equipe" description="Gerencie quem pode acessar a empresa e quais responsabilidades cada integrante possui." /></PageHeaderIdentity>{context.role === "OWNER" || context.role === "ADMIN" ? <PageHeaderActions><InviteTeamMember /></PageHeaderActions> : null}</PageHeaderContent></PageHeader>
    {members.length ? <TableFrame><Table framed={false}><TableHeader><TableRow><TableHead>Integrante</TableHead><TableHead>Contato</TableHead><TableHead>Função</TableHead><TableHead>Status</TableHead><TableHead>Entrada</TableHead><TableHead>Último acesso</TableHead></TableRow></TableHeader><TableBody>{members.map((member) => <TableRow key={member.id}><TableCell className="font-medium">{normalizeProperName(member.name)}</TableCell><TableCell><div>{member.email}</div><div className="text-xs text-muted-foreground">{formatBrazilianPhone(member.phone)}</div></TableCell><TableCell>{ROLE_LABELS[member.role as AppRole] ?? member.role}</TableCell><TableCell>{member.status === "ACTIVE" ? "Ativo" : member.status === "INVITED" ? "Convidado" : "Inativo"}</TableCell><TableCell>{formatDateBR(member.createdAt.toISOString())}</TableCell><TableCell>{formatDateBR(member.lastLoginAt?.toISOString())}</TableCell></TableRow>)}</TableBody></Table></TableFrame> : <EmptyState icon={<Users className="h-5 w-5" />} title="Nenhum integrante encontrado" description="Gere um convite para adicionar a primeira pessoa à equipe." />}
  </div>;
}
