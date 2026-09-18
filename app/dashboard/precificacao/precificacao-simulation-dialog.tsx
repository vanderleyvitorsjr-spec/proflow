"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, ChevronDown, ChevronUp, Info, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  CurrencyCentsInput,
  DecimalValueBRInput,
  PercentageBasisPointsInput,
} from "@/components/ui/br-masked-inputs";
import { formatCurrencyBRLFromCents, formatPercentageFromBasisPoints } from "@/lib/br-formatters";
import type {
  PricingSimulationFormValues,
  PricingComponentFormValues,
} from "./precificacao-schema";
import type {
  CommercialRules,
  LaborProfile,
  PricingBillingMode,
  PricingComplexity,
  PricingRisk,
  PricingSegment,
  PricingSimulation,
  PricingTechnicalData,
  PricingTemplate,
  PricingUrgency,
  PricingWarranty,
} from "./precificacao-types";
import type { PricingPublicSettings } from "@/lib/contracts/configuracoes.contract";
import type { EquipmentPricingReference } from "@/lib/contracts/equipamentos.contract";
import { getPricingConfiguration } from "./precificacao-configuracoes-gateway";
import { pricingEquipmentGateway } from "./precificacao-equipamentos-gateway";
import { calculatePricing } from "./precificacao-selectors";

const categories = [
  "INSTALLATION",
  "MAINTENANCE",
  "CLEANING",
  "COMPONENT_REPLACEMENT",
  "INFRASTRUCTURE",
  "RECURRING",
  "RESIDENTIAL_ELECTRICAL",
  "COMMERCIAL_ELECTRICAL",
  "INSPECTION",
  "OTHER",
] as const;

const categoryLabels: Record<(typeof categories)[number], string> = {
  INSTALLATION: "Instalação",
  MAINTENANCE: "Manutenção",
  CLEANING: "Limpeza / higienização",
  COMPONENT_REPLACEMENT: "Troca de componente",
  INFRASTRUCTURE: "Infraestrutura",
  RECURRING: "Contrato recorrente",
  RESIDENTIAL_ELECTRICAL: "Elétrica residencial",
  COMMERCIAL_ELECTRICAL: "Elétrica comercial",
  INSPECTION: "Inspeção / diagnóstico",
  OTHER: "Outro",
};

const segmentLabels: Record<PricingSegment, string> = {
  CLIMATIZATION: "Ar-condicionado / Refrigeração",
  ELECTRICAL: "Elétrica",
  IT: "T.I.",
};

const serviceOptions: Record<PricingSegment, string[]> = {
  CLIMATIZATION: [
    "Instalação de Split", "Desinstalação", "Reinstalação", "Manutenção preventiva",
    "Manutenção corretiva", "Higienização", "Limpeza", "Diagnóstico", "Teste de pressão",
    "Busca de vazamento", "Vácuo", "Carga de gás", "Complemento de gás", "Troca de capacitor",
    "Troca de compressor", "Troca de placa", "Dreno", "PMOC", "Refrigeração comercial",
    "Câmara fria", "Outro serviço de climatização",
  ],
  ELECTRICAL: [
    "Visita técnica", "Diagnóstico", "Instalação de tomada", "Troca de tomada",
    "Instalação de interruptor", "Troca de interruptor", "Instalação de luminária",
    "Instalação de disjuntor", "Troca de disjuntor", "Instalação de quadro",
    "Manutenção de quadro", "Organização de quadro", "Passagem de circuito",
    "Criação de novo circuito", "Cabeamento", "Instalação de DPS", "Instalação de DR",
    "Aterramento", "Identificação de circuitos", "Correção de falha elétrica", "Outro serviço elétrico",
  ],
  IT: [
    "Visita técnica", "Diagnóstico", "Suporte remoto", "Suporte presencial",
    "Configuração de computador", "Instalação de programas", "Atualização de sistema",
    "Correção de erros", "Formatação", "Reinstalação do Windows", "Instalação de drivers",
    "Configuração de impressora", "Configuração de periféricos", "Otimização", "Remoção de malware",
    "Instalação de rede", "Configuração de roteador", "Configuração de Wi-Fi", "Configuração de switch",
    "Access Point", "Cabeamento de rede", "Crimpagem", "Organização de rede", "Configuração de IP/DNS/DHCP",
    "Compartilhamento de arquivos", "Diagnóstico de rede", "Instalação de servidor", "Configuração de servidor",
    "Manutenção de servidor", "Criação de usuários e permissões", "Migração", "Backup", "Restauração",
    "NAS / armazenamento", "Monitoramento", "Backup automático", "Firewall / controle de acesso",
    "Organização de rack", "Pontos de rede", "Nobreak", "Implantação de computadores",
    "Estação de trabalho", "Migração de computador", "E-mail empresarial", "Microsoft 365",
    "Google Workspace", "Integração de equipamentos", "Documentação de infraestrutura",
    "Implantação de compartilhamento de dados em rede para exames OCT", "Contrato mensal de T.I.",
    "Outro serviço de T.I.",
  ],
};



type ITServicePreset = {
  billingMode: PricingBillingMode;
  laborHours: number;
  complexity: PricingComplexity;
  risk?: PricingRisk;
  warranty?: PricingWarranty;
  explanation: string;
};

