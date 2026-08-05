import { formatCpfCnpj, formatCurrencyBRLFromCents, formatDateBR, formatDateTimeBR, formatBrazilianPhone } from "../../lib/br-formatters";

export type ProfessionalDocumentType =
  | "QUOTE" | "COMMERCIAL_PROPOSAL" | "SERVICE_ORDER" | "TECHNICAL_REPORT"
  | "SERVICE_CHECKLIST" | "SIMPLIFIED_REPORT" | "RECEIPT" | "PURCHASE_ORDER"
  | "QUOTATION" | "EQUIPMENT_RECORD" | "MAINTENANCE_HISTORY" | "DELIVERY_TERM"
  | "WARRANTY_TERM" | "EXECUTION_RECEIPT";

export interface DocumentIdentity {
  logoUrl?: string; companyName?: string; document?: string; phone?: string; email?: string;
  address?: string; website?: string; primaryColor?: string; footer?: string; signature?: string;
  technicalResponsible?: string; professionalRegistration?: string;
}
export interface DocumentField { label: string; value?: string; }
export interface DocumentTable { columns: string[]; rows: string[][]; }
export interface ProfessionalDocumentData {
  type: ProfessionalDocumentType; title: string; number?: string; version?: number;
  identity?: DocumentIdentity; fields: DocumentField[]; sections: Array<{ title: string; text?: string; table?: DocumentTable }>;
  issuedAt?: string; signatureLabels?: string[];
}

export function visibleDocumentFields(fields: DocumentField[]) {
  return fields.filter((field) => field.value?.trim());
}
export function documentIdentityFields(identity?: DocumentIdentity): DocumentField[] {
  if (!identity) return [];
  return visibleDocumentFields([
    { label: "Empresa", value: identity.companyName },
    { label: "CNPJ", value: identity.document ? formatCpfCnpj(identity.document) : undefined },
    { label: "Telefone", value: identity.phone ? formatBrazilianPhone(identity.phone) : undefined },
    { label: "E-mail", value: identity.email?.toLocaleLowerCase("pt-BR") },
    { label: "Endereço", value: identity.address }, { label: "Site", value: identity.website },
  ]);
}
export function quoteDocument(input: {
  identity?: DocumentIdentity; number: string; version: number; issuedAt?: string; validUntil?: string;
  client: string; clientDocument?: string; address?: string; description?: string;
  items: Array<{ description: string; quantity: number; unit: string; unitPriceCents: number; discountCents: number; totalCents: number }>;
  subtotalCents: number; discountCents: number; surchargeCents: number; totalCents: number;
  paymentTerms?: string; deadline?: string; warranty?: string; notes?: string; terms?: string;
}): ProfessionalDocumentData {
  return {
    type: "QUOTE", title: "Orçamento", number: input.number, version: input.version, identity: input.identity,
    issuedAt: input.issuedAt,
    fields: visibleDocumentFields([
      { label: "Cliente", value: input.client }, { label: "CPF ou CNPJ", value: input.clientDocument ? formatCpfCnpj(input.clientDocument) : undefined },
      { label: "Endereço", value: input.address }, { label: "Emissão", value: input.issuedAt ? formatDateBR(input.issuedAt) : undefined },
      { label: "Válido Até", value: input.validUntil ? formatDateBR(input.validUntil) : undefined },
    ]),
    sections: [
      { title: "Descrição", text: input.description },
      { title: "Itens", table: { columns: ["Descrição", "Quantidade", "Unidade", "Valor Unitário", "Desconto", "Total"], rows: input.items.map((item) => [item.description, String(item.quantity).replace(".", ","), item.unit, formatCurrencyBRLFromCents(item.unitPriceCents), formatCurrencyBRLFromCents(item.discountCents), formatCurrencyBRLFromCents(item.totalCents)]) } },
      { title: "Totais", table: { columns: ["Subtotal", "Desconto", "Acréscimo", "Valor Final"], rows: [[formatCurrencyBRLFromCents(input.subtotalCents), formatCurrencyBRLFromCents(input.discountCents), formatCurrencyBRLFromCents(input.surchargeCents), formatCurrencyBRLFromCents(input.totalCents)]] } },
      { title: "Condições", text: [input.paymentTerms, input.deadline, input.warranty, input.notes, input.terms].filter(Boolean).join("\n") },
    ],
    signatureLabels: ["Responsável pela Empresa", "Cliente"],
  };
}
export function serviceOrderDocument(input: { identity?: DocumentIdentity; number: string; client: string; address?: string; equipment?: string; issue?: string; service: string; technician?: string; team?: string; schedule?: string; checklist?: string[]; materials?: string[]; notes?: string; occurredAt?: string }): ProfessionalDocumentData {
  return { type: "SERVICE_ORDER", title: "Ordem de Serviço", number: input.number, identity: input.identity,
    fields: visibleDocumentFields([{ label: "Cliente", value: input.client }, { label: "Endereço", value: input.address }, { label: "Equipamento", value: input.equipment }, { label: "Técnico", value: input.technician }, { label: "Equipe", value: input.team }, { label: "Agenda", value: input.schedule }, { label: "Data e Hora", value: input.occurredAt ? formatDateTimeBR(input.occurredAt) : undefined }]),
    sections: [{ title: "Problema Relatado", text: input.issue }, { title: "Serviço Solicitado", text: input.service }, { title: "Checklist", text: input.checklist?.join("\n") }, { title: "Materiais", text: input.materials?.join("\n") }, { title: "Observações", text: input.notes }],
    signatureLabels: ["Assinatura do Cliente", "Assinatura do Técnico"] };
}
export function technicalReportDocument(input: { identity?: DocumentIdentity; number: string; equipment: string; initialSituation?: string; issue: string; diagnosis: string; measurements?: string[]; services: string[]; materials?: string[]; tests?: string[]; finalSituation?: string; recommendations?: string; nextMaintenance?: string; responsible?: string }): ProfessionalDocumentData {
  return { type: "TECHNICAL_REPORT", title: "Relatório Técnico", number: input.number, identity: input.identity,
    fields: visibleDocumentFields([{ label: "Equipamento", value: input.equipment }, { label: "Responsável Técnico", value: input.responsible }]),
    sections: [{ title: "Situação Inicial", text: input.initialSituation }, { title: "Problema", text: input.issue }, { title: "Diagnóstico", text: input.diagnosis }, { title: "Medições", text: input.measurements?.join("\n") }, { title: "Serviços Executados", text: input.services.join("\n") }, { title: "Materiais e Peças", text: input.materials?.join("\n") }, { title: "Testes", text: input.tests?.join("\n") }, { title: "Situação Final", text: input.finalSituation }, { title: "Recomendações", text: input.recommendations }, { title: "Próxima Manutenção", text: input.nextMaintenance }],
    signatureLabels: ["Responsável Técnico", "Cliente"] };
}
