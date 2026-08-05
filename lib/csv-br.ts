export function neutralizeSpreadsheetFormula(value: unknown) {
  const text = String(value ?? "");
  return /^[=+\-@]/.test(text.trimStart()) ? `'${text}` : text;
}

const escapeCsvCell = (value: unknown) =>
  `"${neutralizeSpreadsheetFormula(value).replaceAll('"', '""')}"`;

/** Gera CSV UTF-8 compatível com o Excel em português do Brasil. */
export function toBrazilianCsv(rows: readonly (readonly unknown[])[]) {
  return `\uFEFF${rows
    .map((row) => row.map(escapeCsvCell).join(";"))
    .join("\r\n")}`;
}
