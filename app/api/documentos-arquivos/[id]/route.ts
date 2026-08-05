import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserContext } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getCurrentUserContext();
  if (!context) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;
  const file = await prisma.companyStoredFile.findFirst({ where: { id, companyId: context.companyId, deletedAt: null } });
  if (!file) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from(file.bucket ?? "proflow-private").createSignedUrl(file.storagePath, 60, { download: file.originalName ?? file.name });
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Não foi possível gerar o acesso ao arquivo." }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
