import { EstoquePurchaseDetail } from "./estoque-purchase-detail";
export default async function StockPurchasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EstoquePurchaseDetail purchaseId={id} />;
}
