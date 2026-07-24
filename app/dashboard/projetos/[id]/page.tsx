import { ProjetoWorkspace } from "./projeto-workspace";

export default async function ProjetoWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjetoWorkspace id={id} />;
}
