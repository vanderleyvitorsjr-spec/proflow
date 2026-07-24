import {
  getActiveTeamAction,
  getPublicConfigurationsAction,
  getTeamMemberPublicAction,
} from "@/app/dashboard/configuracoes/configuracoes-actions";
export const listProfileTeam = async () => {
  const r = await getActiveTeamAction();
  return r.ok ? r.data : [];
};
export const getProfileCompany = async () => {
  const result = await getPublicConfigurationsAction();
  return result.ok ? result.data.company : null;
};
export const getProfileTeamMember = (id: string) => getTeamMemberPublicAction(id);
