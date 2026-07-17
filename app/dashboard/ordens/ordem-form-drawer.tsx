"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { listClientsAction } from "@/app/dashboard/clientes/actions";
import type { ClientRecord } from "@/app/dashboard/clientes/clientes-data";
import { listCrmLeadsAction } from "@/features/crm/crm-actions";
import type { CrmLeadRecord } from "@/features/crm/crm-types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CurrencyReaisInput, ProperNameInput } from "@/components/ui/br-masked-inputs";
import { normalizeAddressText, normalizeUpperCode } from "@/lib/br-formatters";
import { ptBrLabel, teamRoleLabel } from "@/lib/pt-br-labels";
import { ordemSchema, type OrdemFormInput, type OrdemFormValues } from "./ordens-schema";
import type { OrdemRecord } from "./ordens-types";
import { getOrdersConfiguration } from "./ordens-configuracoes-gateway";
import type {
  OperationalPublicSettings,
  TeamMemberPublicReference,
} from "@/lib/contracts/configuracoes.contract";
const defaults: OrdemFormInput = {
  clientId: "",
  crmLeadId: "",
  title: "",
  description: "",
  category: "CORRECTIVE",
  priority: "NORMAL",
  status: "OPEN",
  technician: "",
  address: "",
  city: "",
  state: "BA",
  scheduledDate: new Date().toISOString().slice(0, 10),
  scheduledTime: "08:00",
  estimatedDurationMinutes: 60,
  estimatedValue: 0,
  notes: "",
  checklistText: "Avaliar condições do local",
  equipmentText: "",
  materialsText: "",
};
const fromOrder = (order?: OrdemRecord | null): OrdemFormInput =>
  order
    ? {
        clientId: order.clientId,
        crmLeadId: order.crmLeadId ?? "",
        title: order.title,
        description: order.description,
        category: order.category,
        priority: order.priority,
        status: order.status,
        technician: order.technician,
        address: order.address,
        city: order.city,
        state: order.state,
        scheduledDate: order.scheduledDate,
        scheduledTime: order.scheduledTime,
        estimatedDurationMinutes: order.estimatedDurationMinutes,
        estimatedValue: order.estimatedValue,
        notes: order.notes,
        checklistText: order.checklist.map((item) => item.title).join("\n"),
        equipmentText: order.equipment.join("\n"),
        materialsText: order.reservedMaterials.join("\n"),
      }
    : defaults;
