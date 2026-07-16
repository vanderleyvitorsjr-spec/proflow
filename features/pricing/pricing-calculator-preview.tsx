import { Calculator } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pricingFields } from "@/features/pricing/pricing-fields";

export function PricingCalculatorPreview() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Precificação Inteligente
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Base inicial para calcular preços com custos operacionais e margem.
          </p>
        </div>
        <Badge variant="neutral">Motor de cálculo na próxima etapa</Badge>
      </div>

      <Card className="p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <section className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Custos do Serviço
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Campos preparados para validação com Zod e React Hook Form.
              </p>
            </div>

            {pricingFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input id={field.name} type="number" placeholder={field.placeholder} />
              </div>
            ))}
          </section>

          <section className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" aria-hidden="true" />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Resultado
                </h3>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Custo Real:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    R$ 0,00
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Preço Ideal:</span>
                  <span className="font-bold text-blue-600">R$ 0,00</span>
                </div>
              </div>
            </div>

            <Button className="mt-8 w-full">Calcular Agora</Button>
          </section>
        </div>
      </Card>
    </div>
  );
}
