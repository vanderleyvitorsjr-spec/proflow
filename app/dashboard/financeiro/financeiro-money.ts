import { FinancialDomainError } from "./financeiro-errors";
export function assertMoneyCents(value: number, allowNegative = false) {
  if (!Number.isSafeInteger(value) || (!allowNegative && value < 0))
    throw new FinancialDomainError("VALIDATION", "Informe um valor monetário válido.");
  return value;
}
export function parseBrazilianMoney(value: string) {
  const normalized = value
    .trim()
    .replace(/R\$\s?/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const decimal = Number(normalized);
  if (!Number.isFinite(decimal) || decimal < 0)
    throw new FinancialDomainError("VALIDATION", "Informe um valor monetário válido.");
  return assertMoneyCents(Math.round(decimal * 100));
}
export const formatMoneyCents = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export function distributeMoney(totalCents: number, parts: number) {
  assertMoneyCents(totalCents);
  if (!Number.isSafeInteger(parts) || parts < 1)
    throw new FinancialDomainError("VALIDATION", "Informe uma quantidade válida.");
  const base = Math.floor(totalCents / parts),
    remainder = totalCents % parts;
  return Array.from({ length: parts }, (_, index) => base + (index < remainder ? 1 : 0));
}
