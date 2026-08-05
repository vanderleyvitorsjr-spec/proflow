import { PedidoCompraDetalhe } from "../../pedido-compra-detalhe";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <PedidoCompraDetalhe orderId={id} />; }
