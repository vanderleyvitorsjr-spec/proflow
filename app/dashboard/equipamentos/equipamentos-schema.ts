import { z } from "zod";
const date = z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.");
export const equipmentFormSchema = z
  .object({
    internalCode: z.string().trim().min(2, "Informe o código interno."),
    name: z.string().trim().min(2, "Informe o nome."),
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
    category: z.string().trim().min(2, "Informe a categoria."),
    manufacturer: z.string().trim(),
    model: z.string().trim(),
    serialNumber: z.string().trim(),
    patrimonyNumber: z.string().trim(),
    ownership: z.enum(["COMPANY", "CUSTOMER", "THIRD_PARTY"]),
    responsible: z.string().trim(),
    locationName: z.string().trim().min(2, "Informe a localização."),
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
