import { PerfilPageContent } from "./perfil-page";
import { requireCompanyContext } from "@/lib/auth/context";
import { ROLE_LABELS } from "@/lib/auth/permissions";

export default async function Page() {
  const context = await requireCompanyContext();
  return (
    <PerfilPageContent
      authContext={{
        userName: context.userName,
        email: context.email,
        roleLabel: ROLE_LABELS[context.role],
        companyName: context.companyName,
      }}
    />
  );
}
