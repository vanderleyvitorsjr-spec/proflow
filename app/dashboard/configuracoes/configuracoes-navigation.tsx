"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Building2,
  Calculator,
  Clock3,
  Download,
  History,
  ListOrdered,
  Palette,
  Save,
  Settings2,
  SlidersHorizontal,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIcon,
  PageHeaderIdentity,
} from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { formatCurrencyBRLFromCents } from "@/lib/br-formatters";
import {
  getConfigurationsAction,
  importConfigurationsAction,
  previewConfigurationImportAction,
  resetConfigurationSectionAction,
  saveConfigurationSectionAction,
  saveTeamMemberAction,
  setTeamMemberArchivedAction,
} from "./configuracoes-actions";
import { numberingExample } from "./configuracoes-selectors";
import type { ConfigSection, ConfigState, TeamMember } from "./configuracoes-types";
import { ConfigurationTeamDialog } from "./configuracoes-team-dialog";
import { ConfigurationConfirmationDialog } from "./configuracoes-confirmation-dialog";
type View = ConfigSection | "history" | "transfer";
const items: { id: View; label: string; icon: typeof Settings2 }[] = [
  { id: "company", label: "Empresa", icon: Building2 },
  { id: "team", label: "Equipe", icon: Users },
  { id: "operational", label: "Operação", icon: SlidersHorizontal },
  { id: "financial", label: "Financeiro", icon: Calculator },
  { id: "pricing", label: "Precificação", icon: Settings2 },
  { id: "numbering", label: "Numeração", icon: ListOrdered },
  { id: "appearance", label: "Aparência", icon: Palette },
  { id: "preferences", label: "Preferências", icon: Clock3 },
  { id: "history", label: "Histórico", icon: History },
  { id: "transfer", label: "Importar e exportar", icon: Upload },
];
const csv = (values: string[]) => values.join(", "),
  parseCsv = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
