import type { BadgeProps } from "@/components/ui/badge";

export type DashboardMetric = {
  label: string;
  value: string;
  description: string;
  tone: NonNullable<BadgeProps["variant"]>;
};

export type RecentServiceOrder = {
  id: string;
  title: string;
  customer: string;
  scheduledFor: string;
  status: string;
};

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "Receita do Mês",
    value: "R$ 45.230,00",
    description: "+12% vs mês anterior",
    tone: "success",
  },
  {
    label: "Serviços em Andamento",
    value: "14",
    description: "3 instalações pendentes",
    tone: "default",
  },
  {
    label: "Orçamentos Aprovados",
    value: "8",
    description: "Conversão de 68%",
    tone: "neutral",
  },
  {
    label: "Contas a Receber",
    value: "R$ 12.400,00",
    description: "Vencem esta semana",
    tone: "warning",
  },
];

export const recentServiceOrders: RecentServiceOrder[] = [
  {
    id: "OS-2026071",
    title: "Instalação Split Inverter 12k BTUs",
    customer: "Condomínio Villa Real",
    scheduledFor: "Hoje, 14:30",
    status: "Em execução",
  },
  {
    id: "OS-2026072",
    title: "Revisão de Quadro Elétrico",
    customer: "Pousada Brisa do Mar",
    scheduledFor: "Amanhã, 08:30",
    status: "Agendado",
  },
  {
    id: "OS-2026068",
    title: "Preventiva 4x AC Janela",
    customer: "Restaurante Sabor Baiano",
    scheduledFor: "Ontem",
    status: "Finalizado",
  },
];