const IT_SERVICE_PRESETS: Record<string, ITServicePreset> = {
  "Visita técnica": { billingMode: "VISIT", laborHours: 1, complexity: "SIMPLE", explanation: "Reserva 1 hora técnica para deslocamento local, triagem e orientação. Deslocamento em km continua separado." },
  "Diagnóstico": { billingMode: "SERVICE", laborHours: 1.5, complexity: "INTERMEDIATE", explanation: "Considera 1,5 h para análise, testes e identificação da causa. Reparo e peças não estão incluídos automaticamente." },
  "Suporte remoto": { billingMode: "HOUR", laborHours: 1, complexity: "SIMPLE", explanation: "Parte de 1 hora técnica. Aumente as horas se o chamado exigir investigação prolongada." },
  "Suporte presencial": { billingMode: "HOUR", laborHours: 1.5, complexity: "INTERMEDIATE", explanation: "Parte de 1,5 h técnicas; deslocamento é calculado separadamente." },
  "Configuração de computador": { billingMode: "DEVICE", laborHours: 1.5, complexity: "SIMPLE", explanation: "Estimativa por computador para ajustes, atualizações, testes e entrega." },
  "Instalação de programas": { billingMode: "DEVICE", laborHours: 1, complexity: "SIMPLE", explanation: "Estimativa por equipamento. Licenças pagas entram em Materiais/licenças." },
  "Atualização de sistema": { billingMode: "DEVICE", laborHours: 1.5, complexity: "INTERMEDIATE", explanation: "Inclui preparação, atualização e testes básicos por equipamento." },
  "Correção de erros": { billingMode: "SERVICE", laborHours: 2, complexity: "INTERMEDIATE", explanation: "Parte de 2 h por exigir diagnóstico e correção; ajuste conforme a falha encontrada." },
  "Formatação": { billingMode: "DEVICE", laborHours: 3, complexity: "INTERMEDIATE", explanation: "Considera backup básico, instalação, drivers, atualizações e testes. Recuperação de dados e licença são custos separados." },
  "Reinstalação do Windows": { billingMode: "DEVICE", laborHours: 3, complexity: "INTERMEDIATE", explanation: "Estimativa por equipamento para reinstalação, drivers, atualizações e testes." },
  "Instalação de drivers": { billingMode: "DEVICE", laborHours: 1, complexity: "SIMPLE", explanation: "Estimativa por computador para localizar, instalar e validar drivers." },
  "Configuração de impressora": { billingMode: "DEVICE", laborHours: 1, complexity: "SIMPLE", explanation: "Inclui instalação, comunicação, driver e teste de impressão." },
  "Configuração de periféricos": { billingMode: "DEVICE", laborHours: 0.75, complexity: "SIMPLE", explanation: "Estimativa por periférico para instalação, configuração e teste." },
  "Otimização": { billingMode: "DEVICE", laborHours: 1.5, complexity: "INTERMEDIATE", explanation: "Inclui diagnóstico de desempenho, ajustes e validação." },
  "Remoção de malware": { billingMode: "DEVICE", laborHours: 2.5, complexity: "ADVANCED", risk: "MEDIUM", explanation: "Inclui varredura, remoção, correções e testes; risco de dados eleva o esforço." },
  "Instalação de rede": { billingMode: "PROJECT", laborHours: 4, complexity: "ADVANCED", explanation: "Base inicial de projeto. Pontos, equipamentos e cabeamento devem ajustar o esforço e os materiais." },
  "Configuração de roteador": { billingMode: "DEVICE", laborHours: 1.5, complexity: "INTERMEDIATE", explanation: "Inclui acesso, WAN/LAN, Wi‑Fi, segurança básica e testes." },
  "Configuração de Wi-Fi": { billingMode: "PROJECT", laborHours: 2, complexity: "INTERMEDIATE", explanation: "Inclui análise básica, configuração e testes de cobertura/conectividade." },
  "Configuração de switch": { billingMode: "DEVICE", laborHours: 2, complexity: "ADVANCED", explanation: "Inclui configuração e validação; VLANs e ambiente gerenciado podem exigir mais horas." },
  "Access Point": { billingMode: "DEVICE", laborHours: 2, complexity: "INTERMEDIATE", explanation: "Estimativa por AP para instalação lógica, configuração e testes." },
  "Cabeamento de rede": { billingMode: "POINT", laborHours: 1.5, complexity: "INTERMEDIATE", explanation: "Estimativa por ponto; cabo, conectores, canaleta e certificação entram separadamente." },
  "Crimpagem": { billingMode: "POINT", laborHours: 0.5, complexity: "SIMPLE", explanation: "Estimativa por ponto/conector, incluindo montagem e teste básico." },
  "Organização de rede": { billingMode: "PROJECT", laborHours: 3, complexity: "INTERMEDIATE", explanation: "Base para identificação, organização física/lógica e testes." },
  "Configuração de IP/DNS/DHCP": { billingMode: "PROJECT", laborHours: 2, complexity: "ADVANCED", explanation: "Inclui planejamento, configuração e validação de endereçamento e serviços de rede." },
  "Compartilhamento de arquivos": { billingMode: "PROJECT", laborHours: 2, complexity: "INTERMEDIATE", risk: "MEDIUM", explanation: "Inclui permissões, compartilhamento e testes de acesso; quantidade de usuários/estações pode ampliar as horas." },
  "Diagnóstico de rede": { billingMode: "SERVICE", laborHours: 2.5, complexity: "ADVANCED", explanation: "Considera análise de conectividade, equipamentos, endereçamento e testes." },
  "Instalação de servidor": { billingMode: "PROJECT", laborHours: 6, complexity: "CRITICAL", risk: "HIGH", explanation: "Base de projeto para instalação, configuração inicial, segurança e testes." },
  "Configuração de servidor": { billingMode: "PROJECT", laborHours: 4, complexity: "CRITICAL", risk: "HIGH", explanation: "Considera configuração, permissões, serviços, segurança e validação." },
  "Manutenção de servidor": { billingMode: "PROJECT", laborHours: 3, complexity: "ADVANCED", risk: "HIGH", explanation: "Inclui diagnóstico, manutenção e testes; indisponibilidade e dados justificam risco maior." },
  "Criação de usuários e permissões": { billingMode: "USER", laborHours: 1.5, complexity: "INTERMEDIATE", risk: "MEDIUM", explanation: "Base inicial; quantidade de usuários e regras de acesso aumenta o esforço." },
  "Migração": { billingMode: "PROJECT", laborHours: 6, complexity: "CRITICAL", risk: "HIGH", explanation: "Base para planejamento, cópia, validação e contingência. Volume e risco de dados devem ser registrados." },
  "Backup": { billingMode: "SERVICE", laborHours: 2, complexity: "INTERMEDIATE", risk: "MEDIUM", explanation: "Inclui preparação, cópia e validação básica. Armazenamento/licenças são custos separados." },
  "Restauração": { billingMode: "SERVICE", laborHours: 3, complexity: "ADVANCED", risk: "HIGH", explanation: "Inclui recuperação a partir de backup existente e validação; recuperação forense é serviço de terceiro." },
  "NAS / armazenamento": { billingMode: "PROJECT", laborHours: 4, complexity: "ADVANCED", risk: "HIGH", explanation: "Inclui configuração, volumes, compartilhamentos, permissões e testes." },
  "Monitoramento": { billingMode: "MONTHLY", laborHours: 3, complexity: "ADVANCED", explanation: "Base de implantação; a mensalidade deve considerar horas inclusas e quantidade de ativos." },
  "Backup automático": { billingMode: "MONTHLY", laborHours: 3, complexity: "ADVANCED", risk: "HIGH", explanation: "Base para configurar rotina, retenção, destino e teste de restauração." },
  "Firewall / controle de acesso": { billingMode: "PROJECT", laborHours: 4, complexity: "CRITICAL", risk: "HIGH", explanation: "Inclui regras, segurança, testes e documentação; ambiente crítico exige mais horas." },
  "Organização de rack": { billingMode: "PROJECT", laborHours: 4, complexity: "ADVANCED", explanation: "Base para identificação, reorganização, patching e testes." },
  "Pontos de rede": { billingMode: "POINT", laborHours: 1.5, complexity: "INTERMEDIATE", explanation: "Estimativa por ponto; materiais e dificuldade física são adicionais." },
  "Nobreak": { billingMode: "DEVICE", laborHours: 1, complexity: "SIMPLE", explanation: "Estimativa por equipamento para instalação/configuração e teste." },
  "Implantação de computadores": { billingMode: "DEVICE", laborHours: 2, complexity: "INTERMEDIATE", explanation: "Estimativa por estação para configuração, softwares, rede e testes." },
  "Estação de trabalho": { billingMode: "DEVICE", laborHours: 2, complexity: "INTERMEDIATE", explanation: "Base por estação completa, incluindo configuração e validação." },
  "Migração de computador": { billingMode: "DEVICE", laborHours: 3, complexity: "ADVANCED", risk: "MEDIUM", explanation: "Inclui dados, perfil, configurações e validação no novo equipamento." },
  "E-mail empresarial": { billingMode: "USER", laborHours: 1.5, complexity: "INTERMEDIATE", explanation: "Base de configuração; migração e quantidade de caixas podem ampliar o esforço." },
  "Microsoft 365": { billingMode: "PROJECT", laborHours: 4, complexity: "ADVANCED", risk: "MEDIUM", explanation: "Base para tenant, usuários, políticas e configuração inicial; licenças são separadas." },
  "Google Workspace": { billingMode: "PROJECT", laborHours: 4, complexity: "ADVANCED", risk: "MEDIUM", explanation: "Base para domínio, usuários, políticas e configuração inicial; licenças são separadas." },
  "Integração de equipamentos": { billingMode: "PROJECT", laborHours: 4, complexity: "ADVANCED", explanation: "Base para levantamento, integração, testes e documentação." },
  "Documentação de infraestrutura": { billingMode: "PROJECT", laborHours: 3, complexity: "INTERMEDIATE", explanation: "Base para levantamento, desenho lógico, inventário e documentação." },
  "Implantação de compartilhamento de dados em rede para exames OCT": { billingMode: "PROJECT", laborHours: 6, complexity: "CRITICAL", risk: "HIGH", warranty: "STANDARD", explanation: "Inclui levantamento, compartilhamento, permissões, estações, testes de leitura/gravação e orientação da equipe." },
  "Contrato mensal de T.I.": { billingMode: "MONTHLY", laborHours: 8, complexity: "ADVANCED", risk: "MEDIUM", warranty: "STANDARD", explanation: "Base mensal de 8 horas inclusas. Ajuste horas, visitas, usuários, servidores e SLA conforme o contrato." },
  "Outro serviço de T.I.": { billingMode: "SERVICE", laborHours: 1, complexity: "SIMPLE", explanation: "Base neutra de 1 hora. Ajuste as horas conforme o escopo real antes de salvar." },
};

function itPreset(serviceType: string) {
  return IT_SERVICE_PRESETS[serviceType] ?? IT_SERVICE_PRESETS["Outro serviço de T.I."];
}

