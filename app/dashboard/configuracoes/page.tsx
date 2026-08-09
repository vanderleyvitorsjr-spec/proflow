import { ConfigurationCenter } from "./configuracoes-navigation";
import { requireCompanyContext } from "@/lib/auth/context";

export default async function ConfiguracoesPage() {
  const context = await requireCompanyContext();
  return <ConfigurationCenter authenticatedCompanyName={context.companyName} />;
}
