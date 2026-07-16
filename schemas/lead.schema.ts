import { z } from "zod";

const digitsOnly = (value: string) => value.replace(/\D/g, "");

export const leadSchema = z
  .object({
    name: z.string().trim().min(3, "Informe o nome ou razão social."),
    type: z.enum(["INDIVIDUAL", "COMPANY"], {
      error: "Selecione o tipo de pessoa.",
    }),
    document: z.string().trim().min(11, "Informe CPF ou CNPJ."),
    phone: z.string().trim().min(14, "Informe um telefone válido."),
    whatsapp: z.string().trim().min(14, "Informe um WhatsApp válido."),
    email: z.email("Informe um e-mail válido."),
    address: z.string().trim().min(5, "Informe o endereço."),
    city: z.string().trim().min(2, "Informe a cidade."),
    state: z.string().trim().length(2, "Use a UF com 2 letras."),
    zipCode: z.string().trim().min(9, "Informe um CEP válido."),
    source: z.string().trim().min(2, "Informe a origem do lead."),
    serviceInterest: z.string().trim().min(2, "Informe o serviço de interesse."),
    salesOwner: z.string().trim().min(2, "Informe o responsável comercial."),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"], {
      error: "Selecione a prioridade.",
    }),
    estimatedValue: z.coerce
      .number("Informe um valor estimado.")
      .min(0, "O valor estimado não pode ser negativo."),
    contactDate: z.string().min(1, "Informe a data de contato."),
    notes: z.string().trim().min(3, "Informe uma observação."),
  })
  .superRefine((data, ctx) => {
    const documentLength = digitsOnly(data.document).length;

    if (data.type === "INDIVIDUAL" && documentLength !== 11) {
      ctx.addIssue({
        code: "custom",
        path: ["document"],
        message: "CPF deve conter 11 dígitos.",
      });
    }

    if (data.type === "COMPANY" && documentLength !== 14) {
      ctx.addIssue({
        code: "custom",
        path: ["document"],
        message: "CNPJ deve conter 14 dígitos.",
      });
    }
  });

export type LeadFormInput = z.input<typeof leadSchema>;
export type LeadFormValues = z.output<typeof leadSchema>;
