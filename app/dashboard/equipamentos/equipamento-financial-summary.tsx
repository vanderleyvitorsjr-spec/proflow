import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EquipmentFinancialReconciliationStatus } from "./equipamentos-types";
import type { EquipmentFinanceiroTransaction } from "./equipamentos-financeiro-gateway";
const money = (c: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c / 100);
export function EquipmentFinancialSummary({
  transaction,
  technicalCents,
  reconciliation,
  onComplement,
  onCancelBalance,
  onReview,
}: {
  transaction: EquipmentFinanceiroTransaction;
  technicalCents: number;
  reconciliation: EquipmentFinancialReconciliationStatus;
  onComplement: () => void;
  onCancelBalance: () => void;
  onReview: (snapshot: boolean) => void;
}) {
  const difference = technicalCents - transaction.totalCents;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Lançamento" value={transaction.number} />
        <Info
          label="Natureza"
          value={transaction.nature === "INVESTMENT" ? "Investimento" : "Despesa"}
        />
        <Info label="Total financeiro" value={money(transaction.totalCents)} />
        <Info label="Pago" value={money(transaction.paidCents)} />
        <Info label="Saldo" value={money(transaction.openCents)} />
        <Info label="Conta" value={transaction.accountName} />
        <Info label="Status" value={transaction.status} />
        <Info label="Diferença" value={money(difference)} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={reconciliation === "MATCHED" ? "success" : "warning"}>
          {reconciliation}
        </Badge>
        <Button size="sm" variant="secondary" asChild>
          <Link href={`/dashboard/financeiro/${transaction.id}`}>Abrir Financeiro</Link>
        </Button>
        {difference > 0 && !transaction.canceled && !transaction.archived ? (
          <Button size="sm" onClick={onComplement}>
            Criar complemento
          </Button>
        ) : null}
        {transaction.openCents > 0 ? (
          <Button size="sm" variant="secondary" onClick={onCancelBalance}>
            Cancelar saldo aberto
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onClick={() => onReview(false)}>
          Marcar revisado
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onReview(true)}>
          Atualizar snapshot
        </Button>
      </div>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
