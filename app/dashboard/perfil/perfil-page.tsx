"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileBadge,
  FileText,
  History,
  IdCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Shield,
  SlidersHorizontal,
  Upload,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIcon,
  PageHeaderIdentity,
} from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import {
  formatBrazilianPhone,
  formatCep,
  formatCpf,
  formatDateBR,
  formatDateTimeBR,
  maskCpf,
  normalizeProperName,
  normalizeUpperCode,
} from "@/lib/br-formatters";
import { cn } from "@/lib/utils";
import {
  exportProfileAction,
  getProfileAction,
  importProfileAction,
  openProfileMediaAction,
  saveProfessionalDocumentAction,
  saveProfileMediaAction,
  saveProfileSectionAction,
} from "./perfil-actions";
import { listProfileTeam } from "./perfil-configuracoes-gateway";
import { loadGlobalActivities } from "@/lib/integrations/global-activity-gateway";
import { listNotificationsAction } from "@/app/dashboard/notificacoes/notificacoes-actions";
import type { ProfileState } from "./perfil-types";
import type { TeamMemberPublicReference } from "@/lib/contracts/configuracoes.contract";
import type { GlobalActivity } from "@/lib/contracts/global-activity.contract";
import type { NotificationItem } from "@/app/dashboard/notificacoes/notificacoes-types";

const tabs = [
  ["Visão geral", UserRound],
  ["Dados pessoais", IdCard],
  ["Preferências", SlidersHorizontal],
  ["Disponibilidade", CalendarDays],
  ["Notificações", Bell],
  ["Documentos", FileBadge],
  ["Atividade", Activity],
  ["Produtividade", BriefcaseBusiness],
  ["Segurança", Shield],
  ["Histórico", History],
  ["Importar/exportar", Download],
] as const;

type TabName = (typeof tabs)[number][0];

const availabilityLabels: Record<ProfileState["availability"]["status"], string> = {
  AVAILABLE: "Disponível",
  BUSY: "Ocupado",
  AWAY: "Ausente",
  OFFLINE: "Offline",
  ON_LEAVE: "Em férias",
};

export function PerfilPageContent() {
  const [state, setState] = useState<ProfileState | null>(null);
  const [tab, setTab] = useState<TabName>("Visão geral");
  const [team, setTeam] = useState<TeamMemberPublicReference[]>([]);
  const [activities, setActivities] = useState<GlobalActivity[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [referenceNow] = useState(() => Date.now());

  useEffect(() => {
    queueMicrotask(() => {
      const profileState = getProfileAction();
      setState(profileState);
      setNotifications(listNotificationsAction().items);
      void listProfileTeam().then(setTeam);
      void loadGlobalActivities().then((result) => setActivities(result.items));
    });
  }, []);

  useEffect(() => {
    let active = true;
    let currentUrl: string | null = null;
    const blobId = state?.profile.avatarMetadata?.blobId;
    if (!blobId) {
      queueMicrotask(() => setAvatarUrl(null));
      return;
    }
    void openProfileMediaAction(blobId).then((url) => {
      if (!active) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      currentUrl = url;
      setAvatarUrl(url);
    });
    return () => {
      active = false;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [state?.profile.avatarMetadata?.blobId]);

  if (!state) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-xl border bg-card" />
        <div className="h-11 animate-pulse rounded-xl border bg-card" />
        <div className="grid gap-3 lg:grid-cols-[17rem_1fr]">
          <div className="h-[34rem] animate-pulse rounded-xl border bg-card" />
          <div className="h-[34rem] animate-pulse rounded-xl border bg-card" />
        </div>
      </div>
    );
  }

  const save = <K extends keyof ProfileState>(key: K, value: ProfileState[K]) => {
    try {
      const next = saveProfileSectionAction(key, value);
      setState(next);
      setFeedback("Alterações salvas com sucesso.");
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar.");
      setFeedback("");
    }
  };

  const unread = notifications.filter((item) => !item.readAt && !item.archivedAt);

  return (
    <div className="space-y-3">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <PageHeaderIcon><UserRound className="h-4 w-4" /></PageHeaderIcon>
            <PageHeaderHeading
              title="Perfil"
              description="Gerencie suas informações pessoais, preferências e produtividade."
            />
          </PageHeaderIdentity>
          <PageHeaderActions>
            <Button size="sm" onClick={() => setTab("Dados pessoais")}>
              <Pencil className="h-4 w-4" /> Editar perfil
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>

      {(feedback || error) && (
        <div
          role={error ? "alert" : "status"}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            error ? "border-rose-500/30 bg-rose-500/5 text-rose-600" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-600",
          )}
        >
          {error || feedback}
        </div>
      )}

      <nav aria-label="Seções do perfil" className="rounded-xl border bg-card p-1.5 shadow-xs">
        <div className="flex gap-1 overflow-x-auto lg:flex-wrap lg:overflow-visible">
          {tabs.map(([name, Icon]) => (
            <Button
              key={name}
              size="sm"
              variant={tab === name ? "default" : "ghost"}
              className="shrink-0"
              aria-current={tab === name ? "page" : undefined}
              onClick={() => setTab(name)}
            >
              <Icon className="h-4 w-4" /> {name}
            </Button>
          ))}
        </div>
      </nav>

      {tab === "Visão geral" && (
        <Overview
          state={state}
          activities={activities}
          notifications={unread}
          avatarUrl={avatarUrl}
          onEdit={() => setTab("Dados pessoais")}
          onOpenTab={setTab}
          savePreferences={(value) => save("preferences", value)}
          referenceNow={referenceNow}
        />
      )}
      {tab === "Dados pessoais" && (
        <ProfileForm
          state={state}
          team={team}
          avatarUrl={avatarUrl}
          save={(value) => save("profile", value)}
          update={setState}
          onFeedback={setFeedback}
          onError={setError}
        />
      )}
      {tab === "Preferências" && <Preferences state={state} save={(value) => save("preferences", value)} />}
      {tab === "Disponibilidade" && <Availability state={state} save={(value) => save("availability", value)} />}
      {tab === "Notificações" && <NotificationPreferences state={state} save={(value) => save("notificationPreferences", value)} />}
      {tab === "Documentos" && <Documents state={state} update={setState} onError={setError} />}
      {tab === "Atividade" && <ActivityList activities={activities} />}
      {tab === "Produtividade" && <Productivity state={state} activities={activities} />}
      {tab === "Segurança" && <Security />}
      {tab === "Histórico" && <HistoryList state={state} />}
      {tab === "Importar/exportar" && <ImportExport update={setState} onFeedback={setFeedback} onError={setError} />}
    </div>
  );
}

