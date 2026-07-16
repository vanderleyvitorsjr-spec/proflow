import type { CrmLeadRecord, CrmStageId } from "./crm-types";

export type CrmStage = { id: CrmStageId; title: string; description: string; tone: "default" | "success" | "danger" };

export const crmStages: CrmStage[] = [
  { id: "new", title: "Novos leads", description: "Oportunidades recém-cadastradas.", tone: "default" },
  { id: "contacted", title: "Contato realizado", description: "Leads com primeiro contato concluído.", tone: "default" },
  { id: "technical-visit", title: "Visita técnica", description: "Avaliação presencial necessária.", tone: "default" },
  { id: "sent", title: "Orçamento enviado", description: "Propostas aguardando retorno.", tone: "default" },
  { id: "negotiation", title: "Negociação", description: "Condições comerciais em ajuste.", tone: "default" },
  { id: "approved", title: "Aprovados", description: "Negócios aprovados.", tone: "success" },
  { id: "lost", title: "Perdidos", description: "Oportunidades encerradas.", tone: "danger" },
];

const now = "2026-07-15T12:00:00.000Z";
const seed = (id: string, name: string, interest: string, stageId: CrmStageId, value: number, priority: CrmLeadRecord["priority"]): CrmLeadRecord => ({
  id, name, type: "COMPANY", document: "", phone: `7398888777${id.slice(-1)}`, whatsapp: `7398888777${id.slice(-1)}`, email: `${id}@exemplo.com`,
  address: "Endereço demonstrativo", city: "Porto Seguro", state: "BA", zipCode: "45810000", source: "Site",
  serviceInterest: interest, salesOwner: "Consultor responsável", priority, estimatedValue: value, contactDate: "2026-07-15",
  notes: "Registro demonstrativo preservado da versão inicial do CRM.", stageId, createdAt: now, updatedAt: now,
  history: [{ id: `${id}-created`, type: "CREATED", description: "Lead criado.", createdAt: now }],
});

export const initialCrmLeads: CrmLeadRecord[] = [
  seed("lead-1", "Cliente residencial exemplo", "Instalação de climatização", "new", 4850, "HIGH"),
  seed("lead-2", "Empresa comercial exemplo", "Manutenção preventiva", "new", 7600, "MEDIUM"),
  seed("lead-3", "Imóvel comercial exemplo", "Adequação elétrica", "contacted", 3200, "MEDIUM"),
  seed("lead-4", "Empreendimento exemplo", "Diagnóstico de sistema VRF", "technical-visit", 8900, "HIGH"),
  seed("lead-5", "Empresa de hospedagem exemplo", "Contrato de manutenção preventiva", "sent", 12450, "MEDIUM"),
  seed("lead-6", "Condomínio exemplo", "Modernização de quadro geral", "negotiation", 18600, "HIGH"),
  seed("lead-7", "Cliente corporativo exemplo", "Instalação de sistema de climatização", "approved", 22500, "MEDIUM"),
];
