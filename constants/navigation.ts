import {
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  CreditCard,
  ClipboardList,
  Settings,
  Wrench,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/auth/permissions";

export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
};

export const dashboardNavigation: NavigationItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { title: "CRM", href: "/dashboard/crm", icon: BriefcaseBusiness, permission: "CRM_VIEW" },
  { title: "Clientes", href: "/dashboard/clientes", icon: Users, permission: "CLIENTS_VIEW" },
  { title: "Ordens de Serviço", href: "/dashboard/ordens", icon: ClipboardList, permission: "ORDERS_VIEW" },
  { title: "Precificação", href: "/dashboard/precificacao", icon: Calculator },
  { title: "Financeiro", href: "/dashboard/financeiro", icon: CreditCard, permission: "FINANCE_VIEW" },
  { title: "Equipamentos", href: "/dashboard/equipamentos", icon: Wrench, permission: "EQUIPMENT_VIEW" },
  { title: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
  { title: "Perfil", href: "/dashboard/perfil", icon: UserRound },
];
