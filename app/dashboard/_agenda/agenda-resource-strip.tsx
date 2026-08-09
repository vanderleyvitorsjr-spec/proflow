"use client";

import { CheckCircle2, Clock3, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AgendaTeam } from "./agenda-data";

export function AgendaResourceStrip({ teams, selected, onSelect }: { teams: AgendaTeam[]; selected: string; onSelect: (name: string) => void }) {
  if (!teams.length) return null;
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2">
        <Button type="button" size="sm" variant={selected === "ALL" ? "default" : "secondary"} onClick={() => onSelect("ALL")}><UsersRound className="h-4 w-4" />Agenda geral</Button>
        {teams.map((team) => (
          <Card key={team.id} className={selected === team.name ? "border-sky-400" : "shadow-none"}>
            <CardContent className="flex items-center gap-3 p-2.5">
              <span className={team.status === "AVAILABLE" ? "rounded-full bg-emerald-500/10 p-1.5 text-emerald-600" : "rounded-full bg-amber-500/10 p-1.5 text-amber-600"}>{team.status === "AVAILABLE" ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}</span>
              <button type="button" className="text-left" onClick={() => onSelect(team.name)}><span className="block text-sm font-medium">{team.name}</span><span className="block text-[11px] text-muted-foreground">{team.status === "AVAILABLE" ? "Disponível" : "Em atendimento"}</span></button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
