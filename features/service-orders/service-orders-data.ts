import type { BadgeProps } from "@/components/ui/badge";

export type ServiceOrder = {
  id: string;
  scheduledFor: string;
  customer: string;
  location: string;
  category: string;
  service: string;
  technician: string;
  vehicle?: string;
  supervisor: string;
  status: string;
  tone: NonNullable<BadgeProps["variant"]>;
};

export const serviceOrders: ServiceOrder[] = [
  {
    id: "OS-2026071",
    scheduledFor: "Hoje, 08:30",
    customer: "Pousada Brisa do Mar",
    location: "Centro, Porto Seguro - BA",
    category: "Climatização",
    service: "Instalação 2x Split Inverter 12k",
    technician: "Téc. Carlos",
    vehicle: "VW Voyage",
    supervisor: "Vanderley Junior",
    status: "Em execução",
    tone: "warning",
  },
  {
    id: "OS-2026072",
    scheduledFor: "Amanhã, 14:00",
    customer: "Residência Roberto",
    location: "Orla Norte, Porto Seguro - BA",
    category: "Elétrica",
    service: "Revisão Quadro de Distribuição",
    technician: "Não atribuído",
    supervisor: "Uesley Costa",
    status: "Agendado",
    tone: "neutral",
  },
  {
    id: "OS-2026068",
    scheduledFor: "Ontem",
    customer: "Restaurante Sabor Baiano",
    location: "Passarela do Descobrimento",
    category: "Climatização",
    service: "Preventiva 4x AC Janela",
    technician: "Téc. Marcos",
    supervisor: "Vanderley Junior",
    status: "Finalizado",
    tone: "success",
  },
];
