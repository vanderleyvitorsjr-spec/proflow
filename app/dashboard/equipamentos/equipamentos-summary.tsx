import { MetricItem, MetricStrip } from "@/components/ui/metric-strip";
const money = (c: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c / 100);
export function EquipamentosSummary({
  total,
  critical,
  maintenance,
  available,
  patrimonialValueCents,
}: {
  total: number;
  critical: number;
  maintenance: number;
  available: number;
  patrimonialValueCents: number;
}) {
  return (
    <MetricStrip className="sm:grid-cols-2 xl:grid-cols-5">
      <MetricItem label="Cadastrados" value={String(total)} tone="info" />
      <MetricItem label="Críticos" value={String(critical)} tone="danger" />
      <MetricItem label="Em manutenção" value={String(maintenance)} tone="warning" />
      <MetricItem label="Disponíveis" value={String(available)} tone="success" />
      <MetricItem
        label="Valor patrimonial"
        value={money(patrimonialValueCents)}
        tone="violet"
      />
    </MetricStrip>
  );
}
