import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
export default function AccessDeniedPage() {
  return <main className="grid min-h-screen place-items-center bg-background p-4"><Card className="max-w-md space-y-4 p-7 text-center"><ShieldAlert className="mx-auto h-10 w-10 text-amber-500" /><h1 className="text-2xl font-bold">Acesso não permitido</h1><p className="text-muted-foreground">Seu perfil não possui permissão para acessar esta área. Fale com o proprietário ou administrador da empresa.</p><Button asChild><Link href="/dashboard">Voltar ao Dashboard</Link></Button></Card></main>;
}
