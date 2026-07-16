import {
  BarChart3,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  Calculator,
  ClipboardList,
  CreditCard,
  Package,
  Settings,
  UserRound,
  Users,
  Warehouse,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const dashboardNavigation: NavigationItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { title: "CRM", href: "/dashboard/crm", icon: BriefcaseBusiness },
  { title: "Clientes", href: "/dashboard/clientes", icon: Users },
  { title: "Agenda", href: "/dashboard/agenda", icon: CalendarDays },
  { title: "Ordens", href: "/dashboard/ordens", icon: ClipboardList },
  { title: "Precificação", href: "/dashboard/precificacao", icon: Calculator },
  { title: "Financeiro", href: "/dashboard/financeiro", icon: CreditCard },
  { title: "Estoque", href: "/dashboard/estoque", icon: Warehouse },
  { title: "Equipamentos", href: "/dashboard/equipamentos", icon: Wrench },
  { title: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3 },
  { title: "Biblioteca Técnica", href: "/dashboard/biblioteca-tecnica", icon: BookOpen },
  { title: "IA Assistente", href: "/dashboard/assistente-ia", icon: Bot },
  { title: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
  { title: "Perfil", href: "/dashboard/perfil", icon: UserRound },
];

export const quickActions = [
  { title: "Nova OS", icon: ClipboardList },
  { title: "Novo cliente", icon: Users },
  { title: "Entrada estoque", icon: Package },
];
