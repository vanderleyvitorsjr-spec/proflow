import {
  getActiveTeamAction,
  getTeamMemberPublicAction,
} from "@/app/dashboard/configuracoes/configuracoes-actions";
export const listProfileTeam = async () => {
  const r = await getActiveTeamAction();
  return r.ok ? r.data : [];
};
export const getProfileTeamMember = (id: string) => getTeamMemberPublicAction(id);
