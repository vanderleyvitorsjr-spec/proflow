"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OrdemMediaKind } from "./ordens-types";

const BUCKET = "proflow-private";
const accepted = new Set(["image/jpeg", "image/png", "image/webp"]);

async function ensureBucket() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await admin.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: [...accepted],
    });
    if (error && !error.message.toLowerCase().includes("already")) throw error;
  }
  return admin;
}

function metadata(kind: OrdemMediaKind) {
  if (kind === "CLIENT_SIGNATURE") return { type: "SIGNATURE" as const, category: "CUSTOMER_SIGNATURE" as const };
  if (kind === "TECHNICIAN_SIGNATURE") return { type: "SIGNATURE" as const, category: "TECHNICAL_REPORT" as const };
  if (kind === "BEFORE") return { type: "IMAGE" as const, category: "BEFORE_SERVICE" as const };
  if (kind === "AFTER") return { type: "IMAGE" as const, category: "AFTER_SERVICE" as const };
  return { type: "IMAGE" as const, category: "GENERAL" as const };
}

export async function listOrderEvidenceAction(serviceOrderId: string) {
  const context = await requirePermission("ORDERS_VIEW");
  const items = await prisma.companyStoredFile.findMany({
    where: { companyId: context.companyId, entityType: "SERVICE_ORDER", entityId: serviceOrderId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return items.map((item) => ({
    id: item.id,
    category: item.category ?? "GENERAL",
    fileName: item.originalName ?? item.name,
    mimeType: item.mimeType,
    size: Number(item.sizeBytes ?? 0),
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function uploadOrderEvidenceAction(formData: FormData) {
  const context = await requirePermission("ORDERS_UPDATE");
  const serviceOrderId = String(formData.get("serviceOrderId") ?? "");
  const kind = String(formData.get("kind") ?? "GENERAL") as OrdemMediaKind;
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Selecione um arquivo válido.");
  if (!accepted.has(file.type)) throw new Error("Use uma imagem JPG, PNG ou WEBP.");
  const max = kind.includes("SIGNATURE") ? 3 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > max) throw new Error(kind.includes("SIGNATURE") ? "A assinatura deve ter até 3 MB." : "A imagem deve ter até 10 MB.");

  const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${context.companyId}/ordens/${serviceOrderId}/${crypto.randomUUID()}-${safeName}`;
  const admin = await ensureBucket();
  const { error } = await admin.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Não foi possível enviar o arquivo: ${error.message}`);
  const mapped = metadata(kind);
  let createdId = "";
  try {
    const created = await prisma.companyStoredFile.create({
      data: {
      companyId: context.companyId,
      uploadedById: context.internalUserId,
      entityType: "SERVICE_ORDER",
      entityId: serviceOrderId,
      category: mapped.category,
      name: safeName,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: BigInt(file.size),
      bucket: BUCKET,
      storagePath: path,
      visibility: "COMPANY",
      metadata: { attachmentType: mapped.type, customerVisible: kind !== "TECHNICIAN_SIGNATURE" },
      },
    });
    createdId = created.id;
  } catch (cause) {
    await admin.storage.from(BUCKET).remove([path]);
    throw cause;
  }
  revalidatePath(`/dashboard/ordens/${serviceOrderId}`);
  return { id: createdId };
}

export async function deleteOrderEvidenceAction(id: string) {
  const context = await requirePermission("ORDERS_UPDATE");
  const attachment = await prisma.companyStoredFile.findFirst({ where: { id, companyId: context.companyId, deletedAt: null } });
  if (!attachment) throw new Error("Arquivo não encontrado.");
  const admin = createSupabaseAdminClient();
  await admin.storage.from(attachment.bucket ?? BUCKET).remove([attachment.storagePath]);
  await prisma.companyStoredFile.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath(`/dashboard/ordens/${attachment.entityId ?? ""}`);
}
