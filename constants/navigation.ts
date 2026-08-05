import {
  BarChart3,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  Calculator,
  ClipboardList,
  FileText,
  CreditCard,
  Package,
  Settings,
  UserRound,
  Users,
  Warehouse,
  Wrench,
  Handshake,
  Activity,
  Workflow,
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
  { title: "Central Operacional", href: "/dashboard/central-operacional", icon: Activity },
  { title: "Automações", href: "/dashboard/automacoes", icon: Workflow },
  { title: "CRM", href: "/dashboard/crm", icon: BriefcaseBusiness, permission: "CRM_VIEW" },
  { title: "Clientes", href: "/dashboard/clientes", icon: Users, permission: "CLIENTS_VIEW" },
  { title: "Agenda", href: "/dashboard/agenda", icon: CalendarDays, permission: "AGENDA_VIEW" },
  { title: "Ordens", href: "/dashboard/ordens", icon: ClipboardList, permission: "ORDERS_VIEW" },
  { title: "Orçamentos", href: "/dashboard/orcamentos", icon: FileText },
  { title: "Precificação", href: "/dashboard/precificacao", icon: Calculator },
  { title: "Financeiro", href: "/dashboard/financeiro", icon: CreditCard, permission: "FINANCE_VIEW" },
  { title: "Estoque", href: "/dashboard/estoque", icon: Warehouse, permission: "INVENTORY_VIEW" },
  { title: "Fornecedores", href: "/dashboard/fornecedores", icon: Handshake },
  { title: "Equipamentos", href: "/dashboard/equipamentos", icon: Wrench, permission: "EQUIPMENT_VIEW" },
  { title: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3 },
  { title: "Documentos", href: "/dashboard/documentos", icon: FileText },
  { title: "Biblioteca Técnica", href: "/dashboard/biblioteca-tecnica", icon: BookOpen },
  { title: "IA Assistente", href: "/dashboard/assistente-ia", icon: Bot },
  { title: "Equipe", href: "/dashboard/equipe", icon: Users, permission: "TEAM_VIEW" },
  { title: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
  { title: "Perfil", href: "/dashboard/perfil", icon: UserRound },
];

export const quickActions = [
  { title: "Nova OS", icon: ClipboardList },
  { title: "Novo cliente", icon: Users },
  { title: "Entrada estoque", icon: Package },
];
