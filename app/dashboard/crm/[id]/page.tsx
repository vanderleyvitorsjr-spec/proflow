import { CrmDetail } from "./crm-detail";
export default async function CrmDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <CrmDetail id={id} />; }
