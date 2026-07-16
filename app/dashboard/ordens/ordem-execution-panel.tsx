"use client";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CirclePause,
  Clock3,
  Play,
  RotateCcw,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDateTimeBR } from "@/lib/br-formatters";
import type { OrdemRecord, OrdemWorkNote } from "./ordens-types";

export function OrdemExecutionPanel({
  order,
  saving,
  onStart,
  onPause,
  onResume,
  onComplete,
  onAddNote,
  onUpdateTeam,
}: {
  order: OrdemRecord;
  saving: boolean;
  onStart: () => Promise<void>;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  onComplete: () => Promise<void>;
  onAddNote: (visibility: OrdemWorkNote["visibility"], text: string) => Promise<void>;
  onUpdateTeam: (members: string[]) => Promise<void>;
}) {
  const execution = order.execution ?? {
    status: "NOT_STARTED" as const,
    accumulatedMinutes: 0,
    sessions: [],
    workNotes: [],
  };
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState<OrdemWorkNote["visibility"]>("INTERNAL");
  const [now, setNow] = useState(() => Date.now());
  const [teamText, setTeamText] = useState(
    (order.teamMembers ?? [order.technician]).join(", "),
  );
  useEffect(() => {
    if (execution.status !== "IN_PROGRESS") return;
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [execution.status]);
  const completed = order.checklist.filter((item) => item.completedAt).length;
  const progress = useMemo(
    () =>
      order.checklist.length ? Math.round((completed / order.checklist.length) * 100) : 0,
    [completed, order.checklist.length],
  );
  const elapsed =
    execution.accumulatedMinutes +
    (execution.status === "IN_PROGRESS" && execution.sessions.at(-1)?.startedAt
      ? Math.max(
          0,
          Math.floor(
            (now - new Date(execution.sessions.at(-1)!.startedAt).getTime()) / 60000,
          ),
        )
      : 0);
  async function addNote() {
    if (!note.trim()) return;
    await onAddNote(visibility, note.trim());
    setNote("");
  }
  return (
    <div className="grid gap-3 xl:grid-cols-[1.1fr_.9fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-4 w-4" />
            Execução do serviço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric
              label="Status"
              value={
                {
                  NOT_STARTED: "Não iniciada",
                  IN_PROGRESS: "Em execução",
                  PAUSED: "Pausada",
                  COMPLETED: "Concluída",
                }[execution.status]
              }
            />
            <Metric label="Tempo registrado" value={`${elapsed} min`} />
            <Metric label="Checklist" value={`${progress}%`} />
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-sky-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {execution.status === "NOT_STARTED" && (
              <Button onClick={() => void onStart()} disabled={saving}>
                <Play className="h-4 w-4" />
                Iniciar
              </Button>
            )}
            {execution.status === "IN_PROGRESS" && (
              <Button
                variant="secondary"
                onClick={() => void onPause()}
                disabled={saving}
              >
                <CirclePause className="h-4 w-4" />
                Pausar
              </Button>
            )}
            {execution.status === "PAUSED" && (
              <Button onClick={() => void onResume()} disabled={saving}>
                <RotateCcw className="h-4 w-4" />
                Retomar
              </Button>
            )}
            {execution.status !== "COMPLETED" && execution.status !== "NOT_STARTED" && (
              <Button
                variant="secondary"
                onClick={() => void onComplete()}
                disabled={saving}
              >
                <CheckCircle2 className="h-4 w-4" />
                Concluir execução
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Sessões registradas
            </p>
            {execution.sessions.length ? (
              execution.sessions
                .slice()
                .reverse()
                .map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                  >
                    <span>{session.technician}</span>
                    <span className="text-muted-foreground">
                      {formatDateTimeBR(session.startedAt)}
                      {session.endedAt
                        ? ` · ${session.durationMinutes ?? 0} min`
                        : " · em andamento"}
                    </span>
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma sessão iniciada.</p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersRound className="h-4 w-4" />
            Equipe e apontamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              className="text-xs font-semibold text-muted-foreground"
              htmlFor="os-team"
            >
              Equipe participante
            </label>
            <div className="mt-1 flex gap-2">
              <Input
                id="os-team"
                value={teamText}
                onChange={(e) => setTeamText(e.target.value)}
                placeholder="Nomes separados por vírgula"
              />
              <Button
                variant="secondary"
                onClick={() =>
                  void onUpdateTeam(
                    teamText
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  )
                }
                disabled={saving}
              >
                Salvar
              </Button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-[9rem_1fr_auto]">
            <Select
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as OrdemWorkNote["visibility"])
              }
            >
              <option value="INTERNAL">Nota interna</option>
              <option value="CLIENT">Nota para cliente</option>
            </Select>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Registrar ocorrência, orientação ou observação"
            />
            <Button onClick={() => void addNote()} disabled={saving || !note.trim()}>
              Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {execution.workNotes.length ? (
              execution.workNotes
                .slice()
                .reverse()
                .map((item) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase text-muted-foreground">
                        {item.visibility === "INTERNAL" ? "Interna" : "Cliente"}
                      </span>
                      <time className="text-[11px] text-muted-foreground">
                        {formatDateTimeBR(item.createdAt)}
                      </time>
                    </div>
                    <p className="mt-1 text-sm">{item.text}</p>
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum apontamento registrado.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}
