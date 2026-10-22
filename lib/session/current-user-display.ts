import type { TeamMemberPublicReference } from "@/lib/contracts/configuracoes.contract";

/**
 * Identidade do usuário autenticado disponível no navegador.
 * É preenchida pelo DashboardShell a partir do contexto do servidor e serve
 * apenas para exibição e pré-preenchimento — nunca como fonte de autorização.
 */
type CurrentUserDisplay = { id: string; name: string; role: string };

let currentUser: CurrentUserDisplay | null = null;

export function setCurrentUserDisplay(value: CurrentUserDisplay) {
  // No servidor o módulo é compartilhado entre requisições: só guarda no navegador.
  if (typeof window === "undefined") return;
  currentUser = value;
}

export function getCurrentUserDisplay() {
  return currentUser;
}

const FIELD_ROLES = ["TECHNICIAN", "ASSISTANT", "ELECTRICIAN", "SUPERVISOR"];

/**
 * Monta a lista de responsáveis para OS e Agenda.
 *
 * 1. Integrantes de campo (técnicos, eletricistas etc.).
 * 2. Se não houver, qualquer integrante ativo cadastrado.
 * 3. Se a empresa não tiver equipe cadastrada (profissional autônomo),
 *    o próprio usuário logado aparece como responsável.
 */
export function responsibleOptions(
  team: TeamMemberPublicReference[],
): TeamMemberPublicReference[] {
  const field = team.filter(
    (item) => FIELD_ROLES.includes(item.role) || item.specialties.length > 0,
  );
  if (field.length) return withCurrentUser(field);
  if (team.length) return withCurrentUser(team);
  return currentUser ? [toTeamMember(currentUser)] : [];
}

function withCurrentUser(list: TeamMemberPublicReference[]) {
  if (!currentUser) return list;
  const name = currentUser.name.trim().toLocaleLowerCase("pt-BR");
  const alreadyListed = list.some(
    (item) => item.name.trim().toLocaleLowerCase("pt-BR") === name,
  );
  return alreadyListed ? list : [...list, toTeamMember(currentUser)];
}

function toTeamMember(user: CurrentUserDisplay): TeamMemberPublicReference {
  return {
    id: `usuario-${user.id}`,
    name: user.name,
    role: user.role,
    specialties: [],
    hourlyCostCents: 0,
    burdenRateBasisPoints: 0,
    availability: "",
    active: true,
    archived: false,
    updatedAt: new Date(0).toISOString(),
  };
}