export function OrdemFormDrawer({
  open,
  order,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  order?: OrdemRecord | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: OrdemFormValues) => Promise<void>;
}) {
  const [clients, setClients] = useState<ClientRecord[]>([]),
    [leads, setLeads] = useState<CrmLeadRecord[]>([]);
  const [team, setTeam] = useState<TeamMemberPublicReference[]>([]),
    [settings, setSettings] = useState<OperationalPublicSettings["serviceOrder"] | null>(
      null,
    ),
    [configurationWarning, setConfigurationWarning] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrdemFormInput, unknown, OrdemFormValues>({
    resolver: zodResolver(ordemSchema),
    defaultValues: defaults,
  });
  useEffect(() => {
    if (open) {
      reset(fromOrder(order));
      void Promise.all([
        listClientsAction(),
        listCrmLeadsAction(),
        getOrdersConfiguration(),
      ]).then(([clientItems, leadItems, configuration]) => {
        setClients(clientItems);
        setLeads(leadItems.filter((lead) => Boolean(lead.convertedClientId)));
        setTeam(configuration.team);
        setSettings(configuration.settings);
        setConfigurationWarning(configuration.warning ?? "");
        if (!order)
          reset({
            ...defaults,
            status: validStatus(configuration.settings.initialStatus),
            category: validCategory(configuration.settings.categories[0]),
            priority: validPriority(configuration.settings.priorities[0]),
            estimatedDurationMinutes: configuration.settings.defaultDurationMinutes,
          });
      });
    }
  }, [open, order, reset]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [onClose, open, saving]);
  const values = watch();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/55">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ordem-form-title"
        className="proflow-scrollbar h-full w-full overflow-y-auto bg-background shadow-2xl sm:max-w-3xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between border-b bg-card/95 px-5 py-4">
          <div>
            <h2 id="ordem-form-title" className="font-semibold">
              {order ? `Editar ${order.orderNumber}` : "Nova Ordem de Serviço"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Dados operacionais, agenda, vínculos e recursos.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={saving}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </Button>
        </header>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-5">
          <fieldset className="grid gap-3 md:grid-cols-2">
            <legend className="col-span-full text-sm font-semibold">Vínculos</legend>
            <Field
              label="Cliente"
              description="Selecione o cliente que receberá o atendimento. Cadastre-o em Clientes caso ainda não apareça na lista."
              htmlFor="os-client"
              error={errors.clientId?.message}
              required
            >
              <Select id="os-client" {...register("clientId")}>
                <option value="">Selecione um cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Contato de origem no CRM"
              description="Use este campo somente quando a ordem nasceu de uma oportunidade cadastrada no CRM."
              htmlFor="os-lead"
              error={errors.crmLeadId?.message}
            >
              <Select id="os-lead" {...register("crmLeadId")}>
                <option value="">Sem origem no CRM</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name}
                  </option>
                ))}
              </Select>
            </Field>
          </fieldset>
          <fieldset className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <legend className="col-span-full text-sm font-semibold">Serviço</legend>
            <Field
              label="Serviço a executar"
              description="Resuma o trabalho de forma objetiva. Ex.: Manutenção corretiva em ar-condicionado Split."
              htmlFor="os-title"
              error={errors.title?.message}
              required
              className="md:col-span-2"
            >
              <ProperNameInput
                id="os-title"
                autoFocus
                value={values.title}
                onValueChange={(value) =>
                  setValue("title", value, { shouldValidate: true, shouldDirty: true })
                }
              />
            </Field>
            <Field
              label="Tipo de serviço"
              description="Escolha a área que melhor representa o atendimento."
              htmlFor="os-category"
              error={errors.category?.message}
            >
              <Select id="os-category" {...register("category")}>
                {(
                  settings?.categories ?? [
                    "CLIMATIZATION",
                    "ELECTRICAL",
                    "PREVENTIVE",
                    "CORRECTIVE",
                    "INSTALLATION",
                  ]
                )
                  .filter(isCategory)
                  .map((value) => (
                    <option key={value} value={value}>
                      {ptBrLabel(value)}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field
              label="Descrição do problema ou serviço"
              description="Descreva o defeito relatado, o diagnóstico inicial ou o resultado esperado."
              htmlFor="os-description"
              error={errors.description?.message}
              className="md:col-span-2 xl:col-span-3"
            >
              <textarea
                id="os-description"
                className="min-h-20 w-full rounded-lg border bg-background p-2 text-sm"
                {...register("description")}
              />
            </Field>
            <Field
              label="Prioridade do atendimento"
              description="Indique a urgência operacional desta ordem."
              htmlFor="os-priority"
              error={errors.priority?.message}
            >
              <Select id="os-priority" {...register("priority")}>
                {(settings?.priorities ?? ["LOW", "NORMAL", "HIGH", "URGENT"])
                  .filter(isPriority)
                  .map((value) => (
                    <option key={value} value={value}>
                      {ptBrLabel(value)}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Situação da ordem" description="Mostra em qual etapa operacional este atendimento se encontra." htmlFor="os-status" error={errors.status?.message}>
              <Select id="os-status" {...register("status")}>
                {(
                  settings?.statuses ?? [
                    "OPEN",
                    "SCHEDULED",
                    "IN_PROGRESS",
                    "COMPLETED",
                    "CANCELED",
                  ]
                )
                  .filter(isStatus)
                  .map((value) => (
                    <option key={value} value={value}>
                      {ptBrLabel(value)}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field
              label="Responsável pela execução"
              description="Selecione o técnico ou integrante da equipe que executará o serviço."
              htmlFor="os-tech"
              error={errors.technician?.message}
            >
              <Select id="os-tech" {...register("technician")}>
                <option value="">Selecione um responsável</option>
                {order?.technician &&
                !team.some((item) => item.name === order.technician) ? (
                  <option value={order.technician}>{order.technician} (legado)</option>
                ) : null}
                {team.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name} · {teamRoleLabel(item.role)}
                  </option>
                ))}
              </Select>
              {configurationWarning ? (
                <p className="mt-1 text-[11px] text-amber-600">{configurationWarning}</p>
              ) : null}
            </Field>
          </fieldset>
          <fieldset className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <legend className="col-span-full text-sm font-semibold">
              Local e agenda
            </legend>
            <Field
              label="Endereço do atendimento"
              description="Informe o local exato onde o serviço será realizado."
              htmlFor="os-address"
              error={errors.address?.message}
              className="xl:col-span-2"
            >
              <Input
                id="os-address"
                {...register("address")}
                onBlur={(event) =>
                  setValue("address", normalizeAddressText(event.currentTarget.value), {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </Field>
            <Field label="Cidade" description="Cidade onde ocorrerá o atendimento." htmlFor="os-city" error={errors.city?.message}>
              <ProperNameInput
                id="os-city"
                value={values.city}
                onValueChange={(value) =>
                  setValue("city", value, { shouldValidate: true, shouldDirty: true })
                }
              />
            </Field>
            <Field label="UF" description="Sigla do estado, com duas letras. Ex.: BA." htmlFor="os-state" error={errors.state?.message}>
              <Input
                id="os-state"
                maxLength={2}
                {...register("state")}
                onChange={(event) =>
                  setValue("state", normalizeUpperCode(event.target.value).slice(0, 2), {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </Field>
            <Field
              label="Data prevista do atendimento"
              description="Data combinada ou estimada para a execução."
              htmlFor="os-date"
              error={errors.scheduledDate?.message}
            >
              <Input id="os-date" type="date" {...register("scheduledDate")} />
            </Field>
            <Field
              label="Horário previsto"
              description="Horário planejado para o início do serviço."
              htmlFor="os-time"
              error={errors.scheduledTime?.message}
            >
              <Input id="os-time" type="time" {...register("scheduledTime")} />
            </Field>
            <Field
              label="Duração estimada (minutos)"
              description="Tempo aproximado necessário para concluir o atendimento."
              htmlFor="os-duration"
              error={errors.estimatedDurationMinutes?.message}
            >
              <Input
                id="os-duration"
                type="number"
                min="15"
                step="15"
                {...register("estimatedDurationMinutes")}
              />
            </Field>
            <Field
              label="Valor previsto do serviço"
              description="Valor estimado para esta ordem, antes de eventuais ajustes."
              htmlFor="os-value"
              error={errors.estimatedValue?.message}
            >
              <CurrencyReaisInput
                id="os-value"
                value={Number(values.estimatedValue ?? 0)}
                onValueChange={(value) =>
                  setValue("estimatedValue", value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                aria-label="Valor previsto em reais"
              />
            </Field>
          </fieldset>
          <fieldset className="grid gap-3 md:grid-cols-3">
            <legend className="col-span-full text-sm font-semibold">Execução</legend>
            <Field
              label="Etapas e verificações iniciais"
              description="Digite uma tarefa por linha. Ex.: Conferir tensão elétrica; fotografar equipamento; verificar número de série."
              htmlFor="os-checklist"
              error={errors.checklistText?.message}
            >
              <textarea
                id="os-checklist"
                className="min-h-28 w-full rounded-lg border bg-background p-2 text-sm"
                placeholder="Um item por linha"
                {...register("checklistText")}
              />
            </Field>
            <Field label="Equipamentos atendidos"
              description="Digite um equipamento por linha. Ex.: Evaporadora LG 18.000 BTU." htmlFor="os-equipment">
              <textarea
                id="os-equipment"
                className="min-h-28 w-full rounded-lg border bg-background p-2 text-sm"
                placeholder="Um equipamento por linha"
                {...register("equipmentText")}
              />
            </Field>
            <Field label="Materiais previstos ou reservados"
              description="Digite um material por linha. Ex.: Cabo PP 2x2,5; disjuntor 20 A." htmlFor="os-materials">
              <textarea
                id="os-materials"
                className="min-h-28 w-full rounded-lg border bg-background p-2 text-sm"
                placeholder="Um material por linha"
                {...register("materialsText")}
              />
            </Field>
            <Field
              label="Observações internas"
              description="Registre orientações, restrições de acesso ou informações úteis para a equipe."
              htmlFor="os-notes"
              error={errors.notes?.message}
              className="md:col-span-3"
            >
              <textarea
                id="os-notes"
                className="min-h-20 w-full rounded-lg border bg-background p-2 text-sm"
                {...register("notes")}
              />
            </Field>
          </fieldset>
          <footer className="sticky bottom-0 flex justify-end gap-2 border-t bg-background/95 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Salvando..." : "Salvar OS"}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
const categories = [
    "CLIMATIZATION",
    "ELECTRICAL",
    "PREVENTIVE",
    "CORRECTIVE",
    "INSTALLATION",
  ] as const,
  priorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const,
  statuses = [
    "OPEN",
    "SCHEDULED",
    "IN_TRANSIT",
    "IN_PROGRESS",
    "WAITING_PART",
    "COMPLETED",
    "CANCELED",
    "OVERDUE",
  ] as const;
const isCategory = (value: string): value is OrdemFormValues["category"] =>
  categories.includes(value as (typeof categories)[number]);
const isPriority = (value: string): value is OrdemFormValues["priority"] =>
  priorities.includes(value as (typeof priorities)[number]);
const isStatus = (value: string): value is OrdemFormValues["status"] =>
  statuses.includes(value as (typeof statuses)[number]);
const validCategory = (value?: string): OrdemFormInput["category"] =>
  value && isCategory(value) ? value : "CORRECTIVE";
const validPriority = (value?: string): OrdemFormInput["priority"] =>
  value && isPriority(value) ? value : "NORMAL";
const validStatus = (value?: string): OrdemFormInput["status"] =>
  value && isStatus(value) ? value : "OPEN";
