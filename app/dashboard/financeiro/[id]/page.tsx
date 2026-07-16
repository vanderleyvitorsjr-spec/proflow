import { FinanceiroDetail } from "./financeiro-detail";
export default async function FinanceiroDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FinanceiroDetail id={id} />;
}
