import { Badge } from "@/components/ui/badge";
import type { EquipmentFinancialReconciliationStatus } from "./equipamentos-types";
export function EquipmentFinancialDivergences({
  status,
}: {
  status: EquipmentFinancialReconciliationStatus | null;
}) {
  if (!status || status === "MATCHED") return null;
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      <div className="flex items-center gap-2">
        <Badge variant="warning">Divergência</Badge>
        <strong>{status}</strong>
      </div>
      <p className="mt-1">
        Nenhum pagamento ou parcela foi alterado automaticamente. Escolha explicitamente
        uma ação de reconciliação.
      </p>
    </div>
  );
}
