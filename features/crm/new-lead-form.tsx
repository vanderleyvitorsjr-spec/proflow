"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, PageHeaderActions, PageHeaderContent, PageHeaderHeading, PageHeaderIcon, PageHeaderIdentity } from "@/components/ui/page-header";
import { createCrmLeadAction } from "./crm-actions";
import { CrmLeadForm } from "./crm-lead-form";
import { DuplicateLeadError } from "./crm-repository";
import type { CrmLeadFormValues } from "./crm-schema";

export function NewLeadForm() {
  const router = useRouter(); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);
  async function submit(values: CrmLeadFormValues) { setSaving(true); setError(null); try { const lead = await createCrmLeadAction(values); router.push(`/dashboard/crm/${lead.id}`); } catch (cause) { setError(cause instanceof DuplicateLeadError ? `Já existe: ${cause.matches.map((item) => item.name).join(", ")}.` : cause instanceof Error ? cause.message : "Não foi possível salvar o lead."); } finally { setSaving(false); } }
  return <div className="space-y-3"><PageHeader><PageHeaderContent><PageHeaderIdentity><PageHeaderIcon><BarChart3 className="h-5 w-5" /></PageHeaderIcon><PageHeaderHeading title="Novo lead" description="Cadastre e qualifique uma nova oportunidade comercial." /></PageHeaderIdentity><PageHeaderActions><Button asChild variant="secondary"><Link href="/dashboard/crm"><ArrowLeft className="h-4 w-4" />Voltar</Link></Button></PageHeaderActions></PageHeaderContent></PageHeader>{error ? <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-600">{error}</div> : null}<section className="rounded-xl border bg-card p-4"><CrmLeadForm saving={saving} onSubmit={submit} /></section></div>;
}
