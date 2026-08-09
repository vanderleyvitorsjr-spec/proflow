"use client";
import { useState, useTransition } from "react";
import { Copy, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createTeamInvitationAction } from "./equipe-actions";
import { ROLE_LABELS, ROLES } from "@/lib/auth/permissions";

export function InviteTeamMember() {
  const [pending, start] = useTransition(); const [message,setMessage]=useState("");
  return <form action={(data)=>start(async()=>{const result=await createTeamInvitationAction(data); if(result.ok){const url=`${location.origin}${result.link}`; await navigator.clipboard.writeText(url); setMessage("Convite criado e link copiado.");}else setMessage(result.error);})} className="flex flex-col gap-2 sm:flex-row">
    <Input name="email" type="email" required placeholder="integrante@empresa.com.br" aria-label="E-mail do integrante" />
    <Select name="role" defaultValue="TECHNICIAN" aria-label="Função">{ROLES.filter((r)=>r!=="OWNER").map((role)=><option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</Select>
    <Button disabled={pending} type="submit"><UserPlus className="h-4 w-4" />{pending?"Gerando...":"Gerar convite"}</Button>
    {message ? <span role="status" className="self-center text-xs text-muted-foreground"><Copy className="mr-1 inline h-3 w-3" />{message}</span>:null}
  </form>;
}
