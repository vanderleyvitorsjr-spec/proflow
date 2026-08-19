import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  Calculator,
  ClipboardList,
  FileText,
  CreditCard,
  Package,
  ReceiptText,
  Boxes,
  Settings,
  UserRound,
  Users,
  Warehouse,
  Wrench,
  Handshake,
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
  { title: "Agenda", href: "/dashboard/agenda", icon: CalendarDays, permission: "AGENDA_VIEW" },
  { title: "Ordens de Serviço", href: "/dashboard/ordens", icon: ClipboardList, permission: "ORDERS_VIEW" },
  { title: "Orçamentos", href: "/dashboard/orcamentos", icon: FileText },
  { title: "Serviços", href: "/dashboard/servicos", icon: Wrench },
  { title: "Produtos", href: "/dashboard/produtos", icon: Boxes },
  { title: "Precificação", href: "/dashboard/precificacao", icon: Calculator },
  { title: "Financeiro", href: "/dashboard/financeiro", icon: CreditCard, permission: "FINANCE_VIEW" },
  { title: "Recibos", href: "/dashboard/recibos", icon: ReceiptText, permission: "FINANCE_VIEW" },
  { title: "Estoque", href: "/dashboard/estoque", icon: Warehouse, permission: "INVENTORY_VIEW" },
  { title: "Fornecedores", href: "/dashboard/fornecedores", icon: Handshake },
  { title: "Equipamentos", href: "/dashboard/equipamentos", icon: Wrench, permission: "EQUIPMENT_VIEW" },
  { title: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3 },
  { title: "IA Assistente", href: "/dashboard/assistente-ia", icon: Bot },
  { title: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
  { title: "Perfil", href: "/dashboard/perfil", icon: UserRound },
];

export const quickActions = [
  { title: "Nova OS", icon: ClipboardList },
  { title: "Novo cliente", icon: Users },
  { title: "Entrada estoque", icon: Package },
];