function itRelevantTechnicalFields(serviceType: string) {
  const value = serviceType.toLocaleLowerCase("pt-BR");
  const fields: Array<[string, string, string]> = [];
  const add = (key: string, label: string, help: string) => { if (!fields.some(([item]) => item === key)) fields.push([key, label, help]); };
  if (/computador|formatação|windows|drivers|programas|otimização|malware|estação|migração de computador|implantação de computadores/.test(value)) add("computers", "Quantidade de computadores", "A quantidade multiplica a estimativa de horas quando a cobrança é por dispositivo.");
  if (/servidor|nas|backup|restauração|migração|firewall|monitoramento/.test(value)) add("servers", "Servidores envolvidos", "Mais servidores normalmente ampliam testes, configuração e tempo técnico.");
  if (/impressora/.test(value)) add("printers", "Quantidade de impressoras", "Usado para dimensionar o tempo de configuração e testes.");
  if (/rede|roteador|wi-fi|switch|access point|rack|firewall|integração/.test(value)) add("networkDevices", "Equipamentos de rede", "Quantidade de roteadores, switches, APs ou outros ativos que precisam ser configurados/testados.");
  if (/usuário|permiss|e-mail|microsoft 365|google workspace|compartilhamento|contrato mensal/.test(value)) add("users", "Usuários atendidos", "Ajuda a dimensionar criação, permissões, configuração e suporte recorrente.");
  if (/ponto|cabeamento|crimpagem/.test(value)) add("networkPoints", "Pontos de rede", "Na cobrança por ponto, esta quantidade multiplica a estimativa técnica do serviço.");
  if (/visita|suporte presencial/.test(value)) add("attendanceType", "Tipo de atendimento", "Informe presencial, remoto ou híbrido. O deslocamento presencial é calculado em uma linha separada.");
  if (/contrato mensal|monitoramento|backup automático/.test(value)) {
    add("includedHours", "Horas técnicas inclusas por mês", "Define a capacidade técnica prevista no contrato e pode substituir a estimativa padrão de horas.");
    add("monthlyVisits", "Visitas presenciais por mês", "Registra o compromisso recorrente; deslocamentos devem ser lançados quando houver custo.");
  }
  if (/backup|restauração|migração|servidor|nas|compartilhamento|oct/.test(value)) add("dataRisk", "Risco sobre os dados", "Descreva baixo, médio, alto ou crítico. Serve para justificar risco e escopo; selecione também o nível de risco comercial quando necessário.");
  if (/oct|integração/.test(value)) add("additionalStations", "Estações adicionais", "Estações além do equipamento principal aumentam configuração, permissões e testes.");
  if (!fields.length) add("mainDevice", "Equipamento ou ambiente principal", "Identifique o ativo principal apenas para deixar o escopo claro; este campo textual não altera o preço sozinho.");
  return fields;
}

const typeLabels = {
  MATERIAL: "Materiais",
  LABOR: "Mão de obra",
  EQUIPMENT: "Equipamentos",
  TRAVEL: "Deslocamento",
  OVERHEAD: "Custos indiretos",
  OTHER: "Outros custos",
} as const;
const types: Array<keyof typeof typeLabels> = ["MATERIAL", "LABOR", "EQUIPMENT", "TRAVEL", "OTHER"];

type Line = PricingComponentFormValues & { key: string };
const AUTO_PREFIX = "[AUTO]";

const defaultLine = (type: Line["type"] = "MATERIAL"): Line => ({
  key: crypto.randomUUID(),
  type,
  sourceType: "MANUAL",
  description:
    type === "MATERIAL" ? "Materiais" :
    type === "LABOR" ? "Mão de obra técnica" :
    type === "EQUIPMENT" ? "Uso de equipamento" :
    type === "TRAVEL" ? "Deslocamento" :
    type === "OVERHEAD" ? "Custos indiretos" : "Outros custos",
  quantity: type === "LABOR" || type === "EQUIPMENT" ? 1 : 1,
  unit: type === "LABOR" || type === "EQUIPMENT" ? "hora" : "serviço",
  unitCostCents: 0,
  fixedAmountCents: 0,
  percentageRateBasisPoints: 0,
  percentageBasis: "NONE",
  wastePercentBasisPoints: 0,
  calculationMode:
    type === "LABOR" ? "PER_HOUR" : type === "EQUIPMENT" ? "PER_HOUR" : "FIXED",
  manuallyModified: true,
  notes: "",
  equipmentDetails:
    type === "EQUIPMENT"
      ? { method: "PER_HOUR", maintenanceCents: 0, energyCents: 0, wearCents: 0 }
      : undefined,
  travelDetails: undefined,
  overheadCategory: type === "OVERHEAD" ? "OTHER" : undefined,
});

const complexityRate: Record<PricingComplexity, number> = {
  SIMPLE: 0,
  INTERMEDIATE: 2000,
  ADVANCED: 5000,
  CRITICAL: 10000,
};
const urgencyRate: Record<PricingUrgency, number> = {
  NORMAL: 0,
  PRIORITY: 2000,
  EMERGENCY: 5000,
  AFTER_HOURS: 3000,
  WEEKEND: 2500,
  HOLIDAY: 5000,
};
const riskRate: Record<PricingRisk, number> = { LOW: 0, MEDIUM: 500, HIGH: 1000, CRITICAL: 1500 };
const warrantyRate: Record<PricingWarranty, number> = { NONE: 0, STANDARD: 200, EXTENDED: 500 };

function componentTotal(line: Line) {
  if (line.type === "TRAVEL" && line.travelDetails) {
    const t = line.travelDetails;
    return Math.round((t.distanceMilliKm * t.costPerKmCents) / 1000) + t.tollCents + t.parkingCents + t.lodgingCents + t.mealsCents + t.otherCents;
  }
  if (line.calculationMode === "FIXED") return Number(line.fixedAmountCents ?? line.unitCostCents ?? 0);
  let total = Math.round(Number(line.quantity) * Number(line.unitCostCents));
  if (line.type === "LABOR") {
    total = Math.round((total * (10000 + Number(line.percentageRateBasisPoints ?? 0))) / 10000) + Number(line.fixedAmountCents ?? 0);
  }
  if (line.type === "EQUIPMENT" && line.equipmentDetails) {
    total += line.equipmentDetails.maintenanceCents + line.equipmentDetails.energyCents + line.equipmentDetails.wearCents;
  }
  return Math.max(0, total);
}

function adjustmentLine(description: string, amountCents: number): Line {
  const line = defaultLine("OTHER");
  return {
    ...line,
    description: `${AUTO_PREFIX} ${description}`,
    unitCostCents: amountCents,
    fixedAmountCents: amountCents,
    calculationMode: "FIXED",
    manuallyModified: false,
  };
}

function technicalFields(segment: PricingSegment) {
  if (segment === "CLIMATIZATION") return [] as const;
  if (segment === "ELECTRICAL") return [
    ["pointCount", "Quantidade de pontos"], ["cableMeters", "Cabo (m)"], ["cableGauge", "Bitola"], ["cableType", "Tipo de cabo"],
    ["breakerCount", "Disjuntores"], ["circuitCount", "Circuitos"], ["panel", "Quadro elétrico"], ["conduit", "Eletroduto/canaleta"],
    ["height", "Altura"], ["access", "Acesso"], ["wallBreak", "Quebra de parede"], ["installationDifficulty", "Dificuldade da instalação"],
  ] as const;
  return [
    ["attendanceType", "Tipo de atendimento (remoto/presencial)"], ["computers", "Computadores"], ["servers", "Servidores"],
    ["printers", "Impressoras"], ["networkDevices", "Equipamentos de rede"], ["users", "Usuários"], ["networkPoints", "Pontos de rede"],
    ["mainDevice", "Equipamento principal"], ["additionalStations", "Estações adicionais"], ["dataRisk", "Risco sobre dados"],
    ["includedHours", "Horas técnicas inclusas"], ["monthlyVisits", "Visitas mensais"],
  ] as const;
}

function asPreviewComponents(lines: Line[]) {
  const now = new Date().toISOString();
  return lines.map((line) => ({
    ...line,
    id: line.key,
    totalCostCents: componentTotal(line),
    createdAt: now,
    updatedAt: now,
  }));
}

type MarketReference = {
  label: string;
  note: string;
  lowerReferenceCents?: number;
  upperReferenceCents?: number;
  source?: string;
};

