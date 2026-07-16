import { z } from "zod";
import { isValidCnpj, isValidCpf, onlyDigits } from "@/lib/br-formatters";

export const supplierCategories = [
  "CLIMATIZATION",
  "ELECTRICAL",
  "REFRIGERATION",
  "TOOLS",
  "SAFETY",
  "LOGISTICS",
  "SERVICES",
  "OTHER",
] as const;

export const supplierSchema = z
  .object({
    legalName: z.string().trim().min(3, "Informe a razão social ou nome completo."),
    tradeName: z.string().trim().min(2, "Informe o nome de exibição."),
    document: z.string().trim().optional().default(""),
    stateRegistration: z.string().trim().optional().default(""),
    municipalRegistration: z.string().trim().optional().default(""),
    contactName: z.string().trim().optional().default(""),
    phone: z.string().trim().optional().default(""),
    whatsapp: z.string().trim().optional().default(""),
    email: z.union([z.literal(""), z.email("Informe um e-mail válido.")]),
    website: z.string().trim().optional().default(""),
    zipCode: z.string().trim().optional().default(""),
    street: z.string().trim().optional().default(""),
    number: z.string().trim().optional().default(""),
    complement: z.string().trim().optional().default(""),
    district: z.string().trim().optional().default(""),
    city: z.string().trim().optional().default(""),
    state: z.string().trim().optional().default(""),
    categories: z.array(z.enum(supplierCategories)).min(1, "Selecione pelo menos uma categoria."),
    paymentTerms: z.string().trim().optional().default(""),
    preferredPaymentMethod: z.string().trim().optional().default(""),
    deliveryLeadTimeDays: z.coerce.number().int().min(0).max(365).optional(),
    minimumOrderCents: z.coerce.number().int().min(0).optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
    status: z.enum(["ACTIVE", "ATTENTION", "INACTIVE"]),
    notes: z.string().trim().optional().default(""),
  })
  .superRefine((value, context) => {
    const document = onlyDigits(value.document);
    if (document && !((document.length === 11 && isValidCpf(document)) || (document.length === 14 && isValidCnpj(document)))) {
      context.addIssue({ code: "custom", path: ["document"], message: "Informe um CPF ou CNPJ válido." });
    }
    for (const key of ["phone", "whatsapp"] as const) {
      const digits = onlyDigits(value[key]);
      if (digits && ![10, 11].includes(digits.length)) {
        context.addIssue({ code: "custom", path: [key], message: "Informe um telefone com DDD válido." });
      }
    }
    const cep = onlyDigits(value.zipCode);
    if (cep && cep.length !== 8) context.addIssue({ code: "custom", path: ["zipCode"], message: "Informe um CEP com 8 dígitos." });
    if (value.state && value.state.length !== 2) context.addIssue({ code: "custom", path: ["state"], message: "Informe a UF com 2 letras." });
  });

export type SupplierFormValues = z.output<typeof supplierSchema>;
