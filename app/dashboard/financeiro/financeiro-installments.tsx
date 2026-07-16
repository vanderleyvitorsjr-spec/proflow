import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { formatMoneyCents } from "./financeiro-money";
import {
  installmentOpenCents,
  installmentPaidCents,
  installmentStatus,
} from "./financeiro-status";
import type {
  FinancialInstallment,
  FinancialPayment,
  FinancialTransaction,
} from "./financeiro-types";
const statusLabel = {
  PENDING: "Pendente",
  OVERDUE: "Vencida",
  PARTIALLY_PAID: "Parcial",
  PAID: "Paga",
  CANCELED: "Cancelada",
} as const;
const statusVariant = {
  PENDING: "neutral",
  OVERDUE: "destructive",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  CANCELED: "neutral",
} as const;
const date = (value: string) =>
  new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`));
export function FinanceiroInstallments({
  transaction,
  onPayment,
  onCancelInstallment,
  onReverse,
}: {
  transaction: FinancialTransaction;
  onPayment: (installment: FinancialInstallment) => void;
  onCancelInstallment: (installment: FinancialInstallment) => void;
  onReverse: (installment: FinancialInstallment, payment: FinancialPayment) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <SectionHeader compact title="Parcelas e pagamentos" />
      </CardHeader>
      <CardContent className="space-y-3">
        {transaction.installments.map((installment) => {
          const status = installmentStatus(installment),
            open = installmentOpenCents(installment);
          return (
            <article key={installment.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    Parcela {installment.number}/{installment.total}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vencimento {date(installment.dueDate)}
                  </p>
                </div>
                <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-semibold">
                    {formatMoneyCents(installment.amountCents)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Realizado</p>
                  <p className="font-semibold">
                    {formatMoneyCents(installmentPaidCents(installment))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Aberto</p>
                  <p className="font-semibold">{formatMoneyCents(open)}</p>
                </div>
              </div>
              {installment.payments.length > 0 && (
                <div className="mt-3 divide-y divide-border border-t border-border">
                  {installment.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs"
                    >
                      <div>
                        <p
                          className={
                            payment.reversedAt
                              ? "line-through text-muted-foreground"
                              : "font-medium"
                          }
                        >
                          {formatMoneyCents(payment.amountCents)} · {payment.method} ·{" "}
                          {date(payment.paidAt)}
                        </p>
                        <p className="text-muted-foreground">
                          {payment.reversedAt
                            ? `Estornado: ${payment.reversalReason}`
                            : payment.reference || "Sem referência"}
                        </p>
                      </div>
                      {!payment.reversedAt && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onReverse(installment, payment)}
                        >
                          Estornar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {open > 0 && !installment.canceledAt && !transaction.canceledAt && (
                  <Button size="sm" onClick={() => onPayment(installment)}>
                    {transaction.kind === "RECEIVABLE" ? "Receber" : "Pagar"}
                  </Button>
                )}
                {open > 0 && !installment.canceledAt && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onCancelInstallment(installment)}
                  >
                    Cancelar parcela
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </CardContent>
    </Card>
  );
}
