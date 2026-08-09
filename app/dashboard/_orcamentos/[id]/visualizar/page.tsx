import { OrcamentoVisualizacao } from "../../orcamento-visualizacao";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; return <OrcamentoVisualizacao quoteId={id} />;
}
