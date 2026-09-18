import { formatCpfCnpj, formatCurrencyBRLFromCents, formatDateBR, formatDateTimeBR, formatBrazilianPhone } from "../../lib/br-formatters";

export type ProfessionalDocumentType =
  | "QUOTE" | "COMMERCIAL_PROPOSAL" | "SERVICE_ORDER" | "TECHNICAL_REPORT"
  | "SERVICE_CHECKLIST" | "SIMPLIFIED_REPORT" | "RECEIPT" | "PURCHASE_ORDER"
  | "QUOTATION" | "EQUIPMENT_RECORD" | "MAINTENANCE_HISTORY" | "DELIVERY_TERM"
  | "WARRANTY_TERM" | "EXECUTION_RECEIPT";

export interface DocumentIdentity {
  logoUrl?: string; companyName?: string; legalName?: string; document?: string; phone?: string; whatsapp?: string; email?: string;
  address?: string; website?: string; primaryColor?: string; footer?: string; signature?: string;
  technicalResponsible?: string; professionalRegistration?: string;
}
export interface DocumentField { label: string; value?: string; }
export interface DocumentTable { columns: string[]; rows: string[][]; }
export interface ProfessionalDocumentData {
  type: ProfessionalDocumentType; title: string; number?: string; version?: number;
  identity?: DocumentIdentity; fields: DocumentField[]; sections: Array<{ title: string; text?: string; table?: DocumentTable }>;
  issuedAt?: string; signatureLabels?: string[];
  headerFields?: DocumentField[]; clientFields?: DocumentField[]; highlightFields?: DocumentField[];
  financialSummary?: Array<{ label: string; value: string; featured?: boolean }>;
  nonFiscal?: boolean;
}

