import { CotacaoEditor } from "../../cotacao-editor";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <CotacaoEditor quotationId={id} />; }
