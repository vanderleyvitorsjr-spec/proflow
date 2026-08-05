import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserContext } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getCurrentUserContext();
  if (!context) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;
  const attachment = await prisma.companyStoredFile.findFirst({ where: { id, companyId: context.companyId, deletedAt: null } });
  if (!attachment) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from(attachment.bucket ?? "proflow-private").createSignedUrl(attachment.storagePath, 60);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Não foi possível abrir o arquivo." }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
