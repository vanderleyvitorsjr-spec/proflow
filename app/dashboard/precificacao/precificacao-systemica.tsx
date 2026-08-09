"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calculator,
  Database,
  FilePlus2,
  HardHat,
  Link2,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { readRemoteModuleState, writeRemoteModuleState } from "@/lib/storage/remote-module-state";
import { scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";
import { listEquipmentPricingReferencesAction } from "@/app/dashboard/_equipamentos/equipamentos-actions";
import { listFinancialStateAction } from "@/app/dashboard/financeiro/financeiro-actions";
import type { FinancialStorageState } from "@/app/dashboard/financeiro/financeiro-types";
import { createPricingSimulationAction, linkPricingCommercialAction } from "./precificacao-actions";
import type { PricingSimulationFormValues } from "./precificacao-schema";
import type { PricingCategory } from "./precificacao-types";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type TechnicalProfile =
  | "CUSTOM"
  | "AC_INSTALLATION"
  | "AC_MAINTENANCE"
  | "REFRIGERATION"
  | "ELECTRICAL_CIRCUIT"
  | "ELECTRICAL_MAINTENANCE";

export type TechnicalCostItem = {
  id: string;
  label: string;
  unit: string;
  quantity: number;
  unitCost: number;
};

export type SystemicPricingConfig = {
  pricingCategory: PricingCategory;
  fixed: {
    water: number;
    electricity: number;
    rent: number;
    internet: number;
    accountingDas: number;
    marketing: number;
    managementSystem: number;
    toolDepreciation: number;
    vehicleMaintenance: number;
    proLabore: number;
    other: number;
  };
  productiveDays: number;
  hoursPerDay: number;
  service: {
    profile: TechnicalProfile;
    estimatedHours: number;
    materials: number;
    technicalItems: TechnicalCostItem[];
    travel: number;
    food: number;
    helper: number;
    thirdParties: number;
    other: number;
  };
  rates: { profitMargin: number; tax: number; cardFee: number };
  benchmarkCost: number;
};

const baseFixed: SystemicPricingConfig["fixed"] = {
  water: 0,
  electricity: 0,
  rent: 0,
  internet: 0,
  accountingDas: 0,
  marketing: 0,
  managementSystem: 0,
  toolDepreciation: 0,
  vehicleMaintenance: 0,
  proLabore: 0,
  other: 0,
};

const initialConfig: SystemicPricingConfig = {
  pricingCategory: "INSTALLATION",
  fixed: { ...baseFixed },
  productiveDays: 22,
  hoursPerDay: 8,
  service: {
    profile: "CUSTOM",
    estimatedHours: 4,
    materials: 0,
    technicalItems: [],
    travel: 0,
    food: 0,
    helper: 0,
    thirdParties: 0,
    other: 0,
  },
  rates: { profitMargin: 30, tax: 6, cardFee: 0 },
  benchmarkCost: 0,
};

const technicalProfiles: Array<{
  value: TechnicalProfile;
  label: string;
  items: Array<Omit<TechnicalCostItem, "id" | "unitCost">>;
}> = [
  { value: "CUSTOM", label: "Personalizado", items: [] },
  {
    value: "AC_INSTALLATION",
    label: "Instalação de ar-condicionado",
    items: [
      { label: "Tubulação de cobre / linha frigorígena", unit: "m", quantity: 0 },
      { label: "Isolamento térmico", unit: "m", quantity: 0 },
      { label: "Cabo elétrico / PP", unit: "m", quantity: 0 },
      { label: "Dreno / tubulação de condensado", unit: "m", quantity: 0 },
      { label: "Suporte / base da condensadora", unit: "un", quantity: 0 },
      { label: "Conexões e consumíveis", unit: "kit", quantity: 0 },
      { label: "Refrigerante complementar", unit: "kg", quantity: 0 },
    ],
  },
  {
    value: "AC_MAINTENANCE",
    label: "Manutenção / higienização de ar-condicionado",
    items: [
      { label: "Produto de limpeza / sanitização", unit: "un", quantity: 0 },
      { label: "Filtros / materiais de reposição", unit: "un", quantity: 0 },
      { label: "Refrigerante complementar", unit: "kg", quantity: 0 },
      { label: "Conexões e consumíveis", unit: "kit", quantity: 0 },
    ],
  },
  {
    value: "REFRIGERATION",
    label: "Refrigeração",
    items: [
      { label: "Tubulação / conexões frigorígenas", unit: "m", quantity: 0 },
      { label: "Refrigerante", unit: "kg", quantity: 0 },
      { label: "Filtro secador / componentes", unit: "un", quantity: 0 },
      { label: "Material elétrico e comando", unit: "kit", quantity: 0 },
      { label: "Consumíveis técnicos", unit: "kit", quantity: 0 },
    ],
  },
  {
    value: "ELECTRICAL_CIRCUIT",
    label: "Novo circuito / instalação elétrica",
    items: [
      { label: "Cabos / condutores", unit: "m", quantity: 0 },
      { label: "Eletroduto / canaleta", unit: "m", quantity: 0 },
      { label: "Disjuntor", unit: "un", quantity: 0 },
      { label: "DR / DPS / proteção", unit: "un", quantity: 0 },
      { label: "Caixas / tomadas / interruptores", unit: "un", quantity: 0 },
      { label: "Terminais / conectores / consumíveis", unit: "kit", quantity: 0 },
    ],
  },
  {
    value: "ELECTRICAL_MAINTENANCE",
    label: "Manutenção elétrica",
    items: [
      { label: "Cabos / condutores", unit: "m", quantity: 0 },
      { label: "Disjuntores / proteção", unit: "un", quantity: 0 },
      { label: "Tomadas / interruptores / componentes", unit: "un", quantity: 0 },
      { label: "Terminais / conectores / consumíveis", unit: "kit", quantity: 0 },
    ],
  },
];

const LOCAL_KEY = () => scopedBrowserStorageKey("pricing-systemic");

function finite(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

const pricingCategories: Array<{ value: PricingCategory; label: string }> = [
  { value: "INSTALLATION", label: "Instalação" },
  { value: "MAINTENANCE", label: "Manutenção" },
  { value: "CLEANING", label: "Higienização / limpeza" },
  { value: "COMPONENT_REPLACEMENT", label: "Troca de componente" },
  { value: "INFRASTRUCTURE", label: "Infraestrutura" },
  { value: "RECURRING", label: "Contrato recorrente" },
  { value: "RESIDENTIAL_ELECTRICAL", label: "Elétrica residencial" },
  { value: "COMMERCIAL_ELECTRICAL", label: "Elétrica comercial" },
  { value: "INSPECTION", label: "Inspeção / diagnóstico" },
  { value: "OTHER", label: "Outro" },
];

function categoryForProfile(profile: TechnicalProfile): PricingCategory {
  if (profile === "AC_INSTALLATION") return "INSTALLATION";
  if (profile === "AC_MAINTENANCE") return "MAINTENANCE";
  if (profile === "REFRIGERATION") return "MAINTENANCE";
  if (profile === "ELECTRICAL_CIRCUIT") return "RESIDENTIAL_ELECTRICAL";
  if (profile === "ELECTRICAL_MAINTENANCE") return "RESIDENTIAL_ELECTRICAL";
  return "OTHER";
}

function profileLabel(profile: TechnicalProfile) {
  return technicalProfiles.find((item) => item.value === profile)?.label ?? "Serviço técnico";
}

function normalizeConfig(raw: Partial<SystemicPricingConfig> | null | undefined): SystemicPricingConfig {
  const fixed = raw?.fixed ?? baseFixed;
  const service = raw?.service ?? initialConfig.service;
  return {
    pricingCategory: pricingCategories.some((item) => item.value === raw?.pricingCategory)
      ? (raw?.pricingCategory as PricingCategory)
      : categoryForProfile((service.profile as TechnicalProfile) || "CUSTOM"),
    fixed: {
      water: finite(fixed.water),
      electricity: finite(fixed.electricity),
      rent: finite(fixed.rent),
      internet: finite(fixed.internet),
      accountingDas: finite(fixed.accountingDas),
      marketing: finite(fixed.marketing),
      managementSystem: finite(fixed.managementSystem),
      toolDepreciation: finite(fixed.toolDepreciation),
      vehicleMaintenance: finite(fixed.vehicleMaintenance),
      proLabore: finite(fixed.proLabore),
      other: finite(fixed.other),
    },
    productiveDays: finite(raw?.productiveDays, 22),
    hoursPerDay: finite(raw?.hoursPerDay, 8),
    service: {
      profile: technicalProfiles.some((item) => item.value === service.profile)
        ? (service.profile as TechnicalProfile)
        : "CUSTOM",
      estimatedHours: finite(service.estimatedHours, 4),
      materials: finite(service.materials),
      technicalItems: Array.isArray(service.technicalItems)
        ? service.technicalItems.map((item) => ({
            id: String(item.id || crypto.randomUUID()),
            label: String(item.label || "Material"),
            unit: String(item.unit || "un"),
            quantity: finite(item.quantity),
            unitCost: finite(item.unitCost),
          }))
        : [],
      travel: finite(service.travel),
      food: finite(service.food),
      helper: finite(service.helper),
      thirdParties: finite(service.thirdParties),
      other: finite(service.other),
    },
    rates: {
      profitMargin: finite(raw?.rates?.profitMargin, 30),
      tax: finite(raw?.rates?.tax, 6),
      cardFee: finite(raw?.rates?.cardFee),
    },
    benchmarkCost: finite(raw?.benchmarkCost),
  };
}

function readLocalConfig() {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY());
    return raw ? normalizeConfig(JSON.parse(raw) as Partial<SystemicPricingConfig>) : null;
  } catch {
    return null;
  }
}

