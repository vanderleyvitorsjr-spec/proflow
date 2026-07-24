import { z } from "zod";
import { isValidCnpj, isValidCpf, onlyDigits } from "@/lib/br-formatters";
import { crmStages } from "./crm-data";

const digits = onlyDigits;
const stageIds = crmStages.map((stage) => stage.id) as ["new", ...Array<"contacted" | "technical-visit" | "sent" | "negotiation" | "approved" | "lost">];

export const crmLeadSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome ou razão social."),
  type: z.enum(["INDIVIDUAL", "COMPANY"]),
  document: z.string().trim().optional().default(""),
  phone: z.string().trim().refine((value) => [10, 11].includes(digits(value).length), "Informe o telefone do contato com DDD."),
  whatsapp: z.string().trim().optional().default("").refine((value) => !value || [10, 11].includes(digits(value).length), "Informe um WhatsApp válido."),
  email: z.union([z.literal(""), z.email("Informe um e-mail válido.")]),
  address: z.string().trim().min(3, "Informe o endereço onde poderá ocorrer o atendimento."), city: z.string().trim().min(2, "Informe a cidade do contato."),
  state: z.string().trim().length(2, "Informe a UF."), zipCode: z.string().trim().optional().default(""),
  source: z.string().trim().min(2, "Selecione como o contato conheceu a empresa."), serviceInterest: z.string().trim().min(2, "Informe o serviço de interesse."),
  salesOwner: z.string().trim().min(2, "Selecione quem será responsável pelo atendimento comercial."), priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  estimatedValue: z.coerce.number().min(0, "O valor não pode ser negativo."), contactDate: z.string().min(1, "Informe a data."),
  notes: z.string().trim().optional().default(""), stageId: z.enum(stageIds),
}).superRefine((value, context) => {
  const document = digits(value.document);
  if (document && !((document.length === 11 && isValidCpf(document)) || (document.length === 14 && isValidCnpj(document)))) context.addIssue({ code: "custom", path: ["document"], message: "Informe um CPF ou CNPJ válido." });
  const zipCode = digits(value.zipCode);
  if (zipCode && zipCode.length !== 8) context.addIssue({ code: "custom", path: ["zipCode"], message: "Informe um CEP válido." });
});

export type CrmLeadFormInput = z.input<typeof crmLeadSchema>;
export type CrmLeadFormValues = z.output<typeof crmLeadSchema>;
