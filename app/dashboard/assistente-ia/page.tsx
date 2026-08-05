"use client";

import Link from "next/link";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader, PageHeaderContent, PageHeaderHeading, PageHeaderIdentity, PageHeaderIcon } from "@/components/ui/page-header";
import { askOperationalAssistantAction } from "./actions";

const suggestions = [
  "O que precisa da minha atenção hoje?",
  "Existem contas vencidas?",
  "Como está o meu CRM?",
  "Há materiais com estoque baixo?",
  "Quantas Ordens estão em aberto?",
];

type Result = Awaited<ReturnType<typeof askOperationalAssistantAction>>;

export default function AssistenteIAPage() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask(value = question) {
    setBusy(true); setError("");
    try { setResult(await askOperationalAssistantAction(value)); setQuestion(value); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível analisar os dados."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-4">
    <PageHeader><PageHeaderContent><PageHeaderIdentity><PageHeaderIcon><Bot className="h-5 w-5" /></PageHeaderIcon><PageHeaderHeading title="Assistente Inteligente" description="Analisa os dados reais da sua empresa e sugere próximos passos sem executar ações sensíveis automaticamente." /></PageHeaderIdentity></PageHeaderContent></PageHeader>
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" />Pergunte sobre a operação</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex gap-2"><Input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void ask(); } }} placeholder="Ex.: O que precisa da minha atenção hoje?" aria-label="Pergunta para o Assistente Inteligente" /><Button onClick={() => void ask()} disabled={busy || question.trim().length < 3}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Analisar</Button></div>
        {error ? <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}
        {result ? <div className="rounded-xl border bg-muted/20 p-5"><p className="leading-7">{result.answer}</p><div className="mt-4 flex flex-wrap gap-2">{result.actions.map((action) => <Button key={action.href} asChild size="sm" variant="secondary"><Link href={action.href}>{action.label}</Link></Button>)}</div></div> : <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Faça uma pergunta para receber uma análise baseada nos registros atuais.</div>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Perguntas rápidas</CardTitle></CardHeader><CardContent className="space-y-2">{suggestions.map((item) => <Button key={item} variant="ghost" className="h-auto w-full justify-start whitespace-normal text-left" onClick={() => { setQuestion(item); void ask(item); }}>{item}</Button>)}</CardContent></Card>
    </div>
  </div>;
}
