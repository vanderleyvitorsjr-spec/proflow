import { getActiveTeamAction } from "@/app/dashboard/configuracoes/configuracoes-actions";
import type { TeamMemberPublicReference } from "@/lib/contracts/configuracoes.contract";

export async function listEquipmentResponsibles(): Promise<{
  items: TeamMemberPublicReference[];
  warning?: string;
}> {
  const result = await getActiveTeamAction();
  if (!result.ok) {
    return {
      items: [],
      warning: "Não foi possível carregar a equipe. Tente novamente em instantes.",
    };
  }

  return { items: result.data };
}