const field = "space-y-1 text-xs font-medium text-foreground";
export function ConfigurationCenter() {
  const [state, setState] = useState<ConfigState>(),
    [view, setView] = useState<View>("company"),
    [dirty, setDirty] = useState<Set<ConfigSection>>(new Set()),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [teamSearch, setTeamSearch] = useState(""),
    [teamDialog, setTeamDialog] = useState<TeamMember | null | undefined>(),
    [confirmation, setConfirmation] = useState<{
      title: string;
      description: string;
      action: () => Promise<void>;
      danger?: boolean;
    }>(),
    [importText, setImportText] = useState(""),
    [preview, setPreview] = useState<Record<string, unknown>>(),
    { setTheme } = useTheme();
  useEffect(() => {
    let active = true;
    void getConfigurationsAction().then((result) => {
      if (!active) return;
      if (result.ok) setState(result.data);
      else setError(result.error.message);
    });
    return () => {
      active = false;
    };
  }, []);
  const update = <K extends keyof ConfigState>(
    key: K,
    value: ConfigState[K],
    section: ConfigSection,
  ) => {
    setState((current) => (current ? { ...current, [key]: value } : current));
    setDirty((current) => new Set(current).add(section));
    setMessage("");
  };
  const save = async (section: Exclude<ConfigSection, "team">) => {
    if (!state) return;
    setSaving(true);
    setError("");
    const key =
      section === "company"
        ? "company"
        : section === "operational"
          ? "operationalSettings"
          : section === "financial"
            ? "financialSettings"
            : section === "pricing"
              ? "pricingSettings"
              : section === "numbering"
                ? "numberingSettings"
                : section === "appearance"
                  ? "appearanceSettings"
                  : "systemPreferences";
    const result = await saveConfigurationSectionAction(section, state[key]);
    if (result.ok) {
      setState(result.data);
      setDirty((current) => {
        const next = new Set(current);
        next.delete(section);
        return next;
      });
      setMessage("Alterações salvas com sucesso.");
      if (section === "appearance") {
        setTheme(result.data.appearanceSettings.theme);
        const root = document.documentElement;
        root.dataset.density = result.data.appearanceSettings.density;
        root.dataset.contrast = result.data.appearanceSettings.contrast;
        root.dataset.fontSize = result.data.appearanceSettings.fontSize;
        root.dataset.reducedMotion = String(result.data.appearanceSettings.reducedMotion);
      }
    } else setError(result.error.message);
    setSaving(false);
  };
  const reset = (section: Exclude<ConfigSection, "team">) =>
    setConfirmation({
      title: "Restaurar seção?",
      description:
        "Somente esta seção voltará aos padrões. Nenhum registro operacional será alterado.",
      danger: true,
      action: async () => {
        const result = await resetConfigurationSectionAction(section);
        if (result.ok) {
          setState(result.data);
          setDirty(new Set());
          setMessage("Seção restaurada.");
        } else setError(result.error.message);
      },
    });
  if (error && !state)
    return <EmptyState title="Configurações indisponíveis" description={error} />;
  if (!state)
    return <div role="status" className="h-64 animate-pulse rounded-xl bg-muted" />;
  const loadedState = state;
  const sectionActions =
    view !== "team" && !["history", "transfer"].includes(view) ? (
      <>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => reset(view as Exclude<ConfigSection, "team">)}
        >
          Restaurar seção
        </Button>
        <Button
          size="sm"
          disabled={saving || !dirty.has(view as ConfigSection)}
          onClick={() => void save(view as Exclude<ConfigSection, "team">)}
        >
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar seção"}
        </Button>
      </>
    ) : null;
  return (
    <div className="space-y-3">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <PageHeaderIcon>
              <Settings2 className="h-4 w-4" />
            </PageHeaderIcon>
            <PageHeaderHeading
              title="Configurações"
              description="Parâmetros compartilhados, identidade e preferências do ProFlow."
            />
          </PageHeaderIdentity>
          <PageHeaderActions>
            {dirty.size ? (
              <span className="text-xs text-amber-600">
                {dirty.size} seção(ões) não salva(s)
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Revisão {state.revision}
              </span>
            )}
            {sectionActions}
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>
      {message ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300"
        >
          {message}
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}
      <div className="grid min-w-0 gap-3 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav
          aria-label="Seções de configurações"
          className="proflow-scrollbar flex gap-1 overflow-x-auto rounded-xl border bg-card p-2 lg:block lg:space-y-1"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => setView(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors lg:w-full ${view === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <main className="min-w-0">{renderSection()}</main>
      </div>
      <ConfigurationTeamDialog
        open={teamDialog !== undefined}
        member={teamDialog ?? undefined}
        onClose={() => setTeamDialog(undefined)}
        onSave={async (value, id) => {
          const result = await saveTeamMemberAction(value, id);
          if (result.ok) {
            setState(result.data);
            setTeamDialog(undefined);
            setMessage("Integrante salvo com sucesso.");
          } else setError(result.error.message);
        }}
      />
      <ConfigurationConfirmationDialog
        open={Boolean(confirmation)}
        title={confirmation?.title ?? ""}
        description={confirmation?.description ?? ""}
        danger={confirmation?.danger}
        onClose={() => setConfirmation(undefined)}
        onConfirm={() => {
          const action = confirmation?.action;
          setConfirmation(undefined);
          if (action) void action();
        }}
      />
    </div>
  );
  function panel(title: string, description: string, content: React.ReactNode) {
    return (
      <Card>
        <CardHeader className="border-b px-4 py-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="p-4">{content}</CardContent>
      </Card>
    );
  }
  function renderSection() {
    const state = loadedState;
    if (view === "company") {
      const company = state.company,
        set = (key: keyof typeof company, value: string | string[]) =>
          update("company", { ...company, [key]: value }, "company");
      const fields: [keyof typeof company, string, string?][] = [
        ["legalName", "Razão social"],
        ["tradeName", "Nome fantasia"],
        ["document", "CPF ou CNPJ"],
        ["stateRegistration", "Inscrição estadual"],
        ["municipalRegistration", "Inscrição municipal"],
        ["phone", "Telefone"],
        ["whatsapp", "WhatsApp"],
        ["email", "E-mail", "email"],
        ["website", "Site"],
        ["address", "Endereço"],
        ["city", "Cidade"],
        ["state", "Estado"],
        ["zipCode", "CEP"],
        ["legalRepresentative", "Responsável legal"],
        ["businessHours", "Horário de atendimento"],
        ["displayName", "Nome exibido"],
        ["shortName", "Nome curto"],
        ["logoMetadata", "Metadado da logomarca"],
        ["iconMetadata", "Metadado do ícone"],
        ["primaryColor", "Cor principal", "color"],
        ["secondaryColor", "Cor secundária", "color"],
        ["documentHeader", "Cabeçalho de documentos"],
        ["documentFooter", "Rodapé de documentos"],
        ["textualSignature", "Assinatura textual"],
      ];
      return panel(
        "Empresa e identidade",
        "Dados empresariais e conteúdo exibido nos documentos.",
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {fields.map(([key, label, type]) => (
            <label key={key} className={field}>
              {label}
              <Input
                className="mt-1"
                type={type}
                value={String(company[key])}
                onChange={(e) => set(key, e.target.value)}
              />
            </label>
          ))}
          <label className={field}>
            Segmento
            <Select
              className="mt-1"
              value={company.segment}
              onChange={(e) => set("segment", e.target.value)}
            >
              {[
                "CLIMATIZACAO",
                "AR_CONDICIONADO",
                "ELETRICA",
                "REFRIGERACAO",
                "MANUTENCAO_PREDIAL",
                "SERVICOS_TECNICOS",
                "OUTRO",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </Select>
          </label>
          <label className={field}>
            Especialidades
            <Input
              className="mt-1"
              value={csv(company.specialties)}
              onChange={(e) => set("specialties", parseCsv(e.target.value))}
            />
          </label>
          <label className={`${field} sm:col-span-2 xl:col-span-3`}>
            Observações
            <textarea
              className="mt-1 min-h-20 w-full rounded-md border bg-background p-2 text-sm"
              value={company.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </label>
        </div>,
      );
    }
    if (view === "team") {
      const visible = state.teamMembers.filter((item) =>
        item.name.toLowerCase().includes(teamSearch.toLowerCase()),
      );
      return panel(
        "Equipe, técnicos e responsáveis",
        "Perfis organizacionais; não representam permissões de autenticação.",
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Buscar integrante"
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
            />
            <Button onClick={() => setTeamDialog(null)}>Novo integrante</Button>
          </div>
          {visible.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[42rem] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-2">Nome</th>
                    <th>Perfil</th>
                    <th>Especialidades</th>
                    <th>Custo/hora</th>
                    <th>Status</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((member) => (
                    <tr key={member.id} className="border-b">
                      <td className="p-2 font-medium">{member.name}</td>
                      <td>{member.role}</td>
                      <td>{csv(member.specialties)}</td>
                      <td>{formatCurrencyBRLFromCents(member.hourlyCostCents)}</td>
                      <td>
                        {member.archivedAt
                          ? "Arquivado"
                          : member.active
                            ? "Ativo"
                            : "Inativo"}
                      </td>
                      <td className="space-x-1 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setTeamDialog(member)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setConfirmation({
                              title: member.archivedAt
                                ? "Reativar integrante?"
                                : "Arquivar integrante?",
                              description: "O histórico será preservado.",
                              action: async () => {
                                const result = await setTeamMemberArchivedAction(
                                  member.id,
                                  !member.archivedAt,
                                );
                                if (result.ok) setState(result.data);
                                else setError(result.error.message);
                              },
                            })
                          }
                        >
                          {member.archivedAt ? "Reativar" : "Arquivar"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              size="compact"
              title="Nenhum integrante"
              description="Cadastre técnicos e responsáveis para preparar o uso compartilhado."
            />
          )}
        </>,
      );
    }
    if (view === "operational") {
      const op = state.operationalSettings,
        listInput = (label: string, values: string[], change: (v: string[]) => void) => (
          <label className={field}>
            {label}
            <Input
              className="mt-1"
              value={csv(values)}
              onChange={(e) => change(parseCsv(e.target.value))}
            />
          </label>
        );
      return panel(
        "Parâmetros operacionais",
        "Preferências para novas Ordens, Agenda, Estoque e Equipamentos.",
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="space-y-3">
            <h3 className="font-semibold">Ordens e Agenda</h3>
            {listInput("Status de OS", op.serviceOrder.statuses, (v) =>
              update(
                "operationalSettings",
                { ...op, serviceOrder: { ...op.serviceOrder, statuses: v } },
                "operational",
              ),
            )}
            {listInput("Categorias de serviço", op.serviceOrder.categories, (v) =>
              update(
                "operationalSettings",
                { ...op, serviceOrder: { ...op.serviceOrder, categories: v } },
                "operational",
              ),
            )}
            <label className={field}>
              Duração padrão da OS (min)
              <Input
                type="number"
                className="mt-1"
                value={op.serviceOrder.defaultDurationMinutes}
                onChange={(e) =>
                  update(
                    "operationalSettings",
                    {
                      ...op,
                      serviceOrder: {
                        ...op.serviceOrder,
                        defaultDurationMinutes: Number(e.target.value),
                      },
                    },
                    "operational",
                  )
                }
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className={field}>
                Agenda inicia
                <Input
                  type="time"
                  className="mt-1"
                  value={op.agenda.startTime}
                  onChange={(e) =>
                    update(
                      "operationalSettings",
                      { ...op, agenda: { ...op.agenda, startTime: e.target.value } },
                      "operational",
                    )
                  }
                />
              </label>
              <label className={field}>
                Agenda termina
                <Input
                  type="time"
                  className="mt-1"
                  value={op.agenda.endTime}
                  onChange={(e) =>
                    update(
                      "operationalSettings",
                      { ...op, agenda: { ...op.agenda, endTime: e.target.value } },
                      "operational",
                    )
                  }
                />
              </label>
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="font-semibold">Estoque e Equipamentos</h3>
            {listInput("Categorias de estoque", op.stock.categories, (v) =>
              update(
                "operationalSettings",
                { ...op, stock: { ...op.stock, categories: v } },
                "operational",
              ),
            )}
            {listInput("Unidades", op.stock.units, (v) =>
              update(
                "operationalSettings",
                { ...op, stock: { ...op.stock, units: v } },
                "operational",
              ),
            )}
            {listInput("Categorias de ativos", op.equipment.categories, (v) =>
              update(
                "operationalSettings",
                { ...op, equipment: { ...op.equipment, categories: v } },
                "operational",
              ),
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={op.stock.allowNegative}
                onChange={(e) =>
                  update(
                    "operationalSettings",
                    { ...op, stock: { ...op.stock, allowNegative: e.target.checked } },
                    "operational",
                  )
                }
              />
              Permitir saldo negativo
            </label>
            <p className="text-xs text-muted-foreground">
              Método de custo: média ponderada. FIFO e LIFO permanecem indisponíveis.
            </p>
          </section>
        </div>,
      );
    }
    if (view === "financial") {
      const f = state.financialSettings,
        set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) =>
          update("financialSettings", { ...f, [key]: value }, "financial");
      return panel(
        "Parâmetros financeiros",
        "Padrões para novos lançamentos; registros existentes não são alterados.",
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["revenueCategories", "Categorias de receita"],
              ["expenseCategories", "Categorias de despesa"],
              ["investmentCategories", "Categorias de investimento"],
              ["paymentMethods", "Métodos de pagamento"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className={field}>
              {label}
              <Input
                className="mt-1"
                value={csv(f[key])}
                onChange={(e) => set(key, parseCsv(e.target.value))}
              />
            </label>
          ))}
          <label className={field}>
            Prazo padrão (dias)
            <Input
              className="mt-1"
              type="number"
              value={f.defaultDueDays}
              onChange={(e) => set("defaultDueDays", Number(e.target.value))}
            />
          </label>
          <label className={field}>
            Parcelas padrão
            <Input
              className="mt-1"
              type="number"
              min="1"
              value={f.defaultInstallments}
              onChange={(e) => set("defaultInstallments", Number(e.target.value))}
            />
          </label>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Moeda: Real brasileiro. Pagamentos acima do saldo permanecem bloqueados.
          </p>
        </div>,
      );
    }
    if (view === "pricing") {
      const p = state.pricingSettings,
        set = (key: keyof typeof p, value: number | string | boolean) =>
          update("pricingSettings", { ...p, [key]: value }, "pricing");
      const percentages: [keyof typeof p, string][] = [
        ["minimumMarginBasisPoints", "Margem mínima"],
        ["recommendedMarginBasisPoints", "Margem recomendada"],
        ["premiumMarginBasisPoints", "Margem premium"],
        ["taxBasisPoints", "Imposto padrão"],
        ["commissionBasisPoints", "Comissão padrão"],
        ["laborBurdenBasisPoints", "Encargos de mão de obra"],
        ["technicalLossBasisPoints", "Perda técnica"],
        ["overheadBasisPoints", "Overhead"],
      ];
      return panel(
        "Parâmetros de precificação",
        "Percentuais em basis points e valores monetários em centavos.",
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {percentages.map(([key, label]) => (
            <label key={key} className={field}>
              {label} (%)
              <Input
                className="mt-1"
                type="number"
                step="0.01"
                value={Number(p[key]) / 100}
                onChange={(e) => set(key, Math.round(Number(e.target.value) * 100))}
              />
            </label>
          ))}
          <label className={field}>
            Custo por km (R$)
            <Input
              className="mt-1"
              type="number"
              step="0.01"
              value={p.costPerKmCents / 100}
              onChange={(e) =>
                set("costPerKmCents", Math.round(Number(e.target.value) * 100))
              }
            />
          </label>
          <label className={field}>
            Horas mensais de equipamentos
            <Input
              className="mt-1"
              type="number"
              value={p.equipmentMonthlyHours}
              onChange={(e) => set("equipmentMonthlyHours", Number(e.target.value))}
            />
          </label>
          <label className={field}>
            Arredondamento
            <Select
              className="mt-1"
              value={p.rounding}
              onChange={(e) => set("rounding", e.target.value)}
            >
              {[
                "NONE",
                "NEAREST_REAL",
                "MULTIPLE_5",
                "MULTIPLE_10",
                "ENDING_0",
                "ENDING_9",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={p.requireBelowMinimumConfirmation}
              onChange={(e) => set("requireBelowMinimumConfirmation", e.target.checked)}
            />
            Confirmar abaixo do mínimo
          </label>
        </div>,
      );
    }
    if (view === "numbering")
      return panel(
        "Numeração central",
        "Preferências informativas; os módulos continuam responsáveis por suas sequências atuais.",
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(state.numberingSettings).map(([key, item]) => (
            <fieldset key={key} className="rounded-lg border p-3">
              <legend className="px-1 text-xs font-semibold">{key}</legend>
              <div className="grid grid-cols-2 gap-2">
                <label className={field}>
                  Prefixo
                  <Input
                    value={item.prefix}
                    onChange={(e) =>
                      update(
                        "numberingSettings",
                        {
                          ...state.numberingSettings,
                          [key]: { ...item, prefix: e.target.value },
                        },
                        "numbering",
                      )
                    }
                  />
                </label>
                <label className={field}>
                  Próximo número
                  <Input
                    type="number"
                    min="1"
                    value={item.nextNumber}
                    onChange={(e) =>
                      update(
                        "numberingSettings",
                        {
                          ...state.numberingSettings,
                          [key]: { ...item, nextNumber: Number(e.target.value) },
                        },
                        "numbering",
                      )
                    }
                  />
                </label>
                <label className={field}>
                  Dígitos
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={item.digits}
                    onChange={(e) =>
                      update(
                        "numberingSettings",
                        {
                          ...state.numberingSettings,
                          [key]: { ...item, digits: Number(e.target.value) },
                        },
                        "numbering",
                      )
                    }
                  />
                </label>
                <label className={field}>
                  Separador
                  <Input
                    maxLength={3}
                    value={item.separator}
                    onChange={(e) =>
                      update(
                        "numberingSettings",
                        {
                          ...state.numberingSettings,
                          [key]: { ...item, separator: e.target.value },
                        },
                        "numbering",
                      )
                    }
                  />
                </label>
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={item.includeYear}
                  onChange={(e) =>
                    update(
                      "numberingSettings",
                      {
                        ...state.numberingSettings,
                        [key]: { ...item, includeYear: e.target.checked },
                      },
                      "numbering",
                    )
                  }
                />
                Incluir ano
              </label>
              <p className="mt-2 rounded bg-muted px-2 py-1 text-xs font-medium">
                Exemplo: {numberingExample(item)}
              </p>
            </fieldset>
          ))}
        </div>,
      );
    if (view === "appearance") {
      const a = state.appearanceSettings,
        set = (key: keyof typeof a, value: string | boolean) =>
          update("appearanceSettings", { ...a, [key]: value }, "appearance");
      return panel(
        "Aparência do ProFlow",
        "Aplicada ao aplicativo somente após salvar esta seção.",
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={field}>
            Tema
            <Select
              className="mt-1"
              value={a.theme}
              onChange={(e) => set("theme", e.target.value)}
            >
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
              <option value="system">Seguir sistema</option>
            </Select>
          </label>
          <label className={field}>
            Densidade
            <Select
              className="mt-1"
              value={a.density}
              onChange={(e) => set("density", e.target.value)}
            >
              <option value="comfortable">Confortável</option>
              <option value="compact">Compacta</option>
            </Select>
          </label>
          <label className={field}>
            Contraste
            <Select
              className="mt-1"
              value={a.contrast}
              onChange={(e) => set("contrast", e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="high">Alto</option>
            </Select>
          </label>
          <label className={field}>
            Fonte
            <Select
              className="mt-1"
              value={a.fontSize}
              onChange={(e) => set("fontSize", e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="large">Ampliada</option>
            </Select>
          </label>
          <label className={field}>
            Cor de destaque
            <Select
              className="mt-1"
              value={a.accent}
              onChange={(e) => set("accent", e.target.value)}
            >
              {["sky", "blue", "violet", "emerald", "amber"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={a.reducedMotion}
              onChange={(e) => set("reducedMotion", e.target.checked)}
            />
            Reduzir animações
          </label>
        </div>,
      );
    }
    if (view === "preferences") {
      const p = state.systemPreferences,
        set = (key: keyof typeof p, value: string | number | boolean) =>
          update("systemPreferences", { ...p, [key]: value }, "preferences");
      return panel(
        "Preferências gerais",
        "Comportamento padrão das interfaces e tabelas.",
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={field}>
            Formato de hora
            <Select
              className="mt-1"
              value={p.timeFormat}
              onChange={(e) => set("timeFormat", e.target.value)}
            >
              <option value="24h">24 horas</option>
              <option value="12h">12 horas</option>
            </Select>
          </label>
          <label className={field}>
            Timezone
            <Input
              className="mt-1"
              value={p.timezone}
              onChange={(e) => set("timezone", e.target.value)}
            />
          </label>
          <label className={field}>
            Linhas por tabela
            <Input
              className="mt-1"
              type="number"
              min="5"
              max="200"
              value={p.tableRows}
              onChange={(e) => set("tableRows", Number(e.target.value))}
            />
          </label>
          <label className={field}>
            Abrir detalhes
            <Select
              className="mt-1"
              value={p.openDetails}
              onChange={(e) => set("openDetails", e.target.value)}
            >
              <option value="same-tab">Mesma guia</option>
              <option value="new-tab">Nova guia</option>
            </Select>
          </label>
          {(
            [
              ["confirmDeletion", "Confirmar exclusão"],
              ["confirmArchiving", "Confirmar arquivamento"],
              ["preserveFilters", "Preservar filtros"],
              ["internalNotifications", "Notificações internas preparadas"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={p[key]}
                onChange={(e) => set(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>,
      );
    }
    if (view === "history")
      return panel(
        "Histórico de configurações",
        "Registro append-only das alterações administrativas.",
        state.history.length ? (
          <ol className="divide-y">
            {[...state.history].reverse().map((item) => (
              <li key={item.id} className="py-2">
                <div className="flex justify-between gap-3">
                  <span className="text-sm font-medium">{item.description}</span>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </time>
                </div>
                <p className="text-[10px] text-muted-foreground">{item.type}</p>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState size="compact" title="Nenhuma alteração registrada" />
        ),
      );
    return panel(
      "Importar e exportar",
      "O arquivo contém apenas configurações; nenhum dado operacional é incluído.",
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              const raw = JSON.stringify(state, null, 2),
                blob = new Blob([raw], { type: "application/json" }),
                url = URL.createObjectURL(blob),
                link = document.createElement("a");
              link.href = url;
              link.download = `configuracoes-proflow-${new Date().toISOString().slice(0, 10)}.json`;
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4" />
            Exportar JSON
          </Button>
        </div>
        <label className={field}>
          Conteúdo JSON
          <textarea
            className="mt-1 min-h-52 w-full rounded-md border bg-background p-3 font-mono text-xs"
            value={importText}
            onChange={(e) => {
              setImportText(e.target.value);
              setPreview(undefined);
            }}
          />
        </label>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              const result = await previewConfigurationImportAction(importText);
              if (result.ok) setPreview(result.data);
              else setError(result.error.message);
            }}
          >
            Validar e visualizar impacto
          </Button>
          <Button
            disabled={!preview}
            onClick={() =>
              setConfirmation({
                title: "Importar configurações?",
                description:
                  "Um backup será criado antes da importação. Dados operacionais não serão afetados.",
                action: async () => {
                  const result = await importConfigurationsAction(importText);
                  if (result.ok) {
                    setState(result.data);
                    setMessage("Configurações importadas.");
                    setPreview(undefined);
                  } else setError(result.error.message);
                },
              })
            }
          >
            Importar
          </Button>
        </div>
        {preview ? (
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
            {JSON.stringify(preview, null, 2)}
          </pre>
        ) : null}
      </div>,
    );
  }
}
