"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/lib/auth/context";
import { normalizeEmail, normalizeProperName, normalizeUpperCode, onlyDigits, isValidCnpj, isValidCpf } from "@/lib/br-formatters";

export type OnboardingState = { error?: string };
const schema = z.object({
  companyName: z.string().trim().min(2, "Informe o nome da empresa."),
  tradeName: z.string().trim().optional(),
  document: z.string().transform(onlyDigits).refine((v) => !v || (v.length === 11 ? isValidCpf(v) : isValidCnpj(v)), "Informe um CPF ou CNPJ válido."),
  companyPhone: z.string().transform(onlyDigits).refine((v) => v.length === 10 || v.length === 11, "Informe um telefone válido."),
  companyEmail: z.string().email("Informe um e-mail válido."),
  zipCode: z.string().transform(onlyDigits).refine((v) => v.length === 8, "Informe um CEP válido."),
  street: z.string().min(2, "Informe o endereço."),
  addressNumber: z.string().min(1, "Informe o número."),
  complement: z.string().optional(),
  district: z.string().min(2, "Informe o bairro."),
  city: z.string().min(2, "Informe a cidade."),
  state: z.string().length(2, "Informe a UF."),
  ownerName: z.string().min(2, "Informe o nome completo."),
  ownerPhone: z.string().transform(onlyDigits).refine((v) => v.length === 10 || v.length === 11, "Informe o telefone do proprietário."),
  jobTitle: z.string().optional(),
});
export async function bootstrapCompanyAction(_: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const authUser = await requireAuthenticatedUser();
  const existing = await prisma.usuario.findUnique({ where: { authUserId: authUser.id } });
  if (existing) redirect("/dashboard");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const v = parsed.data;
  await prisma.$transaction(async (tx) => {
    const company = await tx.empresa.create({
      data: {
        companyId: randomUUID(), name: normalizeProperName(v.tradeName || v.companyName),
        legalName: normalizeProperName(v.companyName), document: v.document || null,
        email: normalizeEmail(v.companyEmail), phone: v.companyPhone, zipCode: v.zipCode,
        street: normalizeProperName(v.street), addressNumber: v.addressNumber,
        complement: normalizeProperName(v.complement), district: normalizeProperName(v.district),
        city: normalizeProperName(v.city), state: normalizeUpperCode(v.state),
      },
    });
    await tx.usuario.create({
      data: {
        companyId: company.id, authUserId: authUser.id, name: normalizeProperName(v.ownerName),
        email: normalizeEmail(authUser.email ?? v.companyEmail), phone: v.ownerPhone,
        jobTitle: normalizeProperName(v.jobTitle), role: "OWNER", status: "ACTIVE",
        lastLoginAt: new Date(),
      },
    });
  });
  redirect("/dashboard");
}
