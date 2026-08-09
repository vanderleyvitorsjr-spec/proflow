import { z } from "zod";
import { stockUnitScales } from "./estoque-data";

const optionalText = z.string().trim().max(240).optional().default("");
export const stockItemFormSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome.").max(120),
    internalCode: z.string().trim().min(2, "Informe o código interno.").max(40),
    description: z.string().trim().max(500).default(""),
    category: z.enum([
      "REFRIGERATION",
      "ELECTRICAL",
      "SAFETY",
      "CONSUMABLES",
      "CLEANING",
      "OTHER",
    ]),
    unit: z.enum([
      "UNIT",
      "PAIR",
      "METER",
      "KILOGRAM",
      "LITER",
      "BOX",
      "PACKAGE",
      "ROLL",
    ]),
    unitScale: z.coerce.number().int().positive().max(1000000),
    barcode: optionalText,
    manufacturer: optionalText,
    minimumQuantity: z.coerce.number().nonnegative(),
    locationName: z.string().trim().min(2, "Informe a localização.").max(100),
    locationRoom: optionalText,
    locationContainer: optionalText,
    locationDescription: optionalText,
    supplierReference: optionalText,
    notes: z.string().trim().max(1000).optional().default(""),
  })
  .superRefine((value, context) => {
    if (value.unitScale !== stockUnitScales[value.unit])
      context.addIssue({
        code: "custom",
        path: ["unitScale"],
        message: `Use a escala ${stockUnitScales[value.unit]} para esta unidade.`,
      });
  });
export const stockMovementFormSchema = z.object({
  itemId: z.string().min(1, "Selecione o item."),
  type: z.enum(["ENTRY", "EXIT", "RETURN", "ADJUSTMENT_IN", "ADJUSTMENT_OUT", "LOSS"]),
  quantity: z.coerce.number().positive("Informe uma quantidade maior que zero."),
  unitCost: z.coerce.number().nonnegative().default(0),
  date: z.string().date(),
  reason: z.string().trim().min(3, "Informe o motivo.").max(200),
  notes: z.string().trim().max(1000).optional().default(""),
  originalMovementId: z.string().optional().default(""),
  useAverageCost: z.boolean().optional().default(false),
  confirmZeroCost: z.boolean().optional().default(false),
  allowNegativeAdjustment: z.boolean().optional().default(false),
});
export const stockReservationFormSchema = z.object({
  itemId: z.string().min(1),
  serviceOrderId: z.string().min(1, "Selecione a OS."),
  purpose: z.string().trim().min(3, "Informe a finalidade.").max(120),
  quantity: z.coerce.number().positive("Informe uma quantidade positiva."),
});
export const stockReservationOperationSchema = z.object({
  reservationId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  reason: z.string().trim().min(3).max(200),
  administrative: z.boolean().optional().default(false),
});
export const stockPurchaseFormSchema = z.object({
  supplierName: z.string().trim().min(2, "Informe o fornecedor."),
  supplierDocument: z.string().trim().max(30).optional().default(""),
  supplierPhone: z.string().trim().max(25).optional().default(""),
  supplierEmail: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .or(z.literal(""))
    .optional()
    .default(""),
  supplierNotes: z.string().trim().max(300).optional().default(""),
  documentNumber: z.string().trim().max(50).optional().default(""),
  purchaseDate: z.string().date(),
  expectedDate: z.string().optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
  items: z
    .array(
      z.object({
        stockItemId: z.string().min(1),
        quantity: z.coerce.number().positive(),
        unitCost: z.coerce.number().nonnegative(),
        notes: z.string().trim().max(200).optional().default(""),
      }),
    )
    .min(1, "Adicione ao menos um item."),
});
export const stockPurchaseReceiptSchema = z.object({
  purchaseId: z.string().min(1),
  items: z
    .array(
      z.object({
        purchaseItemId: z.string().min(1),
        quantity: z.coerce.number().nonnegative(),
      }),
    )
    .refine(
      (items) => items.some((item) => item.quantity > 0),
      "Informe uma quantidade para receber.",
    ),
});
export const stockPurchaseFinancialFormSchema = z.object({
  accountId: z.string().min(1),
  competenceDate: z.string().date(),
  firstDueDate: z.string().date(),
  installmentCount: z.coerce.number().int().min(1).max(120),
  notes: z.string().trim().max(500).optional().default(""),
});
export type StockItemFormValues = z.input<typeof stockItemFormSchema>;
export type StockMovementFormValues = z.input<typeof stockMovementFormSchema>;
export type StockReservationFormValues = z.input<typeof stockReservationFormSchema>;
export type StockReservationOperationValues = z.input<
  typeof stockReservationOperationSchema
>;
export type StockPurchaseFormValues = z.input<typeof stockPurchaseFormSchema>;
export type StockPurchaseReceiptValues = z.input<typeof stockPurchaseReceiptSchema>;
export type StockPurchaseFinancialFormValues = z.input<
  typeof stockPurchaseFinancialFormSchema
>;
