import { z } from "zod";
const date = z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.");
export const equipmentFormSchema = z
  .object({
    internalCode: z.string().trim().min(2, "Informe o código usado para identificar o equipamento."),
    name: z.string().trim().min(2, "Informe o nome do equipamento."),
    description: z.string().trim(),
    assetType: z.enum([
      "TECHNICAL_EQUIPMENT",
      "TOOL",
      "VEHICLE",
      "COMPUTER",
      "LIGHTING",
      "AUDIO",
      "MEASUREMENT_INSTRUMENT",
      "MACHINE",
      "OTHER",
    ]),
    category: z.string().trim().min(2, "Informe o grupo do equipamento."),
    manufacturer: z.string().trim(),
    model: z.string().trim(),
    serialNumber: z.string().trim(),
    patrimonyNumber: z.string().trim(),
    ownership: z.enum(["COMPANY", "CUSTOMER", "THIRD_PARTY"]),
    responsible: z.string().trim(),
    locationName: z.string().trim().min(2, "Informe onde o equipamento fica guardado ou instalado."),
    locationRoom: z.string().trim(),
    locationContainer: z.string().trim(),
    locationDescription: z.string().trim(),
    acquisitionDate: date,
    acquisitionValue: z.string().trim().default("0,00"),
    supplier: z.string().trim(),
    invoiceNumber: z.string().trim(),
    purchaseReference: z.string().trim(),
    acquisitionNotes: z.string().trim(),
    depreciationMode: z.enum(["LINEAR", "NONE"]),
    depreciationStartDate: date,
    usefulLifeMonths: z.coerce.number().int().nonnegative(),
    residualValue: z.string().trim().default("0,00"),
    status: z.enum([
      "AVAILABLE",
      "IN_USE",
      "UNDER_MAINTENANCE",
      "INACTIVE",
      "RETIRED",
      "LOST",
    ]),
    condition: z.enum(["GOOD", "ATTENTION", "DAMAGED", "UNUSABLE"]),
    notes: z.string().trim(),
    photoMetadata: z.string(),
    documentMetadata: z.string(),
  })
  .superRefine((v, c) => {
    if (
      v.depreciationMode === "LINEAR" &&
      (!v.depreciationStartDate || v.usefulLifeMonths < 1)
    )
      c.addIssue({
        code: "custom",
        path: ["usefulLifeMonths"],
        message: "Informe início e vida útil da depreciação linear.",
      });
  });
export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

export const maintenanceFormSchema = z.object({
  type: z.enum(["PREVENTIVE", "CORRECTIVE"]),
  title: z.string().trim().min(2, "Informe o título da manutenção."),
  description: z.string().trim(),
  supplier: z.string().trim(),
  cost: z.string().trim().default("0,00"),
  scheduledAt: z.string().min(1, "Informe a data programada."),
  nextMaintenanceAt: z.string().optional().default(""),
  serviceOrderId: z.string().optional().default(""),
  responsible: z.string().trim(),
  notes: z.string().trim(),
});
export type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;

export const warrantyFormSchema = z
  .object({
    startDate: date,
    endDate: date,
    supplier: z.string().trim(),
    description: z.string().trim(),
    documentReference: z.string().trim(),
    notes: z.string().trim(),
  })
  .superRefine((value, context) => {
    if (value.startDate && value.endDate && value.endDate < value.startDate)
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "O fim da garantia deve ser posterior ao início.",
      });
  });
export type WarrantyFormValues = z.infer<typeof warrantyFormSchema>;
export const equipmentFinancialFormSchema = z.object({
  nature: z.enum(["INVESTMENT", "EXPENSE"]),
  accountId: z.string().min(1, "Selecione a conta."),
  competenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a competência."),
  firstDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe o vencimento."),
  installmentCount: z.coerce.number().int().min(1).max(120),
  notes: z.string().trim(),
  payNow: z.boolean().default(false),
  paymentMethod: z.string().trim().default("Transferência"),
});
export type EquipmentFinancialFormValues = z.infer<typeof equipmentFinancialFormSchema>;
