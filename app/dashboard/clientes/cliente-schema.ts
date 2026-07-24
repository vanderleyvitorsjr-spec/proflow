import { z } from "zod";
import { isValidCnpj, isValidCpf, onlyDigits } from "@/lib/br-formatters";

const digits = onlyDigits;

export const clientSchema = z
  .object({
    name: z.string().trim().min(3, "Informe o nome completo ou a razão social do cliente."),
    document: z.string().trim().optional().default(""),
    phone: z.string().trim().refine((value) => [10, 11].includes(digits(value).length), "Informe o telefone do cliente com DDD."),
    whatsapp: z.string().trim().optional().default("").refine((value) => !value || [10, 11].includes(digits(value).length), "Informe um WhatsApp válido."),
    email: z.union([z.literal(""), z.email("Informe um e-mail válido.")]),
    type: z.enum(["RESIDENTIAL", "COMPANY", "CONDOMINIUM"]),
    segment: z.enum(["CLIMATIZATION", "ELECTRICAL", "BOTH"]),
    status: z.enum(["ACTIVE", "RECURRING", "ATTENTION", "INACTIVE"]),
    street: z.string().trim().min(3, "Informe o endereço onde o cliente recebe atendimento."),
    number: z.string().trim().optional().default(""),
    complement: z.string().trim().optional().default(""),
    district: z.string().trim().optional().default(""),
    city: z.string().trim().min(2, "Informe a cidade."),
    state: z.string().trim().length(2, "Informe a UF com 2 letras."),
    zipCode: z.string().trim().optional().default(""),
    notes: z.string().trim().optional().default(""),
  })
  .superRefine((value, context) => {
    const document = digits(value.document);
    if (document && !((document.length === 11 && isValidCpf(document)) || (document.length === 14 && isValidCnpj(document)))) {
      context.addIssue({ code: "custom", path: ["document"], message: "Informe um CPF ou CNPJ válido." });
    }
    const zipCode = digits(value.zipCode);
    if (zipCode && zipCode.length !== 8) {
      context.addIssue({ code: "custom", path: ["zipCode"], message: "Informe um CEP válido." });
    }
  });

export type ClientFormInput = z.input<typeof clientSchema>;
export type ClientFormValues = z.output<typeof clientSchema>;