function writeLocalConfig(value: SystemicPricingConfig) {
  try {
    window.localStorage.setItem(LOCAL_KEY(), JSON.stringify(value));
  } catch {
    // O servidor continua sendo a fonte principal.
  }
}

function sum(values: object) {
  return Object.values(values).reduce<number>((total, value) => total + finite(value), 0);
}

function technicalItemsTotal(items: TechnicalCostItem[]) {
  return items.reduce((total, item) => total + finite(item.quantity) * finite(item.unitCost), 0);
}

export function calculateSystemicPricing(
  config: SystemicPricingConfig,
  equipmentDepreciationMonthly = 0,
  equipmentMaintenanceMonthly = 0,
) {
  const automaticEquipmentCost = equipmentDepreciationMonthly + equipmentMaintenanceMonthly;
  const cfm = sum(config.fixed) + automaticEquipmentCost;
  const productiveHours = Math.max(0, config.productiveDays) * Math.max(0, config.hoursPerDay);
  const cht = productiveHours > 0 ? cfm / productiveHours : 0;
  const itemizedMaterials = technicalItemsTotal(config.service.technicalItems);
  const cvs =
    config.service.materials +
    itemizedMaterials +
    config.service.travel +
    config.service.food +
    config.service.helper +
    config.service.thirdParties +
    config.service.other;
  const laborCost = Math.max(0, config.service.estimatedHours) * cht;
  const cts = laborCost + cvs;
  const totalRate = config.rates.profitMargin + config.rates.tax + config.rates.cardFee;
  const divisor = 1 - totalRate / 100;
  const pv = divisor > 0 ? cts / divisor : 0;
  return {
    cfm,
    automaticEquipmentCost,
    equipmentDepreciationMonthly,
    equipmentMaintenanceMonthly,
    productiveHours,
    cht,
    laborCost,
    itemizedMaterials,
    cvs,
    cts,
    totalRate,
    divisor,
    pv,
  };
}