export function visibleDocumentFields(fields: DocumentField[]) {
  return fields.filter((field) => field.value?.trim());
}
export function documentIdentityFields(identity?: DocumentIdentity): DocumentField[] {
  if (!identity) return [];
  return visibleDocumentFields([
    { label: "Empresa", value: identity.companyName },
    { label: "Razão Social", value: identity.legalName && identity.legalName !== identity.companyName ? identity.legalName : undefined },
    { label: "CNPJ", value: identity.document ? formatCpfCnpj(identity.document) : undefined },
    { label: "Telefone", value: identity.phone ? formatBrazilianPhone(identity.phone) : undefined },
    { label: "WhatsApp", value: identity.whatsapp ? formatBrazilianPhone(identity.whatsapp) : undefined },
    { label: "E-mail", value: identity.email?.toLocaleLowerCase("pt-BR") },
    { label: "Endereço", value: identity.address }, { label: "Site", value: identity.website },
  ]);
}
export function quoteDocument(input: {
  identity?: DocumentIdentity; number: string; version: number; issuedAt?: string; validUntil?: string;
  client: string; clientDocument?: string; clientPhone?: string; clientEmail?: string; address?: string; description?: string;
  serviceType?: string;
  items: Array<{ description: string; notes?: string; quantity: number; unit: string; unitPriceCents: number; discountCents: number; totalCents: number }>;
  subtotalCents: number; discountCents: number; surchargeCents: number; totalCents: number;
  paymentTerms?: string; deadline?: string; warranty?: string; notes?: string; terms?: string;
}): ProfessionalDocumentData {
  return {
    type: "QUOTE", title: "Orçamento", number: input.number, version: input.version, identity: input.identity,
    issuedAt: input.issuedAt,
    headerFields: visibleDocumentFields([
      { label: "Data de emissão", value: input.issuedAt ? formatDateBR(input.issuedAt) : undefined },
      { label: "Validade", value: input.validUntil ? formatDateBR(input.validUntil) : undefined },
      { label: "Versão", value: String(input.version) },
    ]),
    clientFields: visibleDocumentFields([
      { label: "Nome / Razão Social", value: input.client },
      { label: "CPF ou CNPJ", value: input.clientDocument ? formatCpfCnpj(input.clientDocument) : undefined },
      { label: "Telefone", value: input.clientPhone ? formatBrazilianPhone(input.clientPhone) : undefined },
      { label: "E-mail", value: input.clientEmail }, { label: "Endereço", value: input.address },
    ]),
    highlightFields: visibleDocumentFields([
      { label: "Tipo de serviço", value: input.serviceType ? documentEnumLabel(input.serviceType) : undefined },
      { label: "Local de atendimento", value: input.address },
      { label: "Prazo de execução", value: input.deadline }, { label: "Garantia", value: input.warranty },
    ]),
    fields: [],
    financialSummary: [
      { label: "Subtotal", value: formatCurrencyBRLFromCents(input.subtotalCents) },
      { label: "Desconto", value: formatCurrencyBRLFromCents(input.discountCents) },
      { label: "Acréscimo", value: formatCurrencyBRLFromCents(input.surchargeCents) },
      { label: "Total do orçamento", value: formatCurrencyBRLFromCents(input.totalCents), featured: true },
    ],
    sections: [
      { title: "Descrição", text: input.description },
      { title: "Itens do orçamento", table: { columns: ["Descrição", "Qtd.", "Unidade", "Valor unitário", "Desconto", "Total"], rows: input.items.map((item) => [[item.description, item.notes].filter(Boolean).join("\n"), String(item.quantity).replace(".", ","), documentEnumLabel(item.unit), formatCurrencyBRLFromCents(item.unitPriceCents), formatCurrencyBRLFromCents(item.discountCents), formatCurrencyBRLFromCents(item.totalCents)]) } },
      { title: "Condições comerciais", text: input.paymentTerms },
      { title: "Observações", text: [input.notes, input.terms].filter(Boolean).join("\n") },
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
export function receiptDocument(input: {
  identity?: DocumentIdentity; number: string; receivedFrom: string; clientDocument?: string;
  clientPhone?: string; clientEmail?: string;
  amountCents: number; description: string; paymentMethod?: string; paymentReference?: string;
  installment?: string; serviceOrder?: string; paidAt: string; notes?: string;
}): ProfessionalDocumentData {
  return {
    type: "RECEIPT", title: "Recibo de Pagamento", number: input.number,
    identity: input.identity, issuedAt: input.paidAt, nonFiscal: true,
    headerFields: [{ label: "Data de emissão", value: formatDateBR(input.paidAt) }],
    clientFields: visibleDocumentFields([
      { label: "Nome / Razão Social", value: input.receivedFrom },
      { label: "CPF ou CNPJ", value: input.clientDocument ? formatCpfCnpj(input.clientDocument) : undefined },
      { label: "Telefone", value: input.clientPhone ? formatBrazilianPhone(input.clientPhone) : undefined },
      { label: "E-mail", value: input.clientEmail },
    ]),
    highlightFields: visibleDocumentFields([
      { label: "Data do recebimento", value: formatDateBR(input.paidAt) },
      { label: "Forma de pagamento", value: input.paymentMethod },
      { label: "Parcela", value: input.installment },
      { label: "Ordem de Serviço", value: input.serviceOrder },
      { label: "Identificação", value: input.paymentReference },
    ]),
    fields: [],
    financialSummary: [{ label: "Total recebido", value: formatCurrencyBRLFromCents(input.amountCents), featured: true }],
    sections: [
      { title: "Referência", text: input.description },
      { title: "Declaração", text: "Declaramos ter recebido do cliente acima identificado o valor indicado neste recibo, referente aos serviços descritos neste documento." },
      { title: "Observações", text: input.notes },
      { title: "Natureza do documento", text: "Documento não fiscal. Este recibo comprova o pagamento indicado e não substitui documento fiscal quando sua emissão for legalmente exigida." },
    ],
    signatureLabels: [input.identity?.signature || "Responsável pela Empresa", input.receivedFrom],
  };
}

export function documentEnumLabel(value: string): string {
  const labels: Record<string, string> = {
    SERVICE: "Serviço", MATERIAL: "Material", UNIT: "Unidade", HOUR: "Hora",
    DAY: "Dia", METER: "Metro", SQUARE_METER: "m²", KILOGRAM: "Quilograma",
    LITER: "Litro", BOX: "Caixa", ROLL: "Rolo", SET: "Conjunto", OTHER: "Outro",
    CLIMATIZATION: "Climatização", ELECTRICAL: "Elétrica", IT: "T.I.",
    PREVENTIVE: "Manutenção preventiva", CORRECTIVE: "Manutenção corretiva", INSTALLATION: "Instalação",
  };
  return labels[value] ?? value;
}
export function technicalReportDocument(input: { identity?: DocumentIdentity; number: string; equipment: string; initialSituation?: string; issue: string; diagnosis: string; measurements?: string[]; services: string[]; materials?: string[]; tests?: string[]; finalSituation?: string; recommendations?: string; nextMaintenance?: string; responsible?: string }): ProfessionalDocumentData {
  return { type: "TECHNICAL_REPORT", title: "Relatório Técnico", number: input.number, identity: input.identity,
    fields: visibleDocumentFields([{ label: "Equipamento", value: input.equipment }, { label: "Responsável Técnico", value: input.responsible }]),
    sections: [{ title: "Situação Inicial", text: input.initialSituation }, { title: "Problema", text: input.issue }, { title: "Diagnóstico", text: input.diagnosis }, { title: "Medições", text: input.measurements?.join("\n") }, { title: "Serviços Executados", text: input.services.join("\n") }, { title: "Materiais e Peças", text: input.materials?.join("\n") }, { title: "Testes", text: input.tests?.join("\n") }, { title: "Situação Final", text: input.finalSituation }, { title: "Recomendações", text: input.recommendations }, { title: "Próxima Manutenção", text: input.nextMaintenance }],
    signatureLabels: ["Responsável Técnico", "Cliente"] };
}
