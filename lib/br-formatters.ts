const LOWERCASE_CONNECTORS = new Set(["da", "das", "de", "do", "dos", "e"]);
const UPPERCASE_TOKENS = new Set([
  "ltda",
  "mei",
  "epp",
  "sa",
  "s.a.",
  "cpf",
  "cnpj",
  "crea",
  "cau",
  "art",
  "pmoc",
  "hvac",
]);

export function onlyDigits(value: string | undefined | null): string {
  return String(value ?? "").replace(/\D/g, "");
}

export function normalizeProperName(value: string | undefined | null): string {
  const cleaned = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
  if (!cleaned) return "";
  return cleaned
    .split(" ")
    .map((token, index) => {
      if (index > 0 && LOWERCASE_CONNECTORS.has(token)) return token;
      if (UPPERCASE_TOKENS.has(token))
        return token === "s.a." ? "S.A." : token.toUpperCase();
      return token
        .split(/([-'])/)
        .map((part) =>
          /[-']/.test(part)
            ? part
            : part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1),
        )
        .join("");
    })
    .join(" ");
}

export function normalizeUpperCode(value: string | undefined | null): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("pt-BR");
}

export function formatBrazilianPhone(value: string | undefined | null): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  const area = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${area}) ${rest}`;
  if (digits.length <= 10) return `(${area}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${area}) ${rest.slice(0, 1)} ${rest.slice(1, 5)}-${rest.slice(5)}`;
}

export function formatCpf(value: string | undefined | null): string {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function formatCnpj(value: string | undefined | null): string {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatCpfCnpj(value: string | undefined | null): string {
  return onlyDigits(value).length <= 11 ? formatCpf(value) : formatCnpj(value);
}

export function maskCpf(value: string | undefined | null): string {
  const formatted = formatCpf(value);
  if (onlyDigits(value).length !== 11) return formatted || "Não informado";
  return `***.${formatted.slice(4, 11)}-**`;
}

export function formatCep(value: string | undefined | null): string {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");
}

function allEqual(value: string): boolean {
  return /^([0-9])\1+$/.test(value);
}

export function isValidCpf(value: string | undefined | null): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || allEqual(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === Number(cpf[10]);
}

export function isValidCnpj(value: string | undefined | null): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || allEqual(cnpj)) return false;
  const calculate = (length: number) => {
    let sum = 0;
    let weight = length - 7;
    for (let i = 0; i < length; i++) {
      sum += Number(cnpj[i]) * weight--;
      if (weight === 1) weight = 9;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return calculate(12) === Number(cnpj[12]) && calculate(13) === Number(cnpj[13]);
}

export function formatCurrencyBRLFromCents(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value / 100,
  );
}

export function formatNumberBR(value: number, minimumFractionDigits = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(value);
}

export function formatPercentageFromBasisPoints(value: number): string {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value / 100)}%`;
}

export function formatDateBR(value: string | undefined | null): string {
  if (!value) return "Não informado";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function formatDateTimeBR(value: string | undefined | null): string {
  if (!value) return "Não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return `${new Intl.DateTimeFormat("pt-BR").format(date)} às ${new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date)}`;
}

export function normalizeSearchText(value: string | undefined | null): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePhoneDigits(value: string | undefined | null): string {
  return onlyDigits(value).slice(0, 11);
}

export function normalizeCpfCnpj(value: string | undefined | null): string {
  return onlyDigits(value).slice(0, 14);
}

export function parseCurrencyBRToCents(
  value: string | number | undefined | null,
): number {
  if (typeof value === "number") return Math.round(value * 100);
  const cleaned = String(value ?? "").trim();
  if (!cleaned) return 0;
  const normalized = cleaned
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function formatCurrencyInputBR(valueInCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valueInCents / 100);
}

export function formatTimeBR(value: string | undefined | null): string {
  if (!value) return "Não informado";
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
    date,
  );
}
