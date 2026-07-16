import type { ReportDataset } from "./relatorios-types";
const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
export function reportCsv(dataset: ReportDataset) {
  const rows: unknown[][] = [
    ["Relatório ProFlow"],
    ["Gerado em", new Date(dataset.generatedAt).toLocaleString("pt-BR")],
    ["Período", `${dataset.period.start} a ${dataset.period.end}`],
    ["Área", dataset.filters.area],
    [],
    ["Fontes"],
    ["Fonte", "Disponível", "Parcial", "Registros", "Atualização", "Avisos"],
  ];
  for (const status of dataset.sourceStatus)
    rows.push([
      status.source,
      status.available ? "Sim" : "Não",
      status.partial ? "Sim" : "Não",
      status.recordCount,
      status.updatedAt ? new Date(status.updatedAt).toLocaleString("pt-BR") : "",
      status.warnings.join(" | ") || status.error || "",
    ]);
  for (const section of dataset.sections) {
    rows.push(
      [],
      [section.title],
      ["Indicador", "Valor", "Valor anterior", "Variação (%)", "Status", "Descrição"],
    );
    for (const item of section.metrics)
      rows.push([
        item.title,
        item.formattedValue,
        item.previousValue ?? "",
        item.percentageChange ?? "Sem base comparável",
        item.status,
        item.description,
      ]);
    for (const ranking of section.rankings) {
      rows.push([], [ranking.title], ["Posição", "Item", "Valor"]);
      ranking.items.forEach((item, index) =>
        rows.push([index + 1, item.label, item.formattedValue]),
      );
    }
  }
  return `\uFEFF${rows.map((row) => row.map(escape).join(";")).join("\r\n")}`;
}
export function downloadReportCsv(dataset: ReportDataset) {
  if (
    !dataset.sections.some((section) =>
      section.metrics.some((metric) => metric.value !== undefined),
    )
  )
    throw new Error("Não há dados filtrados para exportar.");
  const blob = new Blob([reportCsv(dataset)], { type: "text/csv;charset=utf-8" }),
    url = URL.createObjectURL(blob),
    link = document.createElement("a"),
    date = dataset.generatedAt.slice(0, 10),
    area = dataset.filters.area.toLowerCase();
  link.href = url;
  link.download = `relatorio-${area}-${dataset.period.start}-a-${dataset.period.end}-${date}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
