"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET = "proflow-private";
const accepted = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

async function ensureBucket() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await admin.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 20 * 1024 * 1024 });
    if (error && !error.message.toLowerCase().includes("already")) throw error;
  }
  return admin;
}

export async function listStoredDocumentsAction() {
  const context = await requirePermission("ORDERS_VIEW");
  const files = await prisma.companyStoredFile.findMany({
    where: { companyId: context.companyId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return files.map((file) => ({
    id: file.id,
    name: file.originalName ?? file.name,
    mimeType: file.mimeType,
    size: Number(file.sizeBytes ?? 0),
    createdAt: file.createdAt.toISOString(),
    clientId: (file.metadata as { clientId?: string } | null)?.clientId ?? null,
    serviceOrderId: (file.metadata as { serviceOrderId?: string } | null)?.serviceOrderId ?? null,
  }));
}

export async function uploadStoredDocumentAction(formData: FormData) {
  const context = await requirePermission("ORDERS_UPDATE");
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Selecione um arquivo.");
  if (!accepted.has(file.type)) throw new Error("Use PDF, JPG, PNG, WEBP ou DOCX.");
  if (file.size > 20 * 1024 * 1024) throw new Error("O arquivo deve ter até 20 MB.");
  const clientId = String(formData.get("clientId") ?? "").trim() || null;
  const serviceOrderId = String(formData.get("serviceOrderId") ?? "").trim() || null;

  const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${context.companyId}/documentos/${crypto.randomUUID()}-${safeName}`;
  const admin = await ensureBucket();
  const { error } = await admin.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Não foi possível enviar o arquivo: ${error.message}`);
  let createdId = "";
  try {
    const created = await prisma.companyStoredFile.create({
      data: {
      companyId: context.companyId,
      uploadedById: context.internalUserId,
      entityType: serviceOrderId ? "SERVICE_ORDER" : clientId ? "CLIENT" : "DOCUMENT",
      entityId: serviceOrderId ?? clientId,
      category: "DOCUMENT",
      name: safeName,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: BigInt(file.size),
      bucket: BUCKET,
      storagePath: path,
      visibility: "COMPANY",
      metadata: { ...(clientId ? { clientId } : {}), ...(serviceOrderId ? { serviceOrderId } : {}) },
      },
    });
    createdId = created.id;
  } catch (cause) {
    await admin.storage.from(BUCKET).remove([path]);
    throw cause;
  }
  revalidatePath("/dashboard/documentos");
  return { id: createdId };
}

export async function deleteStoredDocumentAction(id: string) {
  const context = await requirePermission("ORDERS_UPDATE");
  const file = await prisma.companyStoredFile.findFirst({ where: { id, companyId: context.companyId, deletedAt: null } });
  if (!file) throw new Error("Arquivo não encontrado.");
  const admin = createSupabaseAdminClient();
  await admin.storage.from(file.bucket ?? BUCKET).remove([file.storagePath]);
  await prisma.companyStoredFile.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/dashboard/documentos");
}
