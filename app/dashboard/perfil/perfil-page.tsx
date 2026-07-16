"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Download, Shield, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  getProfileAction,
  saveProfileSectionAction,
  saveProfessionalDocumentAction,
  exportProfileAction,
  importProfileAction,
  saveProfileMediaAction,
} from "./perfil-actions";
import { listProfileTeam } from "./perfil-configuracoes-gateway";
import { loadGlobalActivities } from "@/lib/integrations/global-activity-gateway";
import { listNotificationsAction } from "@/app/dashboard/notificacoes/notificacoes-actions";
import type { ProfileState } from "./perfil-types";
import type { TeamMemberPublicReference } from "@/lib/contracts/configuracoes.contract";
import type { GlobalActivity } from "@/lib/contracts/global-activity.contract";
const tabs = [
  "Visão geral",
  "Dados pessoais",
  "Preferências",
  "Disponibilidade",
  "Notificações",
  "Documentos",
  "Atividade",
  "Produtividade",
  "Segurança",
  "Histórico",
  "Importar/exportar",
] as const;
export function PerfilPageContent() {
  const [state, setState] = useState<ProfileState | null>(null),
    [tab, setTab] = useState<(typeof tabs)[number]>("Visão geral"),
    [team, setTeam] = useState<TeamMemberPublicReference[]>([]),
    [activities, setActivities] = useState<GlobalActivity[]>([]),
    [feedback, setFeedback] = useState("");
  useEffect(
    () =>
      queueMicrotask(() => {
        setState(getProfileAction());
        void listProfileTeam().then(setTeam);
        void loadGlobalActivities().then((x) => setActivities(x.items));
      }),
    [],
  );
  if (!state) return <p>Carregando Perfil...</p>;
  const save = <K extends keyof ProfileState>(key: K, value: ProfileState[K]) => {
    setState(saveProfileSectionAction(key, value));
    setFeedback("Alterações salvas.");
  };
  return (
    <div className="space-y-3">
      <header className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-14 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {state.profile.displayName
              .split(" ")
              .map((x) => x[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <h1 className="text-xl font-bold">{state.profile.displayName}</h1>
            <p className="text-sm text-muted-foreground">
              {state.profile.role || "Usuário local"} · {state.availability.status}
            </p>
          </div>
        </div>
        {feedback && (
          <p role="status" className="mt-2 text-sm text-emerald-600">
            {feedback}
          </p>
        )}
      </header>
      <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1">
        {tabs.map((x) => (
          <Button
            key={x}
            size="sm"
            variant={tab === x ? "default" : "ghost"}
            onClick={() => setTab(x)}
          >
            {x}
          </Button>
        ))}
      </nav>
      {tab === "Visão geral" && (
        <Section title="Área pessoal">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Especialidades"
              value={String(state.profile.specialties.length)}
            />
            <Stat
              label="Documentos válidos"
              value={String(
                state.professionalDocuments.filter((x) => !x.archivedAt).length,
              )}
            />
            <Stat
              label="Notificações não lidas"
              value={String(
                listNotificationsAction().items.filter((x) => !x.readAt && !x.archivedAt)
                  .length,
              )}
            />
          </div>
        </Section>
      )}
      {tab === "Dados pessoais" && (
        <ProfileForm state={state} team={team} save={(v) => save("profile", v)} />
      )}{" "}
      {tab === "Preferências" && (
        <Preferences state={state} save={(v) => save("preferences", v)} />
      )}{" "}
      {tab === "Disponibilidade" && (
        <Availability state={state} save={(v) => save("availability", v)} />
      )}{" "}
      {tab === "Notificações" && (
        <Section title="Preferências pessoais">
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(state.notificationPreferences).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 rounded-lg border p-3">
                <input
                  type="checkbox"
                  checked={value.enabled}
                  onChange={(e) =>
                    save("notificationPreferences", {
                      ...state.notificationPreferences,
                      [key]: { ...value, enabled: e.target.checked },
                    })
                  }
                />
                {key}
              </label>
            ))}
          </div>
        </Section>
      )}{" "}
      {tab === "Documentos" && <Documents state={state} update={setState} />}{" "}
      {tab === "Atividade" && (
        <Section title="Atividade recente">
          {activities.slice(0, 20).map((x) => (
            <div key={x.id} className="border-b py-2 text-sm">
              <b>{x.title}</b>
              <p className="text-muted-foreground">
                {x.description} · {new Date(x.occurredAt).toLocaleString("pt-BR")}
              </p>
            </div>
          ))}
        </Section>
      )}{" "}
      {tab === "Segurança" && (
        <Section title="Segurança preparada">
          <Shield className="h-8 w-8" />
          <p className="mt-2 text-sm">
            Senha, 2FA, sessões e dispositivos estarão disponíveis quando a autenticação
            real for ativada.
          </p>
          <p className="text-xs text-muted-foreground">
            Nenhuma senha ou credencial é armazenada localmente.
          </p>
        </Section>
      )}{" "}
      {tab === "Histórico" && (
        <Section title="Histórico">
          {[...state.history].reverse().map((x) => (
            <p key={x.id} className="border-b py-2 text-sm">
              {x.description} · {new Date(x.occurredAt).toLocaleString("pt-BR")}
            </p>
          ))}
        </Section>
      )}{" "}
      {tab === "Importar/exportar" && (
        <Section title="Portabilidade">
          <Button
            onClick={() => {
              const blob = new Blob([exportProfileAction()], {
                  type: "application/json",
                }),
                url = URL.createObjectURL(blob),
                a = document.createElement("a");
              a.href = url;
              a.download = "proflow-perfil.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4" />
            Exportar JSON
          </Button>
          <label className="ml-2 inline-flex cursor-pointer rounded-md border px-3 py-2 text-sm">
            <Upload className="mr-2 h-4 w-4" />
            Importar
            <input
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f)
                  void f
                    .text()
                    .then((raw) => setState(importProfileAction(raw)))
                    .catch((err) =>
                      setFeedback(
                        err instanceof Error ? err.message : "Importação inválida",
                      ),
                    );
              }}
            />
          </label>
        </Section>
      )}
      {tab === "Produtividade" && (
        <Section title="Produtividade pessoal">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="OS relacionadas"
              value={String(
                activities.filter(
                  (x) =>
                    x.source === "ORDERS" &&
                    (!state.profile.teamMemberId ||
                      x.actorName === state.profile.displayName),
                ).length,
              )}
            />
            <Stat
              label="Eventos relacionados"
              value={String(
                activities.filter(
                  (x) =>
                    x.source === "AGENDA" &&
                    (!state.profile.teamMemberId ||
                      x.actorName === state.profile.displayName),
                ).length,
              )}
            />
            <Stat
              label="Atividades atribuíveis"
              value={String(
                activities.filter((x) => x.actorName === state.profile.displayName)
                  .length,
              )}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Sem autenticação real, atividades sem autoria confiável não são atribuídas ao
            usuário local.
          </p>
        </Section>
      )}
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
function ProfileForm({
  state,
  team,
  save,
}: {
  state: ProfileState;
  team: TeamMemberPublicReference[];
  save: (v: ProfileState["profile"]) => void;
}) {
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget),
      member = team.find((x) => x.id === d.get("teamMemberId"));
    save({
      ...state.profile,
      fullName: String(d.get("fullName")),
      displayName: String(d.get("displayName")),
      preferredName: String(d.get("preferredName")),
      role: String(d.get("role")),
      email: String(d.get("email")),
      phone: String(d.get("phone")),
      whatsapp: String(d.get("whatsapp")),
      bio: String(d.get("bio")),
      specialties: String(d.get("specialties"))
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      teamMemberId: member?.id,
      teamMemberSnapshot: member
        ? { id: member.id, name: member.name, role: member.role }
        : state.profile.teamMemberSnapshot,
      updatedAt: new Date().toISOString(),
    });
  }
  return (
    <Section title="Dados pessoais e profissionais">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        {[
          ["fullName", "Nome completo"],
          ["displayName", "Nome de exibição"],
          ["preferredName", "Nome preferido"],
          ["role", "Cargo"],
          ["email", "E-mail"],
          ["phone", "Telefone"],
          ["whatsapp", "WhatsApp"],
          ["specialties", "Especialidades"],
        ].map(([name, label]) => (
          <div key={name}>
            <Label>{label}</Label>
            <Input
              name={name}
              type={name === "email" ? "email" : "text"}
              defaultValue={
                name === "specialties"
                  ? state.profile.specialties.join(", ")
                  : String(state.profile[name as keyof typeof state.profile] ?? "")
              }
            />
          </div>
        ))}
        <div>
          <Label>Integrante da equipe</Label>
          <Select name="teamMemberId" defaultValue={state.profile.teamMemberId}>
            <option value="">Sem vínculo</option>
            {team.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} · {x.role}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Biografia</Label>
          <textarea
            name="bio"
            defaultValue={state.profile.bio}
            className="min-h-20 w-full rounded-md border bg-background p-2"
          />
        </div>
        <Media kind="avatarMetadata" label="Avatar" />
        <Media kind="signatureMetadata" label="Assinatura" />
        <Button className="sm:col-span-2">Salvar dados</Button>
      </form>
    </Section>
  );
}
function Media({
  kind,
  label,
}: {
  kind: "avatarMetadata" | "signatureMetadata";
  label: string;
}) {
  return (
    <label className="cursor-pointer rounded-md border p-3 text-sm">
      {label}
      <input
        className="sr-only"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void saveProfileMediaAction(kind, f);
        }}
      />
    </label>
  );
}
function Preferences({
  state,
  save,
}: {
  state: ProfileState;
  save: (v: ProfileState["preferences"]) => void;
}) {
  const p = state.preferences;
  return (
    <Section title="Preferências individuais">
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          value={p.theme}
          onChange={(e) => save({ ...p, theme: e.target.value as typeof p.theme })}
        >
          <option value="system">Sistema</option>
          <option value="light">Claro</option>
          <option value="dark">Escuro</option>
        </Select>
        <Select
          value={p.density}
          onChange={(e) => save({ ...p, density: e.target.value as typeof p.density })}
        >
          <option value="comfortable">Confortável</option>
          <option value="compact">Compacta</option>
        </Select>
        <Input
          type="number"
          value={p.tableRows}
          onChange={(e) => save({ ...p, tableRows: Number(e.target.value) })}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Origem: preferência pessoal. Ela prevalece somente para o usuário local e não
        altera Configurações da empresa.
      </p>
    </Section>
  );
}
function Availability({
  state,
  save,
}: {
  state: ProfileState;
  save: (v: ProfileState["availability"]) => void;
}) {
  const a = state.availability;
  return (
    <Section title="Disponibilidade pessoal">
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          value={a.status}
          onChange={(e) => save({ ...a, status: e.target.value as typeof a.status })}
        >
          {["AVAILABLE", "BUSY", "AWAY", "OFFLINE", "ON_LEAVE"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </Select>
        <Input
          type="time"
          value={a.startTime}
          onChange={(e) => save({ ...a, startTime: e.target.value })}
        />
        <Input
          type="time"
          value={a.endTime}
          onChange={(e) => save({ ...a, endTime: e.target.value })}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Não altera a Agenda automaticamente.
      </p>
    </Section>
  );
}
function Documents({
  state,
  update,
}: {
  state: ProfileState;
  update: (s: ProfileState) => void;
}) {
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    update(
      saveProfessionalDocumentAction({
        type: String(d.get("type")),
        title: String(d.get("title")),
        number: String(d.get("number")),
        expiresAt: String(d.get("expiresAt")) || undefined,
      }),
    );
  }
  return (
    <Section title="Documentos profissionais">
      <form onSubmit={submit} className="grid gap-2 sm:grid-cols-5">
        <Input name="type" placeholder="Tipo" required />
        <Input name="title" placeholder="Título" required />
        <Input name="number" placeholder="Número" />
        <Input name="expiresAt" type="date" />
        <Button>Adicionar</Button>
      </form>
      <div className="mt-3 space-y-2">
        {state.professionalDocuments.map((x) => (
          <div key={x.id} className="rounded-lg border p-3 text-sm">
            <b>{x.title}</b> · {x.type} ·{" "}
            {x.expiresAt
              ? new Date(`${x.expiresAt}T12:00:00`).toLocaleDateString("pt-BR")
              : "sem validade"}
          </div>
        ))}
      </div>
    </Section>
  );
}