function fixedSuggestionsFromFinance(state: FinancialStorageState) {
  const month = new Date().toISOString().slice(0, 7);
  const next = { ...baseFixed };
  let matched = 0;
  const entries = state.transactions.filter(
    (transaction) =>
      !transaction.archivedAt &&
      !transaction.canceledAt &&
      transaction.direction === "EXPENSE" &&
      transaction.nature !== "INVESTMENT" &&
      transaction.competenceDate.startsWith(month),
  );

  const add = (key: keyof SystemicPricingConfig["fixed"], amount: number) => {
    next[key] += amount;
    matched += 1;
  };

  for (const transaction of entries) {
    const text = `${transaction.title} ${transaction.category} ${transaction.description}`.toLocaleLowerCase("pt-BR");
    const amount = transaction.totalCents / 100;
    if (/\b[aá]gua\b/.test(text)) add("water", amount);
    else if (/energia|luz|el[eé]trica/.test(text)) add("electricity", amount);
    else if (/aluguel|loca[cç][aã]o.*sede/.test(text)) add("rent", amount);
    else if (/internet|fibra|telefonia/.test(text)) add("internet", amount);
    else if (/contador|contabilidade|\bdas\b|simples|mei/.test(text)) add("accountingDas", amount);
    else if (/marketing|an[uú]ncio|tr[aá]fego/.test(text)) add("marketing", amount);
    else if (/sistema|software|erp|assinatura.*gest[aã]o/.test(text)) add("managementSystem", amount);
    else if (/ve[ií]culo|manuten[cç][aã]o.*carro|oficina|revis[aã]o.*carro/.test(text)) add("vehicleMaintenance", amount);
    else if (/pr[oó]-?labore|sal[aá]rio.*s[oó]cio|retirada.*s[oó]cio/.test(text)) add("proLabore", amount);
  }
  return { fixed: next, matched, month };
}

function MoneyInput({ label, value, onChange, hint, disabled = false }: { label: string; value: number; onChange: (value: number) => void; hint?: string; disabled?: boolean }) {
  return (
    <label className="space-y-1 text-xs font-medium text-muted-foreground">
      <span>{label}</span>
      <Input type="number" min="0" step="0.01" value={value || ""} disabled={disabled} onChange={(event) => onChange(Number(event.target.value) || 0)} />
      <span className="block min-h-4 text-[10px] font-normal text-muted-foreground/75">{hint}</span>
    </label>
  );
}

function NumberInput({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (value: number) => void; step?: number }) {
  return (
    <label className="space-y-1 text-xs font-medium text-muted-foreground">
      <span>{label}</span>
      <Input type="number" min="0" step={step} value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} />
    </label>
  );
}