function getMarketReference(segment: PricingSegment, serviceType: string): MarketReference | null {
  if (segment === "CLIMATIZATION" && /instalação de split/i.test(serviceType)) {
    return {
      label: "Instalação padrão de Split: R$ 338 a R$ 702 (referência pública regional)",
      note: "Use somente para conferência. Materiais, metragem, acesso e capacidade do equipamento alteram o preço.",
      lowerReferenceCents: 33800, upperReferenceCents: 70200,
    };
  }
  if (segment === "ELECTRICAL") {
    return {
      label: "Serviços elétricos variam fortemente conforme escopo e infraestrutura existente.",
      note: "A referência de mercado não substitui o cálculo por mão de obra, materiais, deslocamento e risco.",
    };
  }
  if (segment !== "IT") return null;
  const normalized = serviceType.toLocaleLowerCase("pt-BR");
  if (/formatação|reinstalação do windows/.test(normalized)) return {
    label: "Formatação / reinstalação: R$ 100 a R$ 350",
    note: "Faixa pública encontrada para Porto Seguro e Bahia. Backup, licença e recuperação de dados devem ser cobrados separadamente.",
    lowerReferenceCents: 10000, upperReferenceCents: 35000, source: "Pesquisa de mercado 2026",
  };
  if (/limpeza|otimização/.test(normalized)) return {
    label: "Limpeza / otimização de computador: R$ 120 a R$ 450",
    note: "A faixa varia conforme notebook/desktop, desmontagem, pasta térmica e complexidade.",
    lowerReferenceCents: 12000, upperReferenceCents: 45000, source: "Pesquisa de mercado 2026",
  };
  if (/suporte remoto|suporte presencial|visita técnica|diagnóstico/.test(normalized)) return {
    label: "Suporte de T.I.: R$ 70 a R$ 200 por hora; chamados avulsos podem chegar a R$ 500",
    note: "Atendimento presencial pode somar deslocamento. Complexidade, urgência e SLA elevam a cobrança.",
    lowerReferenceCents: 7000, upperReferenceCents: 20000, source: "Referências nacionais 2026 e prestadores da Bahia",
  };
  if (/contrato mensal/.test(normalized)) return {
    label: "Suporte mensal: aproximadamente R$ 50 a R$ 200 por usuário/mês em planos usuais",
    note: "Servidor, monitoramento, backup, segurança, SLA e visitas presenciais devem ampliar o valor do contrato.",
    lowerReferenceCents: 5000, upperReferenceCents: 20000, source: "Referências nacionais 2026",
  };
  if (/servidor|firewall|rede|switch|access point|wi-fi|cabeamento|rack|nas/.test(normalized)) return {
    label: "Infraestrutura de T.I.: precificação por hora/projeto é mais confiável do que uma tabela fixa",
    note: "Use horas técnicas, quantidade de pontos/equipamentos, materiais, deslocamento, risco e SLA. Referências de hora técnica em 2026 ficam com frequência entre R$ 80 e R$ 200/h para suporte, podendo ser maiores em redes e especialidades.",
    lowerReferenceCents: 8000, upperReferenceCents: 20000, source: "Referências nacionais 2026",
  };
  return {
    label: "Serviços de T.I.: referência de hora técnica de R$ 70 a R$ 200/h para suporte comum",
    note: "Use como comparação, nunca como custo. O preço do ProFlow deve continuar partindo dos seus custos reais, escopo, risco e margem.",
    lowerReferenceCents: 7000, upperReferenceCents: 20000, source: "Referências de mercado 2026",
  };
}
function buildPricingWarnings(
  recommendedPriceCents: number,
  totals: Record<string, number>,
  hourlyCostCents: number,
  marketReference: MarketReference | null,
) {
  const warnings: string[] = [];
  const totalCost = Object.values(totals).reduce((sum, value) => sum + value, 0);
  if (totalCost > 0 && (totals.EQUIPMENT || 0) / totalCost > 0.25)
    warnings.push("Equipamentos representam mais de 25% do custo do serviço. Confira se alguma ferramenta está sendo amortizada rápido demais.");
  if (totalCost > 0 && (totals.OVERHEAD || 0) / totalCost > 0.1)
    warnings.push("Há custo indireto antigo acima de 10% do custo. Custos fixos já devem estar diluídos na hora técnica para evitar duplicidade.");
  if (totalCost > 0 && (totals.TRAVEL || 0) / totalCost > 0.35)
    warnings.push("Deslocamento representa mais de 35% do custo. Confira distância de ida e volta e o valor por km.");
  if (hourlyCostCents > 20000)
    warnings.push("O custo da hora técnica está acima de R$ 200/h. Revise custos fixos mensais, dias e horas produtivas.");
  if (marketReference?.upperReferenceCents && recommendedPriceCents > marketReference.upperReferenceCents * 2)
    warnings.push("O preço recomendado está acima do dobro da referência pública disponível para um cenário simples. Confira mão de obra, equipamento, material e deslocamento antes de salvar.");
  return warnings;
}

