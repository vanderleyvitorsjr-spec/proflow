import { z } from "zod";

const digits = (value: string) => value.replace(/\D/g, "");

export const clientSchema = z
  .object({
    name: z.string().trim().min(3, "Informe um nome com pelo menos 3 caracteres."),
    document: z.string().trim().optional().default(""),
    phone: z.string().trim().refine((value) => [10, 11].includes(digits(value).length), "Informe um telefone válido."),
    whatsapp: z.string().trim().optional().default("").refine((value) => !value || [10, 11].includes(digits(value).length), "Informe um WhatsApp válido."),
    email: z.union([z.literal(""), z.email("Informe um e-mail válido.")]),
    type: z.enum(["RESIDENTIAL", "COMPANY", "CONDOMINIUM"]),
    segment: z.enum(["CLIMATIZATION", "ELECTRICAL", "BOTH"]),
    status: z.enum(["ACTIVE", "RECURRING", "ATTENTION", "INACTIVE"]),
    street: z.string().trim().min(3, "Informe o endereço."),
    number: z.string().trim().optional().default(""),
    complement: z.string().trim().optional().default(""),
    district: z.string().trim().optional().default(""),
    city: z.string().trim().min(2, "Informe a cidade."),
    state: z.string().trim().length(2, "Informe a UF com 2 letras."),
    zipCode: z.string().trim().optional().default(""),
    notes: z.string().trim().optional().default(""),
  })
  .superRefine((value, context) => {
    const documentLength = digits(value.document);
    if (documentLength && ![11, 14].includes(documentLength.length)) {
      context.addIssue({ code: "custom", path: ["document"], message: "Informe um CPF ou CNPJ válido." });
    }
  });

export type ClientFormInput = z.input<typeof clientSchema>;
export type ClientFormValues = z.output<typeof clientSchema>;