export function PrecificacaoSystemica() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<SystemicPricingConfig>(initialConfig);
  const [equipmentDepreciation, setEquipmentDepreciation] = useState(0);
  const [equipmentMaintenance, setEquipmentMaintenance] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void Promise.all([
      readRemoteModuleState<Partial<SystemicPricingConfig>>("pricing-systemic"),
      listEquipmentPricingReferencesAction(),
    ])
      .then(([stored, equipment]) => {
        const local = readLocalConfig();
        if (stored.data) {
          const normalized = normalizeConfig(stored.data);
          setConfig(normalized);
          writeLocalConfig(normalized);
        } else if (local) {
          setConfig(local);
          void writeRemoteModuleState("pricing-systemic", local).catch(() => undefined);
        }
        if (equipment.ok) {
          const companyEquipment = equipment.data.filter(
            (item) => item.ownership === "COMPANY" && !item.archived,
          );
          setEquipmentDepreciation(
            companyEquipment.reduce((total, item) => total + item.monthlyDepreciationCents, 0) / 100,
          );
          setEquipmentMaintenance(
            companyEquipment.reduce((total, item) => total + item.estimatedMaintenanceMonthlyCents, 0) / 100,
          );
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    writeLocalConfig(config);
    const timer = window.setTimeout(
      () => void writeRemoteModuleState("pricing-systemic", config).catch(() => undefined),
      500,
    );
    return () => window.clearTimeout(timer);
  }, [config, loaded]);

  const result = useMemo(
    () => calculateSystemicPricing(config, equipmentDepreciation, equipmentMaintenance),
    [config, equipmentDepreciation, equipmentMaintenance],
  );
  const rateInvalid = result.divisor <= 0;
  const missingProLabore = config.fixed.proLabore <= 0;
  const missingProductiveCapacity = result.productiveHours <= 0;
  const benchmarkDelta = config.benchmarkCost > 0 ? result.cts - config.benchmarkCost : 0;

  const updateFixed = (key: keyof SystemicPricingConfig["fixed"], value: number) =>
    setConfig((current) => ({ ...current, fixed: { ...current.fixed, [key]: value } }));
  const updateService = <K extends keyof SystemicPricingConfig["service"]>(key: K, value: SystemicPricingConfig["service"][K]) =>
    setConfig((current) => ({ ...current, service: { ...current.service, [key]: value } }));
  const updateRate = (key: keyof SystemicPricingConfig["rates"], value: number) =>
    setConfig((current) => ({ ...current, rates: { ...current.rates, [key]: value } }));

  const loadTechnicalProfile = (profile: TechnicalProfile) => {
    const template = technicalProfiles.find((item) => item.value === profile) ?? technicalProfiles[0];
    setConfig((current) => ({
      ...current,
      pricingCategory: categoryForProfile(profile),
      service: {
        ...current.service,
        profile,
        technicalItems: template.items.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
          unitCost: 0,
        })),
      },
    }));
    setNotice(
      profile === "CUSTOM"
        ? "Composição personalizada ativada."
        : "Composição técnica carregada sem preços fixos. Informe quantidades e custos reais dos seus fornecedores.",
    );
  };

  const updateTechnicalItem = (id: string, patch: Partial<TechnicalCostItem>) =>
    updateService(
      "technicalItems",
      config.service.technicalItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );

  const importFinance = async () => {
    const finance = await listFinancialStateAction();
    if (!finance.ok) {
      setNotice(`Não foi possível consultar o Financeiro: ${finance.error.message}`);
      return;
    }
    const suggestions = fixedSuggestionsFromFinance(finance.data);
    if (!suggestions.matched) {
      setNotice("Nenhum custo fixo reconhecível foi encontrado no Financeiro para o mês atual. Os valores existentes foram preservados.");
      return;
    }
    setConfig((current) => ({
      ...current,
      fixed: Object.fromEntries(
        Object.entries(current.fixed).map(([key, currentValue]) => {
          const imported = suggestions.fixed[key as keyof SystemicPricingConfig["fixed"]];
          return [key, imported > 0 ? imported : currentValue];
        }),
      ) as SystemicPricingConfig["fixed"],
    }));
    setNotice(`${suggestions.matched} custo(s) fixo(s) do Financeiro foram reconhecidos para ${suggestions.month}. Revise antes de salvar.`);
  };

  const generateIntegratedSimulation = async () => {
    if (rateInvalid) {
      setNotice("Revise margem, impostos e cartão: a soma deve ser menor que 100%.");
      return;
    }
    if (missingProLabore) {
      setNotice("Informe o pró-labore obrigatório antes de gerar a simulação.");
      return;
    }
    if (missingProductiveCapacity || config.service.estimatedHours <= 0) {
      setNotice("Informe capacidade produtiva e tempo estimado do serviço antes de gerar a simulação.");
      return;
    }

    const cents = (value: number) => Math.max(0, Math.round(value * 100));
    const components: PricingSimulationFormValues["components"] = [
      {
        type: "LABOR",
        sourceType: "SYSTEMIC_CHT",
        description: "Hora técnica sistêmica (CFM ÷ horas produtivas)",
        quantity: config.service.estimatedHours,
        unit: "h",
        unitCostCents: cents(result.cht),
        fixedAmountCents: cents(result.laborCost),
        percentageBasis: "NONE",
        calculationMode: "FIXED",
        manuallyModified: false,
        notes: `CFM ${money.format(result.cfm)} · CHT ${money.format(result.cht)}/h · ${config.service.estimatedHours} h previstas`,
      },
    ];

    const addFixed = (
      type: "MATERIAL" | "TRAVEL" | "OTHER",
      description: string,
      value: number,
    ) => {
      if (value <= 0) return;
      components.push({
        type,
        sourceType: "SYSTEMIC_CVS",
        description,
        quantity: 1,
        unit: "serviço",
        unitCostCents: cents(value),
        fixedAmountCents: cents(value),
        percentageBasis: "NONE",
        calculationMode: "FIXED",
        manuallyModified: false,
      });
    };

    addFixed("MATERIAL", "Materiais adicionais", config.service.materials);
    for (const item of config.service.technicalItems) {
      if (item.quantity <= 0) continue;
      components.push({
        type: "MATERIAL",
        sourceType: "SYSTEMIC_MATERIAL",
        description: item.label || "Material técnico",
        quantity: item.quantity,
        unit: item.unit || "un",
        unitCostCents: cents(item.unitCost),
        percentageBasis: "NONE",
        calculationMode: "QUANTITY",
        manuallyModified: false,
      });
    }
    addFixed("TRAVEL", "Deslocamento", config.service.travel);
    addFixed("OTHER", "Alimentação da equipe", config.service.food);
    addFixed("OTHER", "Ajudante", config.service.helper);
    addFixed("OTHER", "Terceiros", config.service.thirdParties);
    addFixed("OTHER", "Outros custos variáveis", config.service.other);

    const targetCostCents = cents(result.cts);
    const representedCostCents = components.reduce((total, component) => {
      if (component.calculationMode === "FIXED")
        return total + Number(component.fixedAmountCents ?? component.unitCostCents);
      return total + Math.round(Number(component.quantity) * Number(component.unitCostCents));
    }, 0);
    const roundingAdjustment = targetCostCents - representedCostCents;
    if (roundingAdjustment !== 0) {
      const adjustableIndex = components.findIndex(
        (component) =>
          component.calculationMode === "FIXED" &&
          Number(component.fixedAmountCents ?? 0) + roundingAdjustment >= 0,
      );
      if (adjustableIndex >= 0) {
        const adjustable = components[adjustableIndex];
        components[adjustableIndex] = {
          ...adjustable,
          fixedAmountCents: Number(adjustable.fixedAmountCents ?? 0) + roundingAdjustment,
          notes: [adjustable.notes, `Ajuste centesimal sistêmico: ${roundingAdjustment > 0 ? "+" : ""}${roundingAdjustment} centavo(s).`]
            .filter(Boolean)
            .join(" · "),
        };
      }
    }

    const margin = Math.round(config.rates.profitMargin * 100);
    const tax = Math.round(config.rates.tax * 100);
    const card = Math.round(config.rates.cardFee * 100);
    const maximumMargin = Math.max(margin, 9999 - tax - card);
    const input: PricingSimulationFormValues = {
      title: `${profileLabel(config.service.profile)} · cálculo sistêmico`,
      scenarioLabel: "Sistêmica",
      description: `CFM ${money.format(result.cfm)} · CHT ${money.format(result.cht)}/h · CVS ${money.format(result.cvs)} · CTS ${money.format(result.cts)} · PV recomendado ${money.format(result.pv)}. Gerado pela metodologia CFM → CHT → CVS → CTS → Markup Divisor.`,
      category: config.pricingCategory,
      components,
      commercialRules: {
        taxRateBasisPoints: tax,
        taxBasis: "SALE_PRICE",
        taxFixedCents: 0,
        commissionRateBasisPoints: card,
        commissionFixedCents: 0,
        minimumMarginBasisPoints: Math.max(0, margin - 500),
        recommendedMarginBasisPoints: margin,
        premiumMarginBasisPoints: Math.min(margin + 1000, maximumMargin),
        discountRateBasisPoints: 0,
        discountFixedCents: 0,
        belowMinimumConfirmed: false,
      },
      status: "READY",
    };

    setNotice("Gerando simulação integrada...");
    const created = await createPricingSimulationAction(input);
    if (!created.ok) {
      setNotice(`Não foi possível gerar a simulação: ${created.error.message}`);
      return;
    }
    const crmLeadId = searchParams.get("crmLeadId") || undefined;
    const clientId = searchParams.get("clientId") || undefined;
    const serviceOrderId = searchParams.get("serviceOrderId") || undefined;
    if (crmLeadId || clientId || serviceOrderId) {
      const linked = await linkPricingCommercialAction(created.data.id, {
        crmLeadId,
        clientId,
        serviceOrderId,
      });
      if (!linked.ok) {
        setNotice(`Simulação #${created.data.sequence} criada, mas o vínculo automático não pôde ser concluído: ${linked.error.message}`);
        router.push(`/dashboard/precificacao/${created.data.id}`);
        return;
      }
    }
    setNotice(`Simulação #${created.data.sequence} criada com o preço sistêmico e vínculos conhecidos preservados. Abrindo para revisão/aplicação.`);
    router.push(`/dashboard/precificacao/${created.data.id}`);
  };

  const loadExample = () => {
    setConfig({
      pricingCategory: "INSTALLATION",
      fixed: {
        water: 120,
        electricity: 350,
        rent: 1500,
        internet: 120,
        accountingDas: 300,
        marketing: 300,
        managementSystem: 120,
        toolDepreciation: 250,
        vehicleMaintenance: 350,
        proLabore: 3500,
        other: 0,
      },
      productiveDays: 22,
      hoursPerDay: 8,
      service: {
        profile: "AC_INSTALLATION",
        estimatedHours: 5,
        materials: 650,
        technicalItems: [],
        travel: 90,
        food: 50,
        helper: 180,
        thirdParties: 0,
        other: 0,
      },
      rates: { profitMargin: 30, tax: 6, cardFee: 3 },
      benchmarkCost: 0,
    });
    setNotice("Exemplo didático carregado. Ele usa valores fictícios e não substitui seus custos reais nem a referência SINAPI atual.");
  };

  return (
    <Card className="overflow-hidden border-sky-500/20">
      <CardHeader className="border-b border-border bg-sky-500/[0.04]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-sky-500" />
              Precificação sistêmica — fonte principal
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              CFM → CHT → CVS → CTS → preço final por Markup Divisor, usando custos reais da empresa.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => void importFinance()}>
              <Link2 className="h-4 w-4" />
              Importar Financeiro
            </Button>
            <Button size="sm" variant="secondary" onClick={loadExample}>
              Exemplo Split 12.000 BTU
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void generateIntegratedSimulation()}
              disabled={rateInvalid || missingProLabore || missingProductiveCapacity || config.service.estimatedHours <= 0}
            >
              <FilePlus2 className="h-4 w-4" />
              Gerar simulação aplicável
            </Button>
            <Button
              size="sm"
              onClick={() => {
                writeLocalConfig(config);
                void writeRemoteModuleState("pricing-systemic", config)
                  .then(() => setNotice("Regras de precificação salvas."))
                  .catch(() => setNotice("Regras salvas localmente; sincronização com o servidor pendente."));
              }}
            >
              <Save className="h-4 w-4" />
              Salvar regras
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        {notice ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            {notice}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="space-y-3 rounded-xl border p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">1. Custo Fixo Mensal (CFM)</h3>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <MoneyInput label="Água" value={config.fixed.water} onChange={(value) => updateFixed("water", value)} />
              <MoneyInput label="Energia" value={config.fixed.electricity} onChange={(value) => updateFixed("electricity", value)} />
              <MoneyInput label="Aluguel" value={config.fixed.rent} onChange={(value) => updateFixed("rent", value)} />
              <MoneyInput label="Internet" value={config.fixed.internet} onChange={(value) => updateFixed("internet", value)} />
              <MoneyInput label="Contador / DAS" value={config.fixed.accountingDas} onChange={(value) => updateFixed("accountingDas", value)} />
              <MoneyInput label="Marketing" value={config.fixed.marketing} onChange={(value) => updateFixed("marketing", value)} />
              <MoneyInput label="Sistema de gestão" value={config.fixed.managementSystem} onChange={(value) => updateFixed("managementSystem", value)} />
              <MoneyInput label="Depreciação manual de ferramentas" value={config.fixed.toolDepreciation} onChange={(value) => updateFixed("toolDepreciation", value)} hint="Use apenas bens que não estão cadastrados em Equipamentos." />
              <MoneyInput label="Manutenção de veículo" value={config.fixed.vehicleMaintenance} onChange={(value) => updateFixed("vehicleMaintenance", value)} />
              <MoneyInput label="Pró-labore obrigatório" value={config.fixed.proLabore} onChange={(value) => updateFixed("proLabore", value)} />
              <MoneyInput label="Outros fixos" value={config.fixed.other} onChange={(value) => updateFixed("other", value)} />
              <MoneyInput label="Depreciação automática dos equipamentos" value={equipmentDepreciation} onChange={() => undefined} disabled hint="Calculada pelo módulo Equipamentos." />
              <MoneyInput label="Manutenção mensal estimada dos equipamentos" value={equipmentMaintenance} onChange={() => undefined} disabled hint="Calculada pelas previsões cadastradas em Equipamentos." />
            </div>
          </section>

          <section className="space-y-3 rounded-xl border p-3 sm:p-4">
            <h3 className="font-semibold">2. Custo da Hora Técnica (CHT)</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberInput label="Dias produtivos no mês" value={config.productiveDays} onChange={(value) => setConfig((current) => ({ ...current, productiveDays: value }))} />
              <NumberInput label="Horas produtivas por dia" value={config.hoursPerDay} onChange={(value) => setConfig((current) => ({ ...current, hoursPerDay: value }))} step={0.5} />
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <p className="text-muted-foreground">Capacidade produtiva: {result.productiveHours.toFixed(1)} h/mês</p>
              <p className="mt-1 font-semibold">CHT = {money.format(result.cfm)} ÷ {result.productiveHours.toFixed(1)} = {money.format(result.cht)}/h</p>
            </div>
          </section>
        </div>

        <section className="space-y-4 rounded-xl border p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <HardHat className="h-4 w-4 text-sky-500" />
                <h3 className="font-semibold">3. Custos Variáveis do Serviço (CVS)</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Monte a composição por quantidades e custos unitários. O ProFlow não fixa preço de material: use seu fornecedor e compare com referências atuais.</p>
            </div>
            <div className="grid w-full gap-2 sm:grid-cols-2 lg:max-w-2xl">
              <label className="space-y-1 text-xs font-medium text-muted-foreground">
                <span>Composição técnica</span>
                <Select value={config.service.profile} onChange={(event) => loadTechnicalProfile(event.target.value as TechnicalProfile)}>
                  {technicalProfiles.map((profile) => <option key={profile.value} value={profile.value}>{profile.label}</option>)}
                </Select>
              </label>
              <label className="space-y-1 text-xs font-medium text-muted-foreground">
                <span>Categoria da simulação</span>
                <Select
                  value={config.pricingCategory}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      pricingCategory: event.target.value as PricingCategory,
                    }))
                  }
                >
                  {pricingCategories.map((category) => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </Select>
              </label>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <NumberInput label="Tempo estimado (h)" value={config.service.estimatedHours} onChange={(value) => updateService("estimatedHours", value)} step={0.5} />
            <MoneyInput label="Materiais adicionais" value={config.service.materials} onChange={(value) => updateService("materials", value)} hint="Valor que não está detalhado na composição abaixo." />
            <MoneyInput label="Deslocamento" value={config.service.travel} onChange={(value) => updateService("travel", value)} hint="Km, combustível, pedágio e estacionamento." />
            <MoneyInput label="Alimentação" value={config.service.food} onChange={(value) => updateService("food", value)} />
            <MoneyInput label="Ajudante" value={config.service.helper} onChange={(value) => updateService("helper", value)} />
            <MoneyInput label="Terceiros" value={config.service.thirdParties} onChange={(value) => updateService("thirdParties", value)} />
            <MoneyInput label="Outros variáveis" value={config.service.other} onChange={(value) => updateService("other", value)} />
          </div>

          <div className="rounded-xl border bg-muted/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Materiais e insumos detalhados</p>
                <p className="text-xs text-muted-foreground">Quantidade × custo unitário = custo incorporado ao CVS.</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => updateService("technicalItems", [...config.service.technicalItems, { id: crypto.randomUUID(), label: "Novo item", unit: "un", quantity: 1, unitCost: 0 }])}
              >
                <Plus className="h-4 w-4" />
                Adicionar item
              </Button>
            </div>

            {config.service.technicalItems.length ? (
              <div className="mt-3 space-y-2">
                {config.service.technicalItems.map((item) => (
                  <div key={item.id} className="grid gap-2 rounded-lg border bg-card p-2 sm:grid-cols-[minmax(12rem,1fr)_5rem_7rem_8rem_8rem_2.5rem] sm:items-center">
                    <Input aria-label="Descrição do material" value={item.label} onChange={(event) => updateTechnicalItem(item.id, { label: event.target.value })} />
                    <Input aria-label="Unidade" value={item.unit} onChange={(event) => updateTechnicalItem(item.id, { unit: event.target.value })} />
                    <Input aria-label="Quantidade" type="number" min="0" step="0.01" value={item.quantity || ""} onChange={(event) => updateTechnicalItem(item.id, { quantity: Number(event.target.value) || 0 })} />
                    <Input aria-label="Custo unitário" type="number" min="0" step="0.01" value={item.unitCost || ""} onChange={(event) => updateTechnicalItem(item.id, { unitCost: Number(event.target.value) || 0 })} />
                    <div className="text-right text-sm font-semibold">{money.format(item.quantity * item.unitCost)}</div>
                    <Button aria-label={`Remover ${item.label}`} size="icon" variant="ghost" onClick={() => updateService("technicalItems", config.service.technicalItems.filter((current) => current.id !== item.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex justify-end text-sm"><span className="text-muted-foreground">Total detalhado:&nbsp;</span><strong>{money.format(result.itemizedMaterials)}</strong></div>
              </div>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">Escolha uma composição técnica ou adicione os materiais usados no serviço.</p>
            )}
          </div>

          {config.service.profile.startsWith("ELECTRICAL") ? (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p>Em elétrica, estime também o tempo necessário para os procedimentos de segurança, desenergização, verificação, bloqueio e preparação. A composição financeira não substitui os requisitos técnicos e de segurança aplicáveis ao serviço.</p>
            </div>
          ) : null}
        </section>

        <section className="space-y-3 rounded-xl border p-3 sm:p-4">
          <h3 className="font-semibold">4. Custo Total do Serviço (CTS)</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Tempo × CHT" value={money.format(result.laborCost)} />
            <Metric label="CVS" value={money.format(result.cvs)} />
            <Metric label="CTS" value={money.format(result.cts)} />
          </div>
          <p className="text-xs text-muted-foreground">CTS = ({config.service.estimatedHours.toFixed(2)} h × {money.format(result.cht)}/h) + {money.format(result.cvs)}.</p>
        </section>

        <section className="space-y-3 rounded-xl border p-3 sm:p-4">
          <h3 className="font-semibold">5. Markup Divisor</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <NumberInput label="Margem de lucro desejada (%)" value={config.rates.profitMargin} onChange={(value) => updateRate("profitMargin", value)} step={0.1} />
            <NumberInput label="Imposto sobre faturamento (%)" value={config.rates.tax} onChange={(value) => updateRate("tax", value)} step={0.1} />
            <NumberInput label="Cartão / antecipação (%)" value={config.rates.cardFee} onChange={(value) => updateRate("cardFee", value)} step={0.1} />
          </div>
          {rateInvalid ? <p className="text-sm font-medium text-red-500">A soma de margem + impostos + cartão deve ser menor que 100%.</p> : null}
          {missingProLabore ? <p className="text-sm font-medium text-amber-600">Informe o pró-labore. Pela metodologia do ProFlow ele é obrigatório no CFM.</p> : null}
          {missingProductiveCapacity ? <p className="text-sm font-medium text-red-500">Informe dias e horas produtivas para calcular a Hora Técnica.</p> : null}
        </section>

        <section className="space-y-3 rounded-xl border p-3 sm:p-4">
          <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-sky-500" /><h3 className="font-semibold">Referência externa de custo</h3></div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <MoneyInput label="Custo de referência SINAPI / mercado (opcional)" value={config.benchmarkCost} onChange={(value) => setConfig((current) => ({ ...current, benchmarkCost: value }))} hint="Use uma composição atual da sua UF apenas como conferência; este valor não entra automaticamente no preço final." />
            <div className="rounded-lg bg-muted/30 p-3 text-sm">
              {config.benchmarkCost > 0 ? (
                <><p className="text-muted-foreground">Seu CTS está {benchmarkDelta >= 0 ? "acima" : "abaixo"} da referência em:</p><p className="mt-1 font-bold">{money.format(Math.abs(benchmarkDelta))}</p></>
              ) : <p className="text-muted-foreground">Informe uma referência atual se quiser comparar sua composição real com uma base externa.</p>}
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="CFM" value={money.format(result.cfm)} />
          <Metric label="CHT" value={`${money.format(result.cht)}/h`} />
          <Metric label="CVS" value={money.format(result.cvs)} />
          <Metric label="CTS" value={money.format(result.cts)} />
          <Metric label="Preço final" value={rateInvalid || missingProLabore || missingProductiveCapacity ? "Revise os custos" : money.format(result.pv)} primary />
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <p>
            O preço final usa <strong>PV = CTS ÷ (1 − ((margem + impostos + cartão) ÷ 100))</strong>. O SINAPI funciona como referência comparativa de insumos e composições; o valor comercial do ProFlow nasce dos custos reais da empresa, da capacidade produtiva e das taxas informadas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) {
  return (
    <div className={primary ? "rounded-xl border border-sky-500/30 bg-sky-500/10 p-4" : "rounded-xl border bg-card p-4"}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={primary ? "mt-1 text-xl font-bold text-sky-600 dark:text-sky-300" : "mt-1 text-lg font-bold"}>{value}</p>
    </div>
  );
}
