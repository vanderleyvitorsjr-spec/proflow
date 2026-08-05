"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bootstrapCompanyAction } from "./actions";

const fields = [
  ["companyName","Nome da Empresa","Ex.: Clima Técnica Serviços"],["tradeName","Nome Fantasia (opcional)","Ex.: Clima Técnica"],
  ["document","CPF ou CNPJ","00.000.000/0000-00"],["companyPhone","Telefone","(73) 9 8893-6763"],
  ["companyEmail","E-mail da empresa","contato@empresa.com.br"],["zipCode","CEP","45810-000"],
  ["street","Endereço","Ex.: Avenida Central"],["addressNumber","Número","Ex.: 120"],
  ["complement","Complemento (opcional)","Ex.: Sala 2"],["district","Bairro","Ex.: Centro"],
  ["city","Cidade","Ex.: Porto Seguro"],["state","Estado (UF)","BA"],
  ["ownerName","Nome completo do proprietário","Ex.: Camilla Vitor"],["ownerPhone","Telefone do proprietário","(73) 9 8893-6763"],
  ["jobTitle","Cargo (opcional)","Ex.: Proprietária"],
] as const;
export function OnboardingForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(bootstrapCompanyAction, {});
  return <Card className="mx-auto max-w-4xl p-5 sm:p-7">
    <form action={action} className="space-y-6">
      <div><h1 className="text-2xl font-bold">Configure sua empresa</h1><p className="text-sm text-muted-foreground">Esses dados criam o primeiro ambiente seguro do ProFlow. Você será o proprietário inicial.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([name,label,placeholder]) => <div key={name} className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} placeholder={placeholder} defaultValue={name === "companyEmail" ? email : undefined} required={!label.includes("opcional")} /></div>)}
      </div>
      <div className="rounded-lg bg-muted p-3 text-sm">Preferências brasileiras: moeda em real, datas em dd/MM/aaaa e documentos com máscara brasileira.</div>
      {state.error ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}
      <Button disabled={pending} type="submit">{pending ? "Criando ambiente..." : "Concluir e acessar o Dashboard"}</Button>
    </form>
  </Card>;
}
