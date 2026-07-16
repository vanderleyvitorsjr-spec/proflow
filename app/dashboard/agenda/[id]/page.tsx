import { AgendaDetail } from "./agenda-detail";
export default async function AgendaDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AgendaDetail id={id} />; }
