import { PricingDetail } from "./precificacao-detail";
export default async function PricingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PricingDetail simulationId={id} />;
}
