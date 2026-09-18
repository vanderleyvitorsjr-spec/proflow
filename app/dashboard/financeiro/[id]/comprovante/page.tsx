import { FinanceiroReceipt } from "./receipt";

export default async function ComprovanteFinanceiroPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ payment?: string }> }) {
  const { id } = await params;
  const { payment } = await searchParams;
  return <FinanceiroReceipt id={id} paymentId={payment} />;
}
