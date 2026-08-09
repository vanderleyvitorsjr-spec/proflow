import { z } from "zod";
export const ordemSchema = z.object({
  clientId: z.string().min(1, "Selecione o cliente que receberá o atendimento."), crmLeadId: z.string().optional().default(""), title: z.string().trim().min(3, "Informe o serviço que será executado."),
  description: z.string().trim().min(3, "Descreva o problema relatado ou o serviço solicitado."), category: z.enum(["CLIMATIZATION", "ELECTRICAL", "PREVENTIVE", "CORRECTIVE", "INSTALLATION"]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]), status: z.enum(["OPEN", "SCHEDULED", "IN_TRANSIT", "IN_PROGRESS", "WAITING_PART", "COMPLETED", "CANCELED", "OVERDUE"]),
  technician: z.string().trim().min(2, "Selecione quem será responsável pela execução."), address: z.string().trim().min(3, "Informe o endereço onde o serviço será realizado."), city: z.string().trim().min(2, "Informe a cidade do atendimento."), state: z.string().trim().length(2, "Informe a UF com duas letras."),
  scheduledDate: z.string().min(1, "Informe a data."), scheduledTime: z.string().min(1, "Informe o horário."), estimatedDurationMinutes: z.coerce.number().int().min(15, "Informe ao menos 15 minutos."),
  estimatedValue: z.coerce.number().min(0, "O valor não pode ser negativo."), notes: z.string().trim().optional().default(""),
  checklistText: z.string().trim().min(3, "Informe ao menos um item de checklist."), equipmentText: z.string().optional().default(""), materialsText: z.string().optional().default(""),
});
export type OrdemFormInput = z.input<typeof ordemSchema>;
export type OrdemFormValues = z.output<typeof ordemSchema>;