export function PricingSimulationDialog({
  open,
  simulation,
  templates,
  laborProfiles,
  busy,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  simulation?: PricingSimulation | null;
  templates: PricingTemplate[];
  laborProfiles: LaborProfile[];
  busy: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (input: PricingSimulationFormValues) => Promise<void>;
}) {
  const [lines, setLines] = useState<Line[]>([]);
  const [configuration, setConfiguration] = useState<PricingPublicSettings | null>(null);
  const [configurationWarning, setConfigurationWarning] = useState("");
  const [equipment, setEquipment] = useState<EquipmentPricingReference[]>([]);
  const [segment, setSegment] = useState<PricingSegment>("CLIMATIZATION");
  const [serviceType, setServiceType] = useState("");
  const [complexity, setComplexity] = useState<PricingComplexity>("SIMPLE");
  const [urgency, setUrgency] = useState<PricingUrgency>("NORMAL");
  const [risk, setRisk] = useState<PricingRisk>("LOW");
  const [warranty, setWarranty] = useState<PricingWarranty>("NONE");
  const [billingMode, setBillingMode] = useState<PricingBillingMode>("SERVICE");
  const [sla, setSla] = useState("");
  const [technicalData, setTechnicalData] = useState<PricingTechnicalData>({});
  const [advanced, setAdvanced] = useState(false);
  const [rules, setRules] = useState<CommercialRules>({
    taxRateBasisPoints: 0,
    taxBasis: "SALE_PRICE",
    taxFixedCents: 0,
    commissionRateBasisPoints: 0,
    commissionFixedCents: 0,
    minimumMarginBasisPoints: 1500,
    recommendedMarginBasisPoints: 2000,
    premiumMarginBasisPoints: 2500,
    discountRateBasisPoints: 0,
    discountFixedCents: 0,
    belowMinimumConfirmed: false,
  });

  useEffect(() => {
    if (!open) return;
    const p = simulation?.parameters;
    setSegment(p?.segment ?? "CLIMATIZATION");
    setServiceType(p?.serviceType ?? "");
    setComplexity(p?.complexity ?? "SIMPLE");
    setUrgency(p?.urgency ?? "NORMAL");
    setRisk(p?.risk ?? "LOW");
    setWarranty(p?.warranty ?? "NONE");
    setBillingMode(p?.billingMode ?? "SERVICE");
    setSla(p?.sla ?? "");
    setTechnicalData(p?.technicalData ?? {});
    setLines(
      simulation?.costComponents
        .filter((item) => !item.description.startsWith(AUTO_PREFIX))
        .map((item) => ({ ...defaultLine(item.type), ...item, key: item.id })) ??
        [defaultLine("MATERIAL"), defaultLine("LABOR"), defaultLine("TRAVEL")],
    );
    void Promise.all([getPricingConfiguration(), pricingEquipmentGateway.list()]).then(([config, equipmentItems]) => {
      setConfiguration(config.settings);
      setConfigurationWarning(config.warning ?? "");
      setEquipment(equipmentItems);
      if (!simulation) {
        const productiveHours = Math.max(1, (config.settings.workingDaysPerMonth || 22) * (config.settings.workingHoursPerDay || 8));
        const baseHourlyCost = Math.round((config.settings.monthlyFixedCostCents || 0) / productiveHours);
        setLines((current) => current.map((line) =>
          line.type === "LABOR" && Number(line.unitCostCents) === 0
            ? { ...line, unitCostCents: baseHourlyCost, percentageRateBasisPoints: 0, fixedAmountCents: 0 }
            : line,
        ));
      }
      setRules(simulation?.commercialRules ?? {
        taxRateBasisPoints: config.settings.taxBasisPoints ?? 0,
        taxBasis: "SALE_PRICE",
        taxFixedCents: 0,
        commissionRateBasisPoints: config.settings.commissionBasisPoints ?? 0,
        commissionFixedCents: 0,
        minimumMarginBasisPoints: config.settings.minimumMarginBasisPoints || 1500,
        recommendedMarginBasisPoints: config.settings.recommendedMarginBasisPoints || 2000,
        premiumMarginBasisPoints: config.settings.premiumMarginBasisPoints || 2500,
        discountRateBasisPoints: 0,
        discountFixedCents: 0,
        belowMinimumConfirmed: !config.settings.requireBelowMinimumConfirmation,
      });
    });
  }, [open, simulation]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, busy, onClose]);

  const change = (key: string, patch: Partial<Line>) =>
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  const replaceType = (key: string, type: Line["type"]) => {
    const next = defaultLine(type);
    const { key: _generatedKey, ...patch } = next;
    change(key, patch);
  };

  const adjustedLines = useMemo(() => [...lines], [lines]);

  const preview = useMemo(() => {
    try { return calculatePricing(asPreviewComponents(adjustedLines), rules); }
    catch { return null; }
  }, [adjustedLines, rules]);

  const productiveHours = Math.max(1, (configuration?.workingDaysPerMonth || 22) * (configuration?.workingHoursPerDay || 8));
  const calculatedHourlyCostCents = Math.round((configuration?.monthlyFixedCostCents || 0) / productiveHours);
  const totalsByType = useMemo(() => {
    const result: Record<string, number> = {};
    for (const line of adjustedLines) result[line.type] = (result[line.type] || 0) + componentTotal(line);
    return result;
  }, [adjustedLines]);
  const marketReference = getMarketReference(segment, serviceType);
  const activeLaborProfiles = laborProfiles.filter((profile) => profile.active);
  const laborHours = adjustedLines
    .filter((line) => line.type === "LABOR")
    .reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  const laborCostCents = totalsByType.LABOR || 0;
  const laborIncomplete = laborHours <= 0 || laborCostCents <= 0;
  const technicalPreview = useMemo(() => {
    try {
      return calculatePricing(
        asPreviewComponents(adjustedLines.filter((line) => line.type !== "MATERIAL")),
        rules,
      );
    } catch {
      return null;
    }
  }, [adjustedLines, rules]);
  const pricingWarnings = preview
    ? [
        ...buildPricingWarnings(
          preview.recommendedPriceCents,
          totalsByType,
          calculatedHourlyCostCents,
          marketReference,
        ),
        ...(laborIncomplete
          ? [
              "A mão de obra está zerada ou sem horas previstas. O preço recomendado ainda não representa o custo real do serviço. Informe as horas-homem e o custo da hora técnica antes de usar este valor.",
            ]
          : []),
      ]
    : [];

  const applyCalculatedHourlyCost = () => {
    if (calculatedHourlyCostCents <= 0) return;
    setLines((current) => current.map((line) => line.type === "LABOR" ? { ...line, unitCostCents: calculatedHourlyCostCents, percentageRateBasisPoints: 0, fixedAmountCents: 0 } : line));
  };

  const applyITServicePreset = (nextServiceType: string) => {
    const preset = itPreset(nextServiceType);
    setBillingMode(preset.billingMode);
    setComplexity(preset.complexity);
    setRisk(preset.risk ?? "LOW");
    setWarranty(preset.warranty ?? "NONE");
    setTechnicalData({});
    setLines((current) => current.map((line) => {
      if (line.type !== "LABOR") return line;
      const fallbackHourlyCost = Number(line.unitCostCents) > 0 ? Number(line.unitCostCents) : calculatedHourlyCostCents;
      return { ...line, quantity: preset.laborHours, unit: "hora", calculationMode: "PER_HOUR", unitCostCents: fallbackHourlyCost };
    }));
  };

  const changeITTechnicalData = (key: string, rawValue: string) => {
    setTechnicalData((current) => ({ ...current, [key]: rawValue }));
    if (segment !== "IT") return;
    const preset = itPreset(serviceType);
    const numeric = Number(rawValue.replace(",", "."));
    if (!Number.isFinite(numeric) || numeric <= 0) return;
    let hours = preset.laborHours;
    if (key === "includedHours") hours = numeric;
    else if (key === "computers" && ["DEVICE"].includes(preset.billingMode)) hours = preset.laborHours * numeric;
    else if (key === "printers" && preset.billingMode === "DEVICE") hours = preset.laborHours * numeric;
    else if (key === "networkPoints" && preset.billingMode === "POINT") hours = preset.laborHours * numeric;
    else if (key === "users" && preset.billingMode === "USER") hours = preset.laborHours * numeric;
    else if (key === "additionalStations") hours = preset.laborHours + Math.max(0, numeric) * 0.75;
    else return;
    setLines((current) => current.map((line) => line.type === "LABOR" ? { ...line, quantity: Math.max(0.25, hours), unit: "hora", calculationMode: "PER_HOUR" } : line));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/55">
      <div role="dialog" aria-modal="true" aria-labelledby="simulation-title" className="proflow-scrollbar h-full w-full max-w-6xl overflow-y-auto border-l bg-background shadow-2xl">
        <header className="sticky top-0 z-20 flex items-start justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
          <div>
            <h2 id="simulation-title" className="text-lg font-semibold">{simulation ? "Editar precificação" : "Nova precificação"}</h2>
            <p className="text-sm text-muted-foreground">Calculadora profissional para climatização, elétrica e T.I., com margem calculada sobre o preço de venda.</p>
          </div>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </header>

        <form
          className="space-y-4 p-4 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            void onSave({
              title: String(d.get("title")),
              templateId: String(d.get("templateId") ?? ""),
              scenarioGroupId: simulation?.scenarioGroupId ?? "",
              scenarioLabel: String(d.get("scenarioLabel")),
              description: String(d.get("description") ?? ""),
              category: String(d.get("category")) as PricingSimulationFormValues["category"],
              segment,
              serviceType,
              complexity,
              urgency,
              risk,
              warranty,
              billingMode,
              sla,
              technicalData,
              components: adjustedLines,
              commercialRules: rules,
              status: "READY",
              reverseTargetCents: 0,
            });
          }}
        >
          {error ? <p role="alert" className="rounded-lg border border-red-500/30 p-3 text-sm text-red-600">{error}</p> : null}

          <section className="rounded-xl border bg-card">
            <div className="border-b px-4 py-3"><h3 className="text-sm font-semibold">Serviço e parâmetros técnicos</h3><p className="text-xs text-muted-foreground">Escolha primeiro o segmento. O ProFlow adapta os campos técnicos sem misturar T.I., elétrica e climatização.</p></div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2"><Label htmlFor="pricing-title">Nome do serviço</Label><Input id="pricing-title" name="title" defaultValue={simulation?.title} autoFocus required /></div>
              <div><Label>Segmento</Label><Select value={segment} onChange={(e) => { setSegment(e.target.value as PricingSegment); setServiceType(""); setTechnicalData({}); }}><option value="CLIMATIZATION">Ar-condicionado / Refrigeração</option><option value="ELECTRICAL">Elétrica</option><option value="IT">T.I.</option></Select></div>
              
              <div className="sm:col-span-2"><Label>Tipo de serviço</Label><Select value={serviceType} onChange={(e) => { const next = e.target.value; setServiceType(next); if (segment === "IT") applyITServicePreset(next); }}><option value="">Selecione...</option>{serviceOptions[segment].map((service) => <option key={service} value={service}>{service}</option>)}</Select></div>
              <div><Label>Categoria financeira</Label><Select name="category" defaultValue={simulation?.parameters.category ?? "OTHER"}>{categories.map((c) => <option key={c} value={c}>{categoryLabels[c]}</option>)}</Select></div>
              <div><Label>Forma de cobrança</Label><Select value={billingMode} onChange={(e) => setBillingMode(e.target.value as PricingBillingMode)}><option value="SERVICE">Por serviço</option><option value="HOUR">Por hora</option><option value="DAY">Por diária</option><option value="DEVICE">Por dispositivo</option><option value="USER">Por usuário</option><option value="POINT">Por ponto</option><option value="VISIT">Por visita</option><option value="PROJECT">Por projeto</option><option value="MONTHLY">Mensal</option></Select></div>
              
              
              
              
              {segment === "IT" ? <div><Label>SLA</Label><Select value={sla} onChange={(e) => setSla(e.target.value)}><option value="">Sem SLA específico</option><option value="24H">Até 24 horas</option><option value="8H">Até 8 horas</option><option value="4H">Até 4 horas</option><option value="2H">Até 2 horas</option><option value="IMMEDIATE">Imediato</option></Select></div> : null}
              <div className="sm:col-span-2"><Label>Template</Label><Select name="templateId" defaultValue={simulation?.templateId}><option value="">Sem template</option>{templates.filter((t) => !t.archivedAt).map((t) => <option key={t.id} value={t.id}>{t.code} · {t.name}</option>)}</Select></div>
              <div><Label>Cenário</Label><Input name="scenarioLabel" defaultValue={simulation?.scenarioLabel ?? "Cenário A"} /></div>
              <div className="sm:col-span-2 lg:col-span-4"><Label>Descrição / escopo</Label><Input name="description" defaultValue={simulation?.parameters.description} placeholder="Descreva o que será executado e o que está incluído." /></div>
            </div>
            {technicalFields(segment).length > 0 ? <div className="border-t p-4">
              <div className="mb-3 flex items-center gap-2"><Wrench className="h-4 w-4 text-primary"/><strong className="text-sm">Dados adicionais de {segmentLabels[segment]}</strong></div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(segment === "IT" ? itRelevantTechnicalFields(serviceType) : technicalFields(segment).map(([key, label]) => [key, label, "Registre este dado quando ele alterar quantidade, esforço, material, risco ou acesso do serviço."] as [string, string, string])).map(([key, label, help]) => <div key={key}><Label>{label}</Label><Input value={String(technicalData[key] ?? "")} onChange={(e) => segment === "IT" ? changeITTechnicalData(key, e.target.value) : setTechnicalData((current) => ({ ...current, [key]: e.target.value }))} /><p className="mt-1 text-[11px] text-muted-foreground">{help}</p></div>)}
              </div>
              {segment === "IT" && serviceType.includes("OCT") ? <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs"><strong>Escopo OCT sugerido:</strong> pasta centralizada, máquina OCT, recepção, sala principal, sala 2, permissões, testes de leitura/gravação e orientação da equipe.</div> : null}
              {segment === "IT" ? <div className="mt-3 space-y-2 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-xs text-muted-foreground"><p><strong className="text-foreground">Como preencher T.I.:</strong> o tipo de serviço agora aplica uma estimativa inicial de horas, forma de cobrança e complexidade. Quantidades como computadores, usuários e pontos ajustam as horas quando forem relevantes. Você pode corrigir a estimativa manualmente depois.</p>{serviceType ? <p><strong className="text-foreground">O que este serviço considera:</strong> {itPreset(serviceType).explanation} <span className="font-semibold text-primary">Estimativa inicial: {itPreset(serviceType).laborHours.toLocaleString("pt-BR")} h.</span></p> : <p>Selecione um tipo de serviço para ver quais informações realmente precisam ser preenchidas.</p>}</div> : null}
            </div> : null}
          </section>

          <section className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Base da hora técnica</h3>
                <p className="text-xs text-muted-foreground">Custos fixos mensais ÷ dias produtivos ÷ horas faturáveis. O pró-labore deve estar incluído nos custos fixos.</p>
              </div>
              <Button type="button" size="sm" variant="secondary" disabled={calculatedHourlyCostCents <= 0} onClick={applyCalculatedHourlyCost}>Aplicar à mão de obra</Button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Result label="Custos fixos mensais" value={formatCurrencyBRLFromCents(configuration?.monthlyFixedCostCents || 0)} />
              <Result label="Dias produtivos" value={`${configuration?.workingDaysPerMonth || 22} dias`} />
              <Result label="Horas faturáveis por dia" value={`${configuration?.workingHoursPerDay || 8} h`} />
              <Result label="Custo da hora técnica" value={formatCurrencyBRLFromCents(calculatedHourlyCostCents)} emphasis />
            </div>
            {(configuration?.monthlyFixedCostCents || 0) <= 0 ? <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">Configure os custos fixos em Configurações → Precificação para calcular a hora automaticamente. Enquanto isso, você pode informar manualmente o custo da hora na linha de mão de obra; o ProFlow calculará normalmente com esse valor.</p> : null}
          </section>

          <section className="rounded-xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
              <div><h3 className="text-sm font-semibold">Composição do custo real</h3><p className="text-xs text-muted-foreground">{segment === "IT" ? "Informe somente os custos que realmente fazem parte deste atendimento: tempo técnico, peças/licenças, deslocamento presencial e terceiros. Não repita custos fixos já incluídos na hora técnica." : "Materiais e deslocamento são lançados diretamente em reais. Mão de obra usa horas; equipamentos podem puxar custo do cadastro."}</p></div>
              <div className="flex flex-wrap gap-1">{types.map((type) => <Button key={type} type="button" size="sm" variant="secondary" onClick={() => setLines((current) => [...current, defaultLine(type)])}>+ {typeLabels[type]}</Button>)}</div>
            </div>
            <div className="space-y-2 p-3">
              {lines.map((line) => (
                <div key={line.key} className="rounded-xl border bg-muted/20 p-3">
                  <div className="grid gap-2 md:grid-cols-[9rem_1fr_auto]">
                    <Select aria-label="Tipo do componente" value={line.type} onChange={(e) => replaceType(line.key, e.target.value as Line["type"])}>{types.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}</Select>
                    <Input aria-label="Descrição do componente" value={line.description} onChange={(e) => change(line.key, { description: e.target.value })} />
                    <Button type="button" variant="ghost" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}>Remover</Button>
                  </div>

                  {line.type === "MATERIAL" ? <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_13rem]"><p className="self-center text-xs text-muted-foreground">{segment === "IT" ? "Peças, SSD, memória, cabos, conectores ou licenças fornecidas neste serviço. Informe o seu custo de aquisição, não o preço de venda." : "Informe o custo total de materiais desta linha em dinheiro."}</p><div><Label>Valor dos materiais (R$)</Label><CurrencyCentsInput value={Number(line.fixedAmountCents ?? line.unitCostCents)} onValueChange={(value) => change(line.key, { unitCostCents: value, fixedAmountCents: value, calculationMode: "FIXED", quantity: 1, unit: "serviço" })}/></div></div> : null}

                  {line.type === "LABOR" ? <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><div><Label>Perfil técnico</Label><Select onChange={(e) => { const profile = activeLaborProfiles.find((p) => p.id === e.target.value); if (profile) change(line.key, { description: profile.name, unitCostCents: profile.hourlyCostCents, fixedAmountCents: profile.fixedAdditionalCents, percentageRateBasisPoints: profile.burdenRateBasisPoints }); }}><option value="">{activeLaborProfiles.length ? "Escolher perfil..." : "Nenhum perfil cadastrado"}</option>{activeLaborProfiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select><p className="mt-1 text-[11px] text-muted-foreground">O perfil preenche o custo interno da hora. Se não houver perfil, digite o custo manualmente ao lado.</p></div><div><Label>Horas-homem previstas</Label><DecimalValueBRInput value={Number(line.quantity)} maximumFractionDigits={2} onValueChange={(value) => change(line.key, { quantity: Math.max(0, value), unit: "hora", calculationMode: "PER_HOUR" })}/><p className="mt-1 text-[11px] text-muted-foreground">Tempo efetivo que entra no custo. Em T.I., o tipo de serviço preenche uma estimativa inicial; quantidades relevantes podem ajustar este total.</p></div><div><Label>Custo da hora técnica (R$)</Label><CurrencyCentsInput value={Number(line.unitCostCents)} onValueChange={(value) => change(line.key, { unitCostCents: value })}/><p className="mt-1 text-[11px] text-muted-foreground">É custo interno, não preço cobrado do cliente. Pode ser calculado pelos custos fixos ou informado manualmente.</p></div><div className="self-end pb-2 text-xs text-muted-foreground">{segment === "IT" ? "Em T.I., inclua aqui diagnóstico, configuração, testes, backup e documentação quando consumirem tempo técnico." : "Se houver ajudante ou técnico com custo diferente, adicione outra linha de mão de obra."}</div></div> : null}

                  {line.type === "EQUIPMENT" ? <EquipmentLine line={line} equipment={equipment} monthlyHours={configuration?.equipmentMonthlyHours ?? 176} onChange={(patch) => change(line.key, patch)} /> : null}

                  {line.type === "TRAVEL" ? <TravelLine line={line} defaultCostPerKmCents={configuration?.costPerKmCents || 250} onChange={(patch) => change(line.key, patch)} /> : null}

                  {line.type === "OVERHEAD" || line.type === "OTHER" ? <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_13rem]"><p className="self-center text-xs text-muted-foreground">{line.type === "OVERHEAD" ? "Componente antigo: custos fixos devem preferencialmente entrar na hora técnica para evitar duplicidade." : segment === "IT" ? "Use para laboratório especializado, recuperação terceirizada, frete ou outro custo direto que não seja mão de obra, peça/licença ou deslocamento." : "Use para estacionamento, pedágio, alimentação, terceiros ou outro custo direto do serviço."}</p><div><Label>Valor (R$)</Label><CurrencyCentsInput value={Number(line.fixedAmountCents ?? line.unitCostCents)} onValueChange={(value) => change(line.key, { unitCostCents: value, fixedAmountCents: value, calculationMode: "FIXED" })}/></div></div> : null}

                  <div className="mt-2 flex justify-end text-xs text-muted-foreground">Custo desta linha: <strong className="ml-1 text-foreground">{formatCurrencyBRLFromCents(componentTotal(line))}</strong></div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold">Regras comerciais</h3><p className="text-xs text-muted-foreground">A margem é aplicada corretamente sobre o preço de venda, não como markup sobre o custo.</p></div><Button type="button" variant="ghost" size="sm" onClick={() => setAdvanced((value) => !value)}>{advanced ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}{advanced ? "Ocultar avançado" : "Mostrar avançado"}</Button></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Pct label="Margem de lucro (%)" value={rules.recommendedMarginBasisPoints} onChange={(value) => setRules((r) => ({ ...r, recommendedMarginBasisPoints: value }))}/>
              <Pct label="Imposto sobre faturamento (%)" value={rules.taxRateBasisPoints} onChange={(value) => setRules((r) => ({ ...r, taxRateBasisPoints: value, taxBasis: "SALE_PRICE" }))}/>
              <Pct label="Taxa do cartão / antecipação (%)" value={rules.commissionRateBasisPoints} onChange={(value) => setRules((r) => ({ ...r, commissionRateBasisPoints: value }))}/>
              <Pct label="Desconto (%)" value={rules.discountRateBasisPoints} onChange={(value) => setRules((r) => ({ ...r, discountRateBasisPoints: value }))}/>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">A referência inicial é 15% de margem mínima, 20% de margem recomendada e 25% para cenários premium. MEI pode manter imposto sobre faturamento em 0% quando o DAS já estiver nos custos fixos.</p>
            {advanced ? <div className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2 lg:grid-cols-4"><Pct label="Margem mínima (%)" value={rules.minimumMarginBasisPoints} onChange={(value) => setRules((r) => ({ ...r, minimumMarginBasisPoints: value }))}/><Pct label="Margem premium (%)" value={rules.premiumMarginBasisPoints} onChange={(value) => setRules((r) => ({ ...r, premiumMarginBasisPoints: value }))}/><Money label="Taxa fixa do cartão (R$)" value={rules.commissionFixedCents} onChange={(value) => setRules((r) => ({ ...r, commissionFixedCents: value }))}/><Money label="Desconto fixo (R$)" value={rules.discountFixedCents} onChange={(value) => setRules((r) => ({ ...r, discountFixedCents: value }))}/><label className="flex items-center gap-2 self-end pb-2 text-sm lg:col-span-2"><input type="checkbox" checked={rules.belowMinimumConfirmed} onChange={(e) => setRules((r) => ({ ...r, belowMinimumConfirmed: e.target.checked }))}/>Permitir salvar preço abaixo do mínimo mediante confirmação.</label></div> : null}
          </section>

          {preview ? <section className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2"><Calculator className="h-4 w-4 text-primary"/><h3 className="text-sm font-semibold">Resultado em tempo real</h3></div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <Result label="Mão de obra" value={formatCurrencyBRLFromCents(totalsByType.LABOR || 0)}/>
              <Result label="Materiais" value={formatCurrencyBRLFromCents(totalsByType.MATERIAL || 0)}/>
              <Result label="Equipamentos" value={formatCurrencyBRLFromCents(totalsByType.EQUIPMENT || 0)}/>
              <Result label="Deslocamento" value={formatCurrencyBRLFromCents(totalsByType.TRAVEL || 0)}/>
              <Result label="Outros custos" value={formatCurrencyBRLFromCents((totalsByType.OTHER || 0) + (totalsByType.OVERHEAD || 0))}/>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Result label="Custo total" value={formatCurrencyBRLFromCents(preview.totalCostCents)}/>
              <Result label="Preço mínimo" value={formatCurrencyBRLFromCents(preview.minimumPriceCents)}/>
              <Result label="Preço recomendado" value={formatCurrencyBRLFromCents(preview.recommendedPriceCents)} emphasis/>
              <Result label="Preço premium" value={formatCurrencyBRLFromCents(preview.premiumPriceCents)}/>
              <Result label="Imposto estimado" value={formatCurrencyBRLFromCents(preview.taxCents)}/>
              <Result label="Taxa cartão/antecipação" value={formatCurrencyBRLFromCents(preview.commissionCents)}/>
              <Result label="Lucro da empresa" value={formatCurrencyBRLFromCents(preview.profitCents)}/>
              <Result label="Margem efetiva" value={formatPercentageFromBasisPoints(preview.effectiveMarginBasisPoints)}/>
              <Result label="Valor técnico sem materiais" value={formatCurrencyBRLFromCents(technicalPreview?.recommendedPriceCents || 0)}/>
            </div>
            <div className="mt-3 rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
              <strong className="text-foreground">Como interpretar o lucro:</strong> a mão de obra, o pró-labore e os custos fixos não são o lucro. Eles precisam estar cobertos no custo do serviço. A margem de lucro é o que sobra para a empresa depois desses custos, impostos e taxas. Com margem de 20%, o lucro operacional tende a representar 20% do preço final quando não há desconto.
            </div>
            {laborIncomplete ? <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-300"><strong>Precificação incompleta:</strong> a mão de obra está zerada. Não use o preço recomendado enquanto as horas-homem e o custo da hora técnica não estiverem preenchidos.</div> : null}
            {marketReference ? <div className="mt-3 rounded-lg border bg-muted/20 p-3 text-xs"><strong>Referência de mercado:</strong> {marketReference.label}. {marketReference.note}{marketReference.source ? <> <span className="text-muted-foreground">Fonte-base: {marketReference.source}.</span></> : null}</div> : null}
            {pricingWarnings.length ? <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-200"><strong>Preço potencialmente fora do padrão.</strong><ul className="mt-1 list-disc space-y-1 pl-5">{pricingWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div> : null}
            {preview.promotionalPriceCents < preview.minimumPriceCents ? <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-300"><strong>Alerta:</strong> o preço final está abaixo do preço mínimo calculado. Revise desconto, margem, imposto ou taxa de cartão.</div> : null}
          </section> : null}

          <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground"><Info className="mr-1 inline h-4 w-4"/>{segment === "IT" ? "Em T.I., o preço parte do tempo técnico e dos custos diretos do atendimento. A referência de mercado serve para comparação; ela não substitui seu custo real. Margem, imposto e taxa de pagamento entram uma única vez." : "O preço é formado por custo da hora técnica + materiais + equipamentos rateados + deslocamento + outros custos. Margem, imposto e taxa de cartão entram uma única vez pelo divisor financeiro."}</div>
          {configurationWarning ? <p role="status" className="text-xs text-yellow-700 dark:text-yellow-300">{configurationWarning}</p> : null}
          <footer className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t bg-background/95 px-4 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-6 sm:px-6">{laborIncomplete ? <span className="mr-auto text-xs font-medium text-red-600 dark:text-red-300">Informe a mão de obra antes de salvar.</span> : null}<Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={busy || laborIncomplete}>{busy ? "Salvando..." : "Salvar precificação"}</Button></footer>
        </form>
      </div>
    </div>
  );
}

function EquipmentLine({ line, equipment, monthlyHours, onChange }: { line: Line; equipment: EquipmentPricingReference[]; monthlyHours: number; onChange: (patch: Partial<Line>) => void }) {
  const selectEquipment = (id: string) => {
    const item = equipment.find((entry) => entry.id === id);
    if (!item) return;
    const hours = Math.max(1, monthlyHours);
    const derived = Math.round(((item.ownership === "COMPANY" ? item.monthlyDepreciationCents : 0) + item.estimatedMaintenanceMonthlyCents) / hours);
    const now = new Date().toISOString();
    onChange({
      equipmentId: item.id,
      sourceId: item.id,
      sourceType: "EQUIPMENT",
      description: item.name,
      unit: "hora",
      unitCostCents: derived,
      calculationMode: "PER_HOUR",
      manuallyModified: false,
      sourceUpdatedAt: item.updatedAt,
      sourceCostCents: derived,
      sourceSnapshot: {
        kind: "EQUIPMENT", id: item.id, internalCode: item.internalCode, name: item.name,
        ownership: item.ownership, status: item.status, condition: item.condition,
        currentValueCents: item.currentValueCents, monthlyDepreciationCents: item.monthlyDepreciationCents,
        estimatedMaintenanceMonthlyCents: item.estimatedMaintenanceMonthlyCents, method: "DERIVED_PER_HOUR",
        standardMonthlyHours: hours, sourceUpdatedAt: item.updatedAt, capturedAt: now,
      },
      equipmentDetails: { method: "PER_HOUR", maintenanceCents: 0, energyCents: 0, wearCents: 0 },
    });
  };
  return <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><div className="lg:col-span-2"><Label>Equipamento cadastrado</Label><Select value={line.equipmentId ?? ""} onChange={(e) => selectEquipment(e.target.value)}><option value="">Custo manual / selecione um equipamento...</option>{equipment.filter((item) => !item.archived && item.condition !== "UNUSABLE" && ["AVAILABLE", "IN_USE"].includes(item.status)).map((item) => <option key={item.id} value={item.id}>{item.internalCode} · {item.name}</option>)}</Select></div><div><Label>Horas / usos</Label><DecimalValueBRInput value={Number(line.quantity)} maximumFractionDigits={2} onValueChange={(value) => onChange({ quantity: Math.max(0, value) })}/></div><div><Label>Custo por hora/uso (R$)</Label><CurrencyCentsInput value={Number(line.unitCostCents)} onValueChange={(value) => onChange({ unitCostCents: value, manuallyModified: true })}/></div><Money label="Energia estimada (R$)" value={line.equipmentDetails?.energyCents ?? 0} onChange={(value) => onChange({ equipmentDetails: { method: "PER_HOUR", maintenanceCents: line.equipmentDetails?.maintenanceCents ?? 0, energyCents: value, wearCents: line.equipmentDetails?.wearCents ?? 0 } })}/><Money label="Manutenção adicional (R$)" value={line.equipmentDetails?.maintenanceCents ?? 0} onChange={(value) => onChange({ equipmentDetails: { method: "PER_HOUR", maintenanceCents: value, energyCents: line.equipmentDetails?.energyCents ?? 0, wearCents: line.equipmentDetails?.wearCents ?? 0 } })}/><Money label="Desgaste adicional (R$)" value={line.equipmentDetails?.wearCents ?? 0} onChange={(value) => onChange({ equipmentDetails: { method: "PER_HOUR", maintenanceCents: line.equipmentDetails?.maintenanceCents ?? 0, energyCents: line.equipmentDetails?.energyCents ?? 0, wearCents: value } })}/>{line.sourceSnapshot?.ownership && line.sourceSnapshot.ownership !== "COMPANY" ? <p className="self-end pb-2 text-xs text-muted-foreground">Equipamento não pertencente à empresa: depreciação própria não aplicada.</p> : null}</div>;
}

function TravelLine({ line, defaultCostPerKmCents, onChange }: { line: Line; defaultCostPerKmCents: number; onChange: (patch: Partial<Line>) => void }) {
  const detailed = Boolean(line.travelDetails);
  const toggle = () => onChange({ travelDetails: detailed ? undefined : { origin: "", destination: "", distanceMilliKm: 0, estimatedTimeMinutes: 0, costPerKmCents: defaultCostPerKmCents, tollCents: 0, parkingCents: 0, lodgingCents: 0, mealsCents: 0, otherCents: 0 }, calculationMode: detailed ? "FIXED" : "QUANTITY" });
  return <div className="mt-2"><div className="grid gap-2 sm:grid-cols-[1fr_13rem_auto]"><p className="self-center text-xs text-muted-foreground">Informe um valor fixo em reais ou abra o cálculo detalhado por km.</p>{!detailed ? <div><Label>Valor do deslocamento (R$)</Label><CurrencyCentsInput value={Number(line.fixedAmountCents ?? line.unitCostCents)} onValueChange={(value) => onChange({ unitCostCents: value, fixedAmountCents: value, calculationMode: "FIXED" })}/></div> : <div className="self-end pb-2 text-right text-sm font-semibold">{formatCurrencyBRLFromCents(componentTotal(line))}</div>}<Button type="button" variant="secondary" className="self-end" onClick={toggle}>{detailed ? "Usar valor fixo" : "Calcular por km"}</Button></div>{detailed ? <div className="mt-2 grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-4"><div><Label>Origem</Label><Input value={line.travelDetails?.origin ?? ""} onChange={(e) => onChange({ travelDetails: { ...line.travelDetails!, origin: e.target.value } })}/></div><div><Label>Destino</Label><Input value={line.travelDetails?.destination ?? ""} onChange={(e) => onChange({ travelDetails: { ...line.travelDetails!, destination: e.target.value } })}/></div><NumberField label="Distância total (km)" value={(line.travelDetails?.distanceMilliKm ?? 0)/1000} onChange={(value) => onChange({ travelDetails: { ...line.travelDetails!, distanceMilliKm: Math.round(value*1000) } })}/><Money label="Custo por km (R$)" value={line.travelDetails?.costPerKmCents ?? 0} onChange={(value) => onChange({ travelDetails: { ...line.travelDetails!, costPerKmCents: value } })}/><Money label="Pedágio (R$)" value={line.travelDetails?.tollCents ?? 0} onChange={(value) => onChange({ travelDetails: { ...line.travelDetails!, tollCents: value } })}/><Money label="Estacionamento (R$)" value={line.travelDetails?.parkingCents ?? 0} onChange={(value) => onChange({ travelDetails: { ...line.travelDetails!, parkingCents: value } })}/><Money label="Alimentação (R$)" value={line.travelDetails?.mealsCents ?? 0} onChange={(value) => onChange({ travelDetails: { ...line.travelDetails!, mealsCents: value } })}/><Money label="Hospedagem (R$)" value={line.travelDetails?.lodgingCents ?? 0} onChange={(value) => onChange({ travelDetails: { ...line.travelDetails!, lodgingCents: value } })}/><Money label="Outras despesas (R$)" value={line.travelDetails?.otherCents ?? 0} onChange={(value) => onChange({ travelDetails: { ...line.travelDetails!, otherCents: value } })}/></div> : null}</div>;
}

function Money({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <div><Label>{label}</Label><CurrencyCentsInput value={value} onValueChange={onChange}/></div>; }
function Pct({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <div><Label>{label}</Label><PercentageBasisPointsInput value={value} onValueChange={onChange}/></div>; }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <div><Label>{label}</Label><DecimalValueBRInput value={value} maximumFractionDigits={2} onValueChange={(next) => onChange(Math.max(0, next))}/></div>; }
function Result({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) { return <div className={emphasis ? "rounded-lg border border-primary/30 bg-primary/5 p-3" : "rounded-lg border p-3"}><span className="text-xs text-muted-foreground">{label}</span><strong className="mt-1 block text-base">{value}</strong></div>; }
