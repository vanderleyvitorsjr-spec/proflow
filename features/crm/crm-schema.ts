import { z } from "zod";
import { crmStages } from "./crm-data";

const digits = (value: string) => value.replace(/\D/g, "");
const stageIds = crmStages.map((stage) => stage.id) as ["new", ...Array<"contacted" | "technical-visit" | "sent" | "negotiation" | "approved" | "lost">];

export const crmLeadSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome ou razão social."),
  type: z.enum(["INDIVIDUAL", "COMPANY"]),
  document: z.string().trim().optional().default(""),
  phone: z.string().trim().refine((value) => [10, 11].includes(digits(value).length), "Informe um telefone válido."),
  whatsapp: z.string().trim().optional().default("").refine((value) => !value || [10, 11].includes(digits(value).length), "Informe um WhatsApp válido."),
  email: z.union([z.literal(""), z.email("Informe um e-mail válido.")]),
  address: z.string().trim().min(3, "Informe o endereço."), city: z.string().trim().min(2, "Informe a cidade."),
  state: z.string().trim().length(2, "Informe a UF."), zipCode: z.string().trim().optional().default(""),
  source: z.string().trim().min(2, "Informe a origem."), serviceInterest: z.string().trim().min(2, "Informe o interesse."),
  salesOwner: z.string().trim().min(2, "Informe o responsável."), priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  estimatedValue: z.coerce.number().min(0, "O valor não pode ser negativo."), contactDate: z.string().min(1, "Informe a data."),
  notes: z.string().trim().optional().default(""), stageId: z.enum(stageIds),
}).superRefine((value, context) => {
  const length = digits(value.document).length;
  if (length && ![11, 14].includes(length)) context.addIssue({ code: "custom", path: ["document"], message: "Informe um CPF ou CNPJ válido." });
});

export type CrmLeadFormInput = z.input<typeof crmLeadSchema>;
export type CrmLeadFormValues = z.output<typeof crmLeadSchema>;
