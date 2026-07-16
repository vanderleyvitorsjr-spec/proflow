"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIcon,
  PageHeaderIdentity,
} from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { getEquipmentAction, updateEquipmentAction } from "../equipamentos-actions";
import { EquipmentFormDrawer } from "../equipamento-form-drawer";
import {
  assetTypeLabels,
  conditionLabels,
  ownershipLabels,
  statusLabels,
} from "../equipamentos-data";
import { depreciation, isCritical } from "../equipamentos-selectors";
import type { EquipmentFormValues } from "../equipamentos-schema";
import type { EquipmentAsset } from "../equipamentos-types";
const money = (c: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c / 100);
const date = (v?: string) =>
  v
    ? new Intl.DateTimeFormat("pt-BR").format(new Date(`${v}T12:00:00`))
    : "Não informado";
export function EquipmentDetail({ id }: { id: string }) {
  const [asset, setAsset] = useState<EquipmentAsset | null>(null),
    [loading, setLoading] = useState(true),
    [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const load = async () => {
    const r = await getEquipmentAction(id);
    if (r.ok) setAsset(r.data);
    else setError(r.error.message);
    setLoading(false);
  };
  useEffect(() => {
    void getEquipmentAction(id).then((r) => {
      if (r.ok) setAsset(r.data);
      else setError(r.error.message);
      setLoading(false);
    });
  }, [id]);
  if (loading) return <div className="h-80 animate-pulse rounded-xl bg-muted" />;
  if (!asset)
    return (
      <EmptyState
        title="Equipamento não encontrado"
        description={error}
        action={
          <Button asChild>
            <Link href="/dashboard/equipamentos">Voltar</Link>
          </Button>
        }
      />
    );
  const d = depreciation(asset);
  const save = async (v: EquipmentFormValues) => {
    setBusy(true);
    const r = await updateEquipmentAction(asset.id, v);
    if (r.ok) {
      await load();
      setEditing(false);
    } else setError(r.error.message);
    setBusy(false);
  };
  return (
    <div className="space-y-3">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <PageHeaderIcon>
              <Package className="h-5 w-5" />
            </PageHeaderIcon>
            <PageHeaderHeading
              title={`${asset.internalCode} · ${asset.name}`}
              description={asset.description || "Ficha patrimonial do ativo."}
            />
          </PageHeaderIdentity>
          <PageHeaderActions>
            <Button asChild variant="secondary">
              <Link href="/dashboard/equipamentos">
                <ArrowLeft className="h-4 w-4" />
                Equipamentos
              </Link>
            </Button>
            {!asset.archivedAt && (
              <Button onClick={() => setEditing(true)}>Editar</Button>
            )}
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>
      {asset.archivedAt && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          Arquivado em {date(asset.archivedAt.slice(0, 10))}. {asset.archiveReason}
        </p>
      )}
      <Card>
        <CardHeader>
          <SectionHeader compact title="Identificação e operação" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info l="Tipo" v={assetTypeLabels[asset.assetType]} />
          <Info l="Categoria" v={asset.category} />
          <Info
            l="Fabricante/modelo"
            v={`${asset.manufacturer || "Não informado"} · ${asset.model || "Não informado"}`}
          />
          <Info
            l="Série/patrimônio"
            v={`${asset.serialNumber || "Não informado"} · ${asset.patrimonyNumber || "Não aplicável"}`}
          />
          <Info l="Propriedade" v={ownershipLabels[asset.ownership]} />
          <Info l="Responsável" v={asset.responsible || "Não informado"} />
          <Info
            l="Localização"
            v={[asset.location.name, asset.location.room, asset.location.container]
              .filter(Boolean)
              .join(" · ")}
          />
          <div>
            <p className="text-xs text-muted-foreground">Estado</p>
            <div className="flex gap-2">
              <Badge variant={isCritical(asset) ? "destructive" : "neutral"}>
                {statusLabels[asset.status]}
              </Badge>
              <Badge variant="outline">{conditionLabels[asset.condition]}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <SectionHeader compact title="Aquisição e depreciação" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info l="Aquisição" v={date(asset.acquisition.acquisitionDate)} />
          <Info
            l="Valor de aquisição"
            v={money(asset.acquisition.acquisitionValueCents)}
          />
          <Info
            l="Modo"
            v={asset.depreciation.mode === "LINEAR" ? "Linear" : "Não depreciável"}
          />
          <Info
            l="Valor atual derivado"
            v={
              asset.ownership === "COMPANY"
                ? money(d.currentValueCents)
                : "Não compõe patrimônio próprio"
            }
          />
          <Info l="Depreciação acumulada" v={money(d.accumulatedCents)} />
          <Info l="Valor residual" v={money(asset.depreciation.residualValueCents)} />
          <Info
            l="Vida útil"
            v={
              asset.depreciation.usefulLifeMonths
                ? `${asset.depreciation.usefulLifeMonths} meses`
                : "Não aplicável"
            }
          />
          <Info
            l="Indicadores"
            v={`${d.fullyDepreciated ? "Totalmente depreciado · " : ""}${isCritical(asset) ? "Crítico" : "Regular"}`}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <SectionHeader compact title="Fotos e documentos (metadados)" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Media title="Fotos" items={asset.photos.map((x) => x.name)} />
          <Media title="Documentos" items={asset.documents.map((x) => x.name)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <SectionHeader compact title="Histórico" />
        </CardHeader>
        <CardContent className="divide-y">
          {[...asset.history].reverse().map((h) => (
            <div key={h.id} className="flex justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium">{h.message}</p>
                <p className="text-xs text-muted-foreground">
                  {h.type} · {h.origin}
                </p>
              </div>
              <time className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(h.createdAt))}
              </time>
            </div>
          ))}
        </CardContent>
      </Card>
      <EquipmentFormDrawer
        open={editing}
        asset={asset}
        busy={busy}
        error={error}
        onClose={() => setEditing(false)}
        onSubmit={save}
      />
    </div>
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
function Media({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-sm">
          {items.map((x) => (
            <li key={x} className="rounded border p-2">
              {x}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Nenhum metadado cadastrado.</p>
      )}
    </div>
  );
}
