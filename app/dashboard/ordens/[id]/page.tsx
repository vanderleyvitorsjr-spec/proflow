import { OrdemDetail } from "../../_ordens/[id]/ordem-detail";

export default async function OrdemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrdemDetail id={id} />;
}
