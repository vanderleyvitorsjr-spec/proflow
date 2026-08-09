import Link from "next/link";
import { Archive, ArrowRight, Edit3, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableFrame } from "@/components/ui/table";
import {
  assetTypeLabels,
  conditionLabels,
  ownershipLabels,
  statusLabels,
} from "./equipamentos-data";
import { depreciation, equipmentIndicators, warrantyStatus } from "./equipamentos-selectors";
import type { EquipmentAsset, EquipmentView, MaintenanceRecord } from "./equipamentos-types";
const money = (c: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c / 100);
export function EquipamentosList({
  view,
  assets,
  onEdit,
  onArchive,
  maintenanceRecords,
}: {
  view: EquipmentView;
  assets: EquipmentAsset[];
  onEdit: (a: EquipmentAsset) => void;
  onArchive: (a: EquipmentAsset) => void;
  maintenanceRecords: MaintenanceRecord[];
}) {
  if (!assets.length)
    return (
      <EmptyState
        icon={<Package className="h-5 w-5" />}
        title="Nenhum equipamento encontrado"
        description="Ajuste a busca ou cadastre um novo ativo."
      />
    );
  if (view === "cards")
    return (
      <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {assets.map((a) => {
          const d = depreciation(a), indicators = equipmentIndicators(a, maintenanceRecords.filter((item) => item.assetId === a.id));
          return (
            <Card key={a.id} className="p-4">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {a.internalCode} · {assetTypeLabels[a.assetType]}
                  </p>
                  <h2 className="font-bold">{a.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {a.manufacturer} {a.model}
                  </p>
                </div>
                <Badge variant={indicators.critical ? "destructive" : "neutral"}>
                  {statusLabels[a.status]}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <Info l="Propriedade" v={ownershipLabels[a.ownership]} />
                <Info l="Condição" v={conditionLabels[a.condition]} />
                <Info l="Localização" v={a.location.name} />
                <Info l="Cliente" v={a.clientNameSnapshot ?? "Não vinculado"} />
                <Info l="Garantia" v={warrantyStatus(a)} />
                <Info
                  l="Valor atual"
                  v={
                    a.ownership === "COMPANY"
                      ? money(d.currentValueCents)
                      : "Não patrimonial"
                  }
                />
              </div>
              <div className="mt-4 flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => onEdit(a)}>
                  <Edit3 className="h-4 w-4" />
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onArchive(a)}>
                  <Archive className="h-4 w-4" />
                  Arquivar
                </Button>
                <Button asChild size="sm">
                  <Link href={`/dashboard/equipamentos/${a.id}`}>
                    Ficha
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </section>
    );
  return (
    <TableFrame scrollHint>
      <Table framed={false} density="compact" className="min-w-[76rem]">
        <thead>
          <tr>
            <th>Equipamento</th>
            <th>Tipo</th>
            <th>Propriedade</th>
            <th>Localização</th>
            <th>Status</th>
            <th>Condição</th>
            <th>Valor atual</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => {
            const d = depreciation(a), indicators = equipmentIndicators(a, maintenanceRecords.filter((item) => item.assetId === a.id));
            return (
              <tr key={a.id}>
                <td>
                  <p className="font-semibold">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.internalCode} · {a.serialNumber || "Sem série"}
                  </p>
                </td>
                <td>{assetTypeLabels[a.assetType]}</td>
                <td>{ownershipLabels[a.ownership]}</td>
                <td>{a.location.name}</td>
                <td>
                  <Badge variant={indicators.critical ? "destructive" : "neutral"}>{statusLabels[a.status]}</Badge>
                </td>
                <td>{conditionLabels[a.condition]}</td>
                <td>
                  {a.ownership === "COMPANY"
                    ? money(d.currentValueCents)
                    : "Não patrimonial"}
                </td>
                <td>
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${a.name}`}
                      onClick={() => onEdit(a)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Arquivar ${a.name}`}
                      onClick={() => onArchive(a)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button asChild variant="ghost" size="icon">
                      <Link
                        aria-label={`Abrir ${a.name}`}
                        href={`/dashboard/equipamentos/${a.id}`}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </TableFrame>
  );
}
function Info({ l, v }: { l: string; v: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{l}</p>
      <p className="font-medium">{v}</p>
    </div>
  );
}
