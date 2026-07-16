import { randomUUID } from "crypto";
import { ServiceOrderChecklist, ServiceOrderChecklistItem } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface CreateServiceOrderChecklistExecutionInput {
  companyId: string;
  serviceOrderId: string;
  checklistTemplateId: string;
  assignedToUserId?: string;
}

export class ChecklistExecutionService {
  async createChecklistExecution(
    input: CreateServiceOrderChecklistExecutionInput,
  ): Promise<ServiceOrderChecklist & { items: ServiceOrderChecklistItem[] }> {
    const { companyId, serviceOrderId, checklistTemplateId, assignedToUserId } = input;

    if (!companyId || !serviceOrderId || !checklistTemplateId) {
      throw new Error("companyId, serviceOrderId and checklistTemplateId are required.");
    }

    const [serviceOrder, checklistTemplate, assignedUser] = await Promise.all([
      prisma.ordemServico.findFirst({
        where: { id: serviceOrderId, companyId },
      }),
      prisma.checklistTemplate.findFirst({
        where: { id: checklistTemplateId, companyId, deletedAt: null },
      }),
      assignedToUserId
        ? prisma.usuario.findFirst({ where: { id: assignedToUserId, companyId } })
        : Promise.resolve(null),
    ]);

    if (!serviceOrder) {
      throw new Error(
        "Service order not found or does not belong to the specified company.",
      );
    }

    if (!checklistTemplate) {
      throw new Error(
        "Checklist template not found, deleted, or does not belong to the specified company.",
      );
    }

    if (!checklistTemplate.isActive) {
      throw new Error("Checklist template is not active.");
    }

    if (assignedToUserId && !assignedUser) {
      throw new Error(
        "Assigned user not found or does not belong to the specified company.",
      );
    }

    const templateItems = await prisma.checklistTemplateItem.findMany({
      where: {
        checklistTemplateId,
        companyId,
        deletedAt: null,
      },
      orderBy: { position: "asc" },
    });

    if (templateItems.length === 0) {
      throw new Error("Checklist template has no active items.");
    }

    const templateItemIds = new Set(templateItems.map((item) => item.id));
    const parentItemIds = templateItems
      .map((item) => item.parentItemId)
      .filter((parentItemId): parentItemId is string => !!parentItemId);

    for (const parentItemId of parentItemIds) {
      if (!templateItemIds.has(parentItemId)) {
        throw new Error(
          "Checklist template contains inconsistent parent item references.",
        );
      }
    }

    const executedItemIdByTemplateItemId = new Map<string, string>();
    for (const templateItem of templateItems) {
      executedItemIdByTemplateItemId.set(templateItem.id, randomUUID());
    }

    const checklistItems = templateItems.map((templateItem) => ({
      id: executedItemIdByTemplateItemId.get(templateItem.id)!,
      checklistTemplateItemId: templateItem.id,
      parentItemId: templateItem.parentItemId
        ? executedItemIdByTemplateItemId.get(templateItem.parentItemId)!
        : null,
      titleSnapshot: templateItem.title,
      descriptionSnapshot: templateItem.description,
      itemTypeSnapshot: templateItem.itemType,
      position: templateItem.position,
      isRequired: templateItem.isRequired,
      expectedValueSnapshot: templateItem.expectedValue,
      minValueSnapshot: templateItem.minValue,
      maxValueSnapshot: templateItem.maxValue,
      unitSnapshot: templateItem.unit,
      optionsSnapshot: templateItem.options ?? undefined,
      company: {
        connect: {
          id: companyId,
        },
      },
    }));

    const checklist = await prisma.$transaction(async (tx) => {
      const createdChecklist = await tx.serviceOrderChecklist.create({
        data: {
          companyId,
          serviceOrderId,
          checklistTemplateId,
          checklistTemplateVersion: checklistTemplate.version,
          assignedToUserId,
          status: "PENDING",
          items: {
            create: checklistItems,
          },
        },
        include: {
          items: true,
        },
      });

      return createdChecklist;
    });

    return checklist;
  }
}

export const checklistExecutionService = new ChecklistExecutionService();