function Overview({
  state,
  activities,
  notifications,
  avatarUrl,
  onEdit,
  onOpenTab,
  savePreferences,
  referenceNow,
}: {
  state: ProfileState;
  activities: GlobalActivity[];
  notifications: NotificationItem[];
  avatarUrl: string | null;
  onEdit: () => void;
  onOpenTab: (tab: TabName) => void;
  savePreferences: (value: ProfileState["preferences"]) => void;
  referenceNow: number;
}) {
  const profile = state.profile;
  const agendaItems = activities.filter((item) => item.source === "AGENDA").slice(0, 3);
  const recentActivities = activities
    .filter((item) => !profile.teamMemberId || !item.actorName || normalizeProperName(item.actorName) === profile.displayName)
    .slice(0, 4);
  const validDocuments = state.professionalDocuments.filter((item) => !item.archivedAt && (!item.expiresAt || item.expiresAt >= new Date().toISOString().slice(0, 10)));
  const expiringDocuments = validDocuments.filter((item) => {
    if (!item.expiresAt) return false;
    const diff = new Date(`${item.expiresAt}T12:00:00`).getTime() - referenceNow;
    return diff >= 0 && diff <= 30 * 86_400_000;
  });
  const orderActivities = activities.filter((item) => item.source === "ORDERS");
  const completedOrders = orderActivities.filter((item) => /conclu/i.test(`${item.type} ${item.title}`));

  return (
    <div className="grid gap-3 xl:grid-cols-[17rem_minmax(0,1fr)]">
      <Card className="self-start xl:sticky xl:top-3">
        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center">
            <Avatar profileName={profile.displayName || profile.fullName} avatarUrl={avatarUrl} size="large" />
            <h2 className="mt-3 text-xl font-semibold">{profile.displayName || "Usuário local"}</h2>
            <p className="text-sm text-muted-foreground">{profile.role || "Cargo não informado"}</p>
            <Badge className="mt-2" variant="outline">{availabilityLabels[state.availability.status]}</Badge>
          </div>

          <div className="mt-4 space-y-2 border-t pt-4 text-sm">
            <ProfileLine icon={Phone} value={formatBrazilianPhone(profile.phone) || "Telefone não informado"} />
            <ProfileLine icon={Mail} value={profile.email || "E-mail não informado"} />
            <ProfileLine icon={IdCard} value={profile.document ? maskCpf(profile.document) : "CPF não informado"} />
            <ProfileLine icon={FileBadge} value={profile.professionalRegistration || "Registro não informado"} />
            <ProfileLine icon={MapPin} value={[profile.city, profile.state].filter(Boolean).join(" - ") || "Localização não informada"} />
            <ProfileLine icon={CalendarDays} value={`No ProFlow desde ${formatDateBR(profile.createdAt)}`} />
          </div>

          {profile.teamMemberSnapshot && (
            <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-left">
              <p className="text-xs font-medium text-muted-foreground">Vinculado à equipe</p>
              <p className="mt-1 text-sm font-semibold">{normalizeProperName(profile.teamMemberSnapshot.name)}</p>
              <p className="text-xs text-muted-foreground">{normalizeProperName(profile.teamMemberSnapshot.role)}</p>
            </div>
          )}

          <Button variant="outline" className="mt-4 w-full" onClick={onEdit}>
            <Pencil className="h-4 w-4" /> Editar dados
          </Button>
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-3">
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle>Informações profissionais</CardTitle></CardHeader>
          <CardContent className="grid gap-3 p-4 pt-2 md:grid-cols-3">
            <InfoBlock label="Cargo / função" value={profile.role || "Não informado"} />
            <div className="rounded-lg border p-3 md:col-span-2">
              <p className="text-xs text-muted-foreground">Especialidades</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.specialties.length ? profile.specialties.map((item) => <Badge key={item} variant="secondary">{item}</Badge>) : <button className="text-sm text-primary" onClick={onEdit}>Adicionar especialidades</button>}
              </div>
            </div>
            <div className="rounded-lg border p-3 md:col-span-3">
              <p className="text-xs text-muted-foreground">Bio / apresentação</p>
              <p className="mt-1 text-sm leading-6">{profile.bio || <button className="text-primary" onClick={onEdit}>Adicionar uma apresentação profissional</button>}</p>
            </div>
            <InfoBlock label="Vínculo profissional" value={profile.teamMemberSnapshot?.name || "Sem vínculo com a equipe"} />
            <InfoBlock label="Registro profissional" value={profile.professionalRegistration || "Não informado"} />
            <InfoBlock label="Atualizado em" value={formatDateBR(profile.updatedAt)} />
          </CardContent>
        </Card>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle>Documentos e credenciais</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => onOpenTab("Documentos")}>Ver todos <ChevronRight className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-2">
              {validDocuments.slice(0, 3).map((document) => (
                <div key={document.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{document.title}</p>
                    <p className="text-xs text-muted-foreground">{document.expiresAt ? `Validade: ${formatDateBR(document.expiresAt)}` : "Sem validade"}</p>
                  </div>
                  <Badge variant={document.expiresAt && document.expiresAt < new Date().toISOString().slice(0, 10) ? "destructive" : "outline"}>{document.type}</Badge>
                </div>
              ))}
              {!validDocuments.length && <CompactEmpty title="Nenhum documento válido" action="Adicionar documento" onClick={() => onOpenTab("Documentos")} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle>Compromissos e agenda</CardTitle>
              <Link href="/dashboard/agenda" className="text-xs font-medium text-primary">Abrir agenda</Link>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-2">
              {agendaItems.map((item) => <ActivityRow key={item.id} item={item} />)}
              {!agendaItems.length && <CompactEmpty title="Nenhum compromisso relacionado" action="Abrir agenda" href="/dashboard/agenda" />}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle>Atividade recente</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => onOpenTab("Atividade")}>Ver todas <ChevronRight className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-2">
              {recentActivities.map((item) => <ActivityRow key={item.id} item={item} />)}
              {!recentActivities.length && <CompactEmpty title="Nenhuma atividade atribuível ao perfil" />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle>Resumo pessoal</CardTitle></CardHeader>
            <CardContent className="grid gap-2 p-4 pt-2 sm:grid-cols-2 lg:grid-cols-1">
              <MetricLine icon={BriefcaseBusiness} label="OS relacionadas" value={String(orderActivities.length)} />
              <MetricLine icon={CheckCircle2} label="OS concluídas" value={String(completedOrders.length)} />
              <MetricLine icon={CalendarDays} label="Eventos relacionados" value={String(agendaItems.length)} />
              <MetricLine icon={FileBadge} label="Documentos válidos" value={String(validDocuments.length)} />
              <MetricLine icon={Clock3} label="Documentos vencendo" value={String(expiringDocuments.length)} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle>Preferências rápidas</CardTitle></CardHeader>
            <CardContent className="grid gap-2 p-4 pt-2 sm:grid-cols-2 xl:grid-cols-4">
              <QuickPreference label="Tema" value={state.preferences.theme === "dark" ? "Escuro" : state.preferences.theme === "light" ? "Claro" : "Sistema"} onClick={() => savePreferences({ ...state.preferences, theme: state.preferences.theme === "dark" ? "light" : "dark" })} />
              <QuickPreference label="Densidade" value={state.preferences.density === "compact" ? "Compacta" : "Confortável"} onClick={() => savePreferences({ ...state.preferences, density: state.preferences.density === "compact" ? "comfortable" : "compact" })} />
              <QuickPreference label="Página inicial" value={state.preferences.homePage === "/dashboard" ? "Dashboard" : state.preferences.homePage} onClick={() => onOpenTab("Preferências")} />
              <QuickPreference label="Linhas por tabela" value={`${state.preferences.tableRows} linhas`} onClick={() => onOpenTab("Preferências")} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle>Notificações não lidas</CardTitle>
              <Link href="/dashboard/notificacoes" className="text-xs font-medium text-primary">Ver todas</Link>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 p-4 pt-2">
              {(["CRITICAL", "HIGH", "NORMAL", "LOW"] as const).map((priority) => (
                <div key={priority} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{priority === "CRITICAL" ? "Críticas" : priority === "HIGH" ? "Altas" : priority === "NORMAL" ? "Normais" : "Baixas"}</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">{notifications.filter((item) => item.priority === priority).length}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProfileForm({
  state,
  team,
  avatarUrl,
  save,
  update,
  onFeedback,
  onError,
}: {
  state: ProfileState;
  team: TeamMemberPublicReference[];
  avatarUrl: string | null;
  save: (value: ProfileState["profile"]) => void;
  update: (state: ProfileState) => void;
  onFeedback: (message: string) => void;
  onError: (message: string) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const member = team.find((item) => item.id === data.get("teamMemberId"));
    save({
      ...state.profile,
      fullName: String(data.get("fullName")),
      displayName: String(data.get("displayName")),
      preferredName: String(data.get("preferredName")),
      role: String(data.get("role")),
      email: String(data.get("email")).trim().toLocaleLowerCase("pt-BR"),
      phone: String(data.get("phone")),
      whatsapp: String(data.get("whatsapp")),
      document: String(data.get("document")),
      birthDate: String(data.get("birthDate")) || undefined,
      zipCode: String(data.get("zipCode")),
      street: String(data.get("street")),
      streetNumber: String(data.get("streetNumber")),
      complement: String(data.get("complement")),
      district: String(data.get("district")),
      city: String(data.get("city")),
      state: String(data.get("state")),
      professionalRegistration: String(data.get("professionalRegistration")),
      bio: String(data.get("bio")),
      specialties: String(data.get("specialties")).split(",").map(normalizeProperName).filter(Boolean),
      teamMemberId: member?.id,
      teamMemberSnapshot: member ? { id: member.id, name: normalizeProperName(member.name), role: normalizeProperName(member.role) } : undefined,
      updatedAt: new Date().toISOString(),
    });
  }

  async function saveMedia(kind: "avatarMetadata" | "signatureMetadata", file: File) {
    try {
      const next = await saveProfileMediaAction(kind, file);
      update(next);
      onFeedback(kind === "avatarMetadata" ? "Avatar atualizado." : "Assinatura atualizada.");
      onError("");
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Não foi possível salvar a imagem.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Section title="Identificação" description="Dados pessoais e apresentação profissional.">
        <div className="mb-4 flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center">
          <Avatar profileName={state.profile.displayName || state.profile.fullName} avatarUrl={avatarUrl} size="medium" />
          <div className="flex-1">
            <p className="text-sm font-medium">Foto do perfil</p>
            <p className="text-xs text-muted-foreground">PNG, JPEG ou WEBP de até 5 MB.</p>
          </div>
          <MediaButton label="Alterar avatar" kind="avatarMetadata" onSelect={saveMedia} icon={Camera} />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <TextField name="fullName" label="Nome completo" defaultValue={state.profile.fullName} required properName />
          <TextField name="displayName" label="Nome de exibição" defaultValue={state.profile.displayName} required properName />
          <TextField name="preferredName" label="Nome preferido" defaultValue={state.profile.preferredName} properName />
          <TextField name="document" label="CPF" defaultValue={formatCpf(state.profile.document)} mask="cpf" inputMode="numeric" />
          <TextField name="birthDate" label="Data de nascimento" defaultValue={state.profile.birthDate} type="date" />
          <TextField name="role" label="Cargo / função" defaultValue={state.profile.role} properName />
          <div className="md:col-span-2 xl:col-span-3">
            <Label htmlFor="profile-specialties">Especialidades</Label>
            <Input id="profile-specialties" name="specialties" defaultValue={state.profile.specialties.join(", ")} placeholder="Climatização, Elétrica, Manutenção Predial" />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <Label htmlFor="profile-bio">Bio / apresentação</Label>
            <textarea id="profile-bio" name="bio" defaultValue={state.profile.bio} className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Conte brevemente sua experiência e área de atuação." />
          </div>
        </div>
      </Section>

      <Section title="Contato" description="Canais pessoais usados no sistema.">
        <div className="grid gap-3 md:grid-cols-3">
          <TextField name="phone" label="Telefone" defaultValue={formatBrazilianPhone(state.profile.phone)} mask="phone" inputMode="numeric" placeholder="(00) 0000-0000" />
          <TextField name="whatsapp" label="WhatsApp" defaultValue={formatBrazilianPhone(state.profile.whatsapp)} mask="phone" inputMode="numeric" placeholder="(00) 0 0000-0000" />
          <TextField name="email" label="E-mail" defaultValue={state.profile.email} type="email" />
        </div>
      </Section>

      <Section title="Endereço" description="Localização pessoal ou profissional do usuário.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TextField name="zipCode" label="CEP" defaultValue={formatCep(state.profile.zipCode)} mask="cep" inputMode="numeric" />
          <div className="md:col-span-2 xl:col-span-2"><TextField name="street" label="Logradouro" defaultValue={state.profile.street} properName /></div>
          <TextField name="streetNumber" label="Número" defaultValue={state.profile.streetNumber} />
          <TextField name="complement" label="Complemento" defaultValue={state.profile.complement} />
          <TextField name="district" label="Bairro" defaultValue={state.profile.district} properName />
          <TextField name="city" label="Cidade" defaultValue={state.profile.city} properName />
          <TextField name="state" label="UF" defaultValue={state.profile.state} maxLength={2} upper />
        </div>
      </Section>

      <Section title="Dados profissionais" description="Registro e vínculo com a equipe cadastrada em Configurações.">
        <div className="grid gap-3 md:grid-cols-2">
          <TextField name="professionalRegistration" label="Registro profissional" defaultValue={state.profile.professionalRegistration} upper placeholder="CREA/SP 5069876543" />
          <div>
            <Label htmlFor="profile-team">Integrante da equipe</Label>
            <Select id="profile-team" name="teamMemberId" defaultValue={state.profile.teamMemberId}>
              <option value="">Sem vínculo</option>
              {team.map((member) => <option key={member.id} value={member.id}>{normalizeProperName(member.name)} · {normalizeProperName(member.role)}</option>)}
            </Select>
          </div>
          <div className="rounded-lg border p-3 md:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm font-medium">Assinatura profissional</p><p className="text-xs text-muted-foreground">Será usada futuramente em documentos e Ordens de Serviço.</p></div>
              <MediaButton label={state.profile.signatureMetadata ? "Substituir assinatura" : "Adicionar assinatura"} kind="signatureMetadata" onSelect={saveMedia} icon={Upload} />
            </div>
          </div>
        </div>
      </Section>

      <div className="flex justify-end"><Button type="submit">Salvar dados pessoais</Button></div>
    </form>
  );
}

function Preferences({ state, save }: { state: ProfileState; save: (value: ProfileState["preferences"]) => void }) {
  const preferences = state.preferences;
  return (
    <Section title="Preferências individuais" description="Estas escolhas prevalecem somente para o perfil local e não alteram as configurações da empresa.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <PreferenceSelect label="Tema" value={preferences.theme} onChange={(value) => save({ ...preferences, theme: value as typeof preferences.theme })} options={[['system','Seguir sistema'],['light','Claro'],['dark','Escuro']]} />
        <PreferenceSelect label="Densidade" value={preferences.density} onChange={(value) => save({ ...preferences, density: value as typeof preferences.density })} options={[['comfortable','Confortável'],['compact','Compacta']]} />
        <PreferenceSelect label="Tamanho da fonte" value={preferences.fontSize} onChange={(value) => save({ ...preferences, fontSize: value as typeof preferences.fontSize })} options={[['normal','Normal'],['large','Ampliada']]} />
        <PreferenceSelect label="Contraste" value={preferences.contrast} onChange={(value) => save({ ...preferences, contrast: value as typeof preferences.contrast })} options={[['normal','Normal'],['high','Alto contraste']]} />
        <div><Label htmlFor="profile-table-rows">Linhas por tabela</Label><Input id="profile-table-rows" type="number" min={5} max={100} value={preferences.tableRows} onChange={(event) => save({ ...preferences, tableRows: Number(event.target.value) })} /></div>
        <PreferenceSelect label="Abrir detalhes" value={preferences.openDetails} onChange={(value) => save({ ...preferences, openDetails: value as typeof preferences.openDetails })} options={[['same-tab','Na mesma guia'],['new-tab','Em nova guia']]} />
      </div>
      <label className="mt-4 flex items-center gap-2 rounded-lg border p-3 text-sm"><input type="checkbox" checked={preferences.reducedMotion} onChange={(event) => save({ ...preferences, reducedMotion: event.target.checked })} /> Reduzir animações</label>
    </Section>
  );
}

function Availability({ state, save }: { state: ProfileState; save: (value: ProfileState["availability"]) => void }) {
  const availability = state.availability;
  return (
    <Section title="Disponibilidade pessoal" description="Define sua rotina pessoal sem alterar automaticamente a Agenda.">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <PreferenceSelect label="Status atual" value={availability.status} onChange={(value) => save({ ...availability, status: value as typeof availability.status })} options={Object.entries(availabilityLabels)} />
        <div><Label>Início</Label><Input type="time" value={availability.startTime} onChange={(event) => save({ ...availability, startTime: event.target.value })} /></div>
        <div><Label>Fim</Label><Input type="time" value={availability.endTime} onChange={(event) => save({ ...availability, endTime: event.target.value })} /></div>
        <div><Label>Intervalo</Label><div className="grid grid-cols-2 gap-2"><Input type="time" value={availability.breakStart} onChange={(event) => save({ ...availability, breakStart: event.target.value })} /><Input type="time" value={availability.breakEnd} onChange={(event) => save({ ...availability, breakEnd: event.target.value })} /></div></div>
      </div>
      <div className="mt-4"><p className="mb-2 text-sm font-medium">Dias de trabalho</p><div className="flex flex-wrap gap-2">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((label, day) => <label key={label} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><input type="checkbox" checked={availability.workingDays.includes(day)} onChange={(event) => save({ ...availability, workingDays: event.target.checked ? [...availability.workingDays, day].sort() : availability.workingDays.filter((item) => item !== day) })} />{label}</label>)}</div></div>
    </Section>
  );
}

function NotificationPreferences({ state, save }: { state: ProfileState; save: (value: ProfileState["notificationPreferences"]) => void }) {
  return (
    <Section title="Preferências de notificações" description="Escolha quais categorias aparecem para este perfil local.">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(state.notificationPreferences).map(([key, value]) => (
          <div key={key} className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">{notificationCategoryLabel(key)}</p><p className="text-xs text-muted-foreground">Prioridade mínima: {priorityLabel(value.minimumPriority)}</p></div><input type="checkbox" checked={value.enabled} onChange={(event) => save({ ...state.notificationPreferences, [key]: { ...value, enabled: event.target.checked } })} /></div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Documents({ state, update, onError }: { state: ProfileState; update: (state: ProfileState) => void; onError: (message: string) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const data = new FormData(event.currentTarget);
      update(saveProfessionalDocumentAction({
        type: normalizeUpperCode(String(data.get("type"))),
        title: normalizeProperName(String(data.get("title"))),
        number: normalizeUpperCode(String(data.get("number"))) || undefined,
        issuer: normalizeProperName(String(data.get("issuer"))) || undefined,
        issuedAt: String(data.get("issuedAt")) || undefined,
        expiresAt: String(data.get("expiresAt")) || undefined,
        notes: String(data.get("notes")) || undefined,
      }));
      event.currentTarget.reset();
      onError("");
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Não foi possível salvar o documento.");
    }
  }
  return (
    <Section title="Documentos profissionais" description="Certificados, credenciais, registros e habilitações pessoais.">
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <TextField name="type" label="Tipo" required upper placeholder="NR-10" />
        <TextField name="title" label="Título" required properName />
        <TextField name="number" label="Número / registro" upper />
        <TextField name="issuer" label="Emissor" properName />
        <TextField name="issuedAt" label="Emissão" type="date" />
        <TextField name="expiresAt" label="Validade" type="date" />
        <div className="md:col-span-2"><TextField name="notes" label="Observações" /></div>
        <div className="flex justify-end md:col-span-2 xl:col-span-4"><Button>Adicionar documento</Button></div>
      </form>
      <div className="mt-4 grid gap-2 lg:grid-cols-2">
        {state.professionalDocuments.map((document) => (
          <div key={document.id} className="flex items-start gap-3 rounded-lg border p-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileBadge className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1"><p className="font-medium">{document.title}</p><p className="text-xs text-muted-foreground">{document.type}{document.number ? ` · ${document.number}` : ""}</p><p className="mt-1 text-xs">{document.expiresAt ? `Validade: ${formatDateBR(document.expiresAt)}` : "Sem validade definida"}</p></div>
          </div>
        ))}
        {!state.professionalDocuments.length && <div className="lg:col-span-2"><CompactEmpty title="Nenhum documento cadastrado" /></div>}
      </div>
    </Section>
  );
}

function ActivityList({ activities }: { activities: GlobalActivity[] }) {
  return (
    <Section title="Atividade recente" description="Atividades relacionadas ao perfil, quando a autoria pode ser identificada com segurança.">
      <div className="space-y-2">{activities.slice(0, 30).map((item) => <ActivityRow key={item.id} item={item} />)}{!activities.length && <CompactEmpty title="Nenhuma atividade disponível" />}</div>
    </Section>
  );
}

function Productivity({ state, activities }: { state: ProfileState; activities: GlobalActivity[] }) {
  const attributable = activities.filter((item) => item.actorName && normalizeProperName(item.actorName) === state.profile.displayName);
  const orders = attributable.filter((item) => item.source === "ORDERS");
  const agenda = attributable.filter((item) => item.source === "AGENDA");
  return (
    <Section title="Produtividade pessoal" description="Somente dados atribuíveis com segurança ao perfil ou ao integrante vinculado.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="OS atribuíveis" value={String(orders.length)} />
        <Stat label="Eventos atribuíveis" value={String(agenda.length)} />
        <Stat label="Atividades recentes" value={String(attributable.length)} />
        <Stat label="Período analisado" value="Dados disponíveis" compact />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Sem autenticação real, atividades sem autoria confiável não são atribuídas ao usuário local.</p>
    </Section>
  );
}

function Security() {
  return (
    <Section title="Segurança da conta" description="A estrutura está preparada, mas não simula recursos que dependem de autenticação real.">
      <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4"><div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Shield className="h-5 w-5" /></div><div><p className="font-medium">Autenticação ainda não conectada</p><p className="mt-1 text-sm text-muted-foreground">Senha, autenticação em duas etapas, sessões e dispositivos serão habilitados quando a autenticação real for conectada. Nenhuma senha ou credencial é armazenada localmente.</p></div></div>
    </Section>
  );
}

function HistoryList({ state }: { state: ProfileState }) {
  return <Section title="Histórico do perfil">{[...state.history].reverse().map((item) => <div key={item.id} className="border-b py-3 text-sm last:border-0"><p className="font-medium">{item.description}</p><time className="text-xs text-muted-foreground">{formatDateTimeBR(item.occurredAt)}</time></div>)}{!state.history.length && <CompactEmpty title="Nenhuma alteração registrada" />}</Section>;
}

function ImportExport({ update, onFeedback, onError }: { update: (state: ProfileState) => void; onFeedback: (message: string) => void; onError: (message: string) => void }) {
  return (
    <Section title="Importar e exportar" description="O arquivo JSON contém apenas os dados estruturados do Perfil; imagens locais permanecem no IndexedDB.">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => { const blob = new Blob([exportProfileAction()], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "proflow-perfil.json"; anchor.click(); URL.revokeObjectURL(url); }}><Download className="h-4 w-4" /> Exportar JSON</Button>
        <label className="inline-flex cursor-pointer items-center rounded-md border px-3 py-2 text-sm font-medium"><Upload className="mr-2 h-4 w-4" /> Importar JSON<input type="file" accept="application/json" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; void file.text().then((raw) => { update(importProfileAction(raw)); onFeedback("Perfil importado com sucesso."); onError(""); }).catch((cause) => onError(cause instanceof Error ? cause.message : "Importação inválida.")); }} /></label>
      </div>
    </Section>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="rounded-xl border bg-card p-4 shadow-xs"><div className="mb-3"><h2 className="font-semibold">{title}</h2>{description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}</div>{children}</section>;
}

function TextField({ name, label, defaultValue, type = "text", required, mask, properName, upper, ...props }: { name: string; label: string; defaultValue?: string; type?: string; required?: boolean; mask?: "phone" | "cpf" | "cep"; properName?: boolean; upper?: boolean } & Omit<ComponentProps<typeof Input>, "name" | "defaultValue" | "type">) {
  return <div><Label htmlFor={`profile-${name}`}>{label}</Label><Input id={`profile-${name}`} name={name} type={type} required={required} defaultValue={defaultValue ?? ""} onChange={(event) => { if (mask === "phone") event.currentTarget.value = formatBrazilianPhone(event.currentTarget.value); if (mask === "cpf") event.currentTarget.value = formatCpf(event.currentTarget.value); if (mask === "cep") event.currentTarget.value = formatCep(event.currentTarget.value); if (upper) event.currentTarget.value = normalizeUpperCode(event.currentTarget.value); }} onBlur={(event) => { if (properName) event.currentTarget.value = normalizeProperName(event.currentTarget.value); if (upper) event.currentTarget.value = normalizeUpperCode(event.currentTarget.value); }} {...props} /></div>;
}

function PreferenceSelect({ label, value, options, onChange }: { label: string; value: string; options: readonly (readonly [string, string])[] | [string, string][]; onChange: (value: string) => void }) {
  return <div><Label>{label}</Label><Select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</Select></div>;
}

function Avatar({ profileName, avatarUrl, size }: { profileName: string; avatarUrl: string | null; size: "medium" | "large" }) {
  const initials = profileName.split(" ").filter(Boolean).map((item) => item[0]).join("").slice(0, 2).toUpperCase() || "P";
  return <div className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-primary-foreground", size === "large" ? "size-24 text-3xl" : "size-16 text-xl")}>{avatarUrl ? <>
    {/* Blob local do IndexedDB: next/image não otimiza object URLs. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={avatarUrl} alt={`Avatar de ${profileName}`} className="h-full w-full object-cover" />
  </> : <span className="font-semibold">{initials}</span>}</div>;
}

function MediaButton({ label, kind, icon: Icon, onSelect }: { label: string; kind: "avatarMetadata" | "signatureMetadata"; icon: typeof Upload; onSelect: (kind: "avatarMetadata" | "signatureMetadata", file: File) => void }) {
  return <label className="inline-flex cursor-pointer items-center justify-center rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"><Icon className="mr-2 h-4 w-4" />{label}<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) onSelect(kind, file); }} /></label>;
}

function ProfileLine({ icon: Icon, value }: { icon: typeof Phone; value: string }) { return <div className="flex items-start gap-2"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><span className="min-w-0 break-words">{value}</span></div>; }
function InfoBlock({ label, value }: { label: string; value: ReactNode }) { return <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>; }
function Stat({ label, value, compact }: { label: string; value: string; compact?: boolean }) { return <div className="rounded-lg border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className={cn("mt-1 font-semibold tabular-nums", compact ? "text-sm" : "text-xl")}>{value}</p></div>; }
function MetricLine({ icon: Icon, label, value }: { icon: typeof BriefcaseBusiness; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-lg border p-3"><div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold tabular-nums">{value}</p></div></div>; }
function QuickPreference({ label, value, onClick }: { label: string; value: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></button>; }
function ActivityRow({ item }: { item: GlobalActivity }) { const content = <><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Activity className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.title}</p><p className="truncate text-xs text-muted-foreground">{item.sourceLabel}{item.description ? ` · ${item.description}` : ""}</p><time className="text-xs text-muted-foreground">{formatDateTimeBR(item.occurredAt)}</time></div></>; return item.link ? <Link href={item.link} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40">{content}<ChevronRight className="h-4 w-4 text-muted-foreground" /></Link> : <div className="flex items-center gap-3 rounded-lg border p-3">{content}</div>; }
function CompactEmpty({ title, action, onClick, href }: { title: string; action?: string; onClick?: () => void; href?: string }) { return <div className="rounded-lg border border-dashed p-4 text-center"><p className="text-sm text-muted-foreground">{title}</p>{action && (href ? <Link href={href} className="mt-2 inline-block text-sm font-medium text-primary">{action}</Link> : <button onClick={onClick} className="mt-2 text-sm font-medium text-primary">{action}</button>)}</div>; }
function notificationCategoryLabel(value: string) { return ({ CRM: "CRM", AGENDA: "Agenda", ORDERS: "Ordens", FINANCIAL: "Financeiro", STOCK: "Estoque", EQUIPMENT: "Equipamentos", PRICING: "Precificação", LIBRARY: "Biblioteca Técnica", SYSTEM: "Sistema" } as Record<string, string>)[value] ?? value; }
function priorityLabel(value: string) { return ({ LOW: "Baixa", NORMAL: "Normal", HIGH: "Alta", CRITICAL: "Crítica" } as Record<string, string>)[value] ?? value; }
