import { FinanceiroReceipt } from "./receipt";

export default async function ComprovanteFinanceiroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FinanceiroReceipt id={id} />;
}
