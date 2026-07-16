import {
  BadgeDollarSign,
  Boxes,
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardCheck,
  Gauge,
  ShieldCheck,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";

export type Metric = {
  label: string;
  value: string;
  trend: string;
};

export type ModuleRecord = {
  title: string;
  description: string;
  status: string;
  value: string;
};

export type WorkspaceModule = {
  title: string;
  subtitle: string;
  metrics: Metric[];
  records: ModuleRecord[];
  pipeline: { label: string; value: number }[];
  actions: string[];
  actionLinks?: Record<string, string>;
};

export const dashboardStats = [
  {
    label: "Receita mensal",
    value: "R$ 86.420",
    trend: "+18%",
    icon: BadgeDollarSign,
  },
  {
    label: "OS concluídas",
    value: "148",
    trend: "+24",
    icon: ClipboardCheck,
  },
  {
    label: "Clientes ativos",
    value: "312",
    trend: "+16",
    icon: Users,
  },
  {
    label: "SLA médio",
    value: "92%",
    trend: "+7%",
    icon: ShieldCheck,
  },
];

export const revenueData = [
  { month: "Jan", value: 42 },
  { month: "Fev", value: 51 },
  { month: "Mar", value: 47 },
  { month: "Abr", value: 63 },
  { month: "Mai", value: 78 },
  { month: "Jun", value: 86 },
];

export const dashboardLists = {
  schedule: [
    "09:00 - Preventiva HVAC | Hospital Norte",
    "11:30 - Diagnóstico elétrico | Cond. Alpha",
    "14:00 - Instalação Split | Clínica Essencial",
    "16:30 - Retorno técnico | Padaria Central",
  ],
  orders: [
    "OS-1048 | Câmara fria | Em execução",
    "OS-1047 | Quadro elétrico | Aguardando peça",
    "OS-1046 | Ar-condicionado | Finalizada",
    "OS-1045 | PMOC | Agendada",
  ],
  finance: [
    "R$ 24.800 a receber esta semana",
    "R$ 9.430 em custos previstos",
    "12 notas fiscais pendentes",
    "Margem operacional em 34%",
  ],
  productivity: [
    "Equipe A: 96% de ocupação",
    "Equipe B: 87% de ocupação",
    "Tempo médio por OS: 2h18",
    "Retrabalho abaixo de 3%",
  ],
};

export const modules: Record<string, WorkspaceModule> = {
  crm: {
    title: "CRM",
    subtitle: "Pipeline comercial, propostas e oportunidades técnicas.",
    metrics: [
      { label: "Oportunidades", value: "42", trend: "+8 esta semana" },
      { label: "Propostas abertas", value: "R$ 128 mil", trend: "63% com follow-up" },
      { label: "Taxa de ganho", value: "38%", trend: "+5%" },
    ],
    records: [
      {
        title: "Condomínio Horizonte",
        description: "Contrato PMOC para 84 evaporadoras",
        status: "Proposta enviada",
        value: "R$ 48.600",
      },
      {
        title: "Mercado Real",
        description: "Manutenção corretiva em refrigeração",
        status: "Negociação",
        value: "R$ 12.900",
      },
      {
        title: "Clínica Prisma",
        description: "Plano anual de climatização",
        status: "Diagnóstico",
        value: "R$ 28.400",
      },
    ],
    pipeline: [
      { label: "Lead", value: 18 },
      { label: "Diagnóstico", value: 11 },
      { label: "Proposta", value: 8 },
      { label: "Fechamento", value: 5 },
    ],
    actions: ["Novo lead", "Criar proposta", "Agendar follow-up"],
    actionLinks: {
      "Novo lead": "/dashboard/crm/novo-lead",
    },
  },
  clientes: {
    title: "Clientes",
    subtitle: "Carteira ativa, contratos, contatos e histórico de atendimento.",
    metrics: [
      { label: "Clientes ativos", value: "312", trend: "+16 no mês" },
      { label: "Contratos recorrentes", value: "74", trend: "R$ 61 mil/mês" },
      { label: "Satisfação", value: "4,8/5", trend: "Últimos 30 dias" },
    ],
    records: [
      {
        title: "Hospital Norte",
        description: "Contrato crítico com SLA de 4 horas",
        status: "Ativo",
        value: "24 ativos",
      },
      {
        title: "Rede Essencial",
        description: "Unidades clínicas com PMOC mensal",
        status: "Recorrente",
        value: "8 unidades",
      },
      {
        title: "Condomínio Alpha",
        description: "Elétrica e climatização predial",
        status: "Em expansão",
        value: "R$ 18 mil/mês",
      },
    ],
    pipeline: [
      { label: "A", value: 82 },
      { label: "B", value: 144 },
      { label: "C", value: 69 },
      { label: "Risco", value: 17 },
    ],
    actions: ["Novo cliente", "Importar contatos", "Revisar contratos"],
  },
  agenda: {
    title: "Agenda",
    subtitle: "Programação diária das equipes e janelas de atendimento.",
    metrics: [
      { label: "Visitas hoje", value: "18", trend: "4 críticas" },
      { label: "Equipes em campo", value: "7", trend: "2 disponíveis" },
      { label: "Pontualidade", value: "91%", trend: "+6%" },
    ],
    records: [
      {
        title: "09:00 | Equipe A",
        description: "Preventiva HVAC no Hospital Norte",
        status: "Confirmado",
        value: "2 técnicos",
      },
      {
        title: "13:30 | Equipe C",
        description: "Instalação elétrica no Mercado Real",
        status: "Em rota",
        value: "3h previstas",
      },
      {
        title: "16:00 | Equipe B",
        description: "Retorno em garantia na Clínica Prisma",
        status: "Agendado",
        value: "Prioridade alta",
      },
    ],
    pipeline: [
      { label: "Manhã", value: 7 },
      { label: "Tarde", value: 9 },
      { label: "Noite", value: 2 },
      { label: "Atrasos", value: 1 },
    ],
    actions: ["Nova visita", "Reorganizar rota", "Enviar agenda"],
  },
  ordens: {
    title: "Ordens de Serviço",
    subtitle: "Abertura, execução, evidências, peças e fechamento técnico.",
    metrics: [
      { label: "OS abertas", value: "38", trend: "11 urgentes" },
      { label: "Tempo médio", value: "2h18", trend: "-14 min" },
      { label: "Retrabalho", value: "2,7%", trend: "Dentro da meta" },
    ],
    records: [
      {
        title: "OS-1048 | Câmara fria",
        description: "Baixa performance em compressor reserva",
        status: "Em execução",
        value: "R$ 3.820",
      },
      {
        title: "OS-1047 | Quadro elétrico",
        description: "Disjuntor aquecendo em carga parcial",
        status: "Aguardando peça",
        value: "R$ 1.740",
      },
      {
        title: "OS-1046 | Split inverter",
        description: "Limpeza, teste de pressão e relatório",
        status: "Finalizada",
        value: "R$ 680",
      },
    ],
    pipeline: [
      { label: "Aberta", value: 9 },
      { label: "Rota", value: 7 },
      { label: "Execução", value: 14 },
      { label: "Fechada", value: 21 },
    ],
    actions: ["Nova OS", "Despachar equipe", "Gerar relatório"],
  },
  precificacao: {
    title: "Precificação",
    subtitle: "Simulações de margem, mão de obra, deslocamento e materiais.",
    metrics: [
      { label: "Margem média", value: "34%", trend: "+4%" },
      { label: "Propostas geradas", value: "27", trend: "R$ 172 mil" },
      { label: "Ticket médio", value: "R$ 6.370", trend: "+11%" },
    ],
    records: [
      {
        title: "PMOC Condomínio Horizonte",
        description: "84 máquinas, 2 visitas mensais, materiais inclusos",
        status: "Margem saudável",
        value: "R$ 48.600",
      },
      {
        title: "Retrofit Mercado Real",
        description: "Troca de compressor e fluido refrigerante",
        status: "Revisar custo",
        value: "R$ 12.900",
      },
      {
        title: "Contrato Clínica Prisma",
        description: "SLA 8h com preventiva trimestral",
        status: "Aprovado",
        value: "R$ 28.400",
      },
    ],
    pipeline: [
      { label: "Mão obra", value: 32 },
      { label: "Peças", value: 28 },
      { label: "Impostos", value: 14 },
      { label: "Margem", value: 26 },
    ],
    actions: ["Nova simulação", "Duplicar proposta", "Exportar PDF"],
  },
  financeiro: {
    title: "Financeiro",
    subtitle: "Receitas, despesas, fluxo de caixa, cobranças e previsões.",
    metrics: [
      { label: "A receber", value: "R$ 64.200", trend: "Próximos 15 dias" },
      { label: "A pagar", value: "R$ 21.480", trend: "8 vencimentos" },
      { label: "Saldo previsto", value: "R$ 42.720", trend: "+12%" },
    ],
    records: [
      {
        title: "NF 1842 | Hospital Norte",
        description: "Contrato mensal de manutenção crítica",
        status: "Vence hoje",
        value: "R$ 14.800",
      },
      {
        title: "Fornecedor ClimaParts",
        description: "Peças para OS corretivas",
        status: "Agendado",
        value: "R$ 6.930",
      },
      {
        title: "Contrato Rede Essencial",
        description: "Faturamento recorrente mensal",
        status: "Recebido",
        value: "R$ 18.200",
      },
    ],
    pipeline: [
      { label: "Receitas", value: 86 },
      { label: "Custos", value: 39 },
      { label: "Lucro", value: 47 },
      { label: "Atrasos", value: 8 },
    ],
    actions: ["Nova receita", "Registrar despesa", "Emitir cobrança"],
  },
  estoque: {
    title: "Estoque",
    subtitle: "Peças, ferramentas, materiais, mínimos e reservas por OS.",
    metrics: [
      { label: "Itens cadastrados", value: "684", trend: "41 críticos" },
      { label: "Baixo estoque", value: "23", trend: "Repor esta semana" },
      { label: "Valor estocado", value: "R$ 118 mil", trend: "+3%" },
    ],
    records: [
      {
        title: "Gás R410A",
        description: "Cilindros reservados para contratos PMOC",
        status: "Baixo estoque",
        value: "4 un.",
      },
      {
        title: "Capacitor 35uF",
        description: "Alta saída em corretivas residenciais",
        status: "OK",
        value: "38 un.",
      },
      {
        title: "Disjuntor tripolar 63A",
        description: "Reservado para OS-1047",
        status: "Reservado",
        value: "2 un.",
      },
    ],
    pipeline: [
      { label: "Disponível", value: 684 },
      { label: "Reservado", value: 58 },
      { label: "Crítico", value: 23 },
      { label: "Compra", value: 31 },
    ],
    actions: ["Novo item", "Entrada", "Inventário"],
  },
  equipamentos: {
    title: "Equipamentos",
    subtitle: "Ativos dos clientes, histórico técnico e planos de manutenção.",
    metrics: [
      { label: "Ativos monitorados", value: "1.284", trend: "+96" },
      { label: "Preventivas vencendo", value: "47", trend: "Próximos 7 dias" },
      { label: "Disponibilidade", value: "97%", trend: "+2%" },
    ],
    records: [
      {
        title: "Chiller CH-02",
        description: "Hospital Norte | próxima preventiva em 3 dias",
        status: "Crítico",
        value: "240 TR",
      },
      {
        title: "Split SI-184",
        description: "Clínica Prisma | higienização trimestral",
        status: "Programado",
        value: "24k BTU",
      },
      {
        title: "Câmara CF-07",
        description: "Mercado Real | compressor em observação",
        status: "Acompanhar",
        value: "-18°C",
      },
    ],
    pipeline: [
      { label: "OK", value: 986 },
      { label: "Atenção", value: 183 },
      { label: "Crítico", value: 31 },
      { label: "Manutenção", value: 84 },
    ],
    actions: ["Novo ativo", "Plano PMOC", "Importar lista"],
  },
  relatorios: {
    title: "Relatórios",
    subtitle: "Indicadores executivos, operação, financeiro e performance técnica.",
    metrics: [
      { label: "Relatórios gerados", value: "56", trend: "Este mês" },
      { label: "SLA consolidado", value: "92%", trend: "+7%" },
      { label: "Margem por serviço", value: "34%", trend: "+4%" },
    ],
    records: [
      {
        title: "Performance operacional",
        description: "SLA, produtividade e tempo médio por equipe",
        status: "Atualizado",
        value: "Hoje",
      },
      {
        title: "Resultado financeiro",
        description: "Receitas, custos, margem e inadimplência",
        status: "Mensal",
        value: "Jun/26",
      },
      {
        title: "PMOC consolidado",
        description: "Ativos atendidos, pendências e evidências",
        status: "Pronto",
        value: "PDF",
      },
    ],
    pipeline: [
      { label: "Operação", value: 18 },
      { label: "Financeiro", value: 12 },
      { label: "Clientes", value: 15 },
      { label: "Técnico", value: 11 },
    ],
    actions: ["Gerar relatório", "Exportar dados", "Agendar envio"],
  },
  "biblioteca-tecnica": {
    title: "Biblioteca Técnica",
    subtitle: "Procedimentos, manuais, checklists e padrões de execução.",
    metrics: [
      { label: "Documentos", value: "248", trend: "+12" },
      { label: "Checklists ativos", value: "34", trend: "8 revisados" },
      { label: "Acessos semanais", value: "612", trend: "+19%" },
    ],
    records: [
      {
        title: "Checklist PMOC Split",
        description: "Rotina padrão para evaporadoras e condensadoras",
        status: "Publicado",
        value: "v2.4",
      },
      {
        title: "Procedimento R410A",
        description: "Recolhimento, carga e teste de estanqueidade",
        status: "Revisado",
        value: "Técnico",
      },
      {
        title: "Manual Chiller Carrier",
        description: "Parâmetros de operação e alarmes",
        status: "Favorito",
        value: "PDF",
      },
    ],
    pipeline: [
      { label: "Manuais", value: 92 },
      { label: "Checklists", value: 34 },
      { label: "Normas", value: 48 },
      { label: "Modelos", value: 74 },
    ],
    actions: ["Novo documento", "Criar checklist", "Organizar pastas"],
  },
  "assistente-ia": {
    title: "IA Assistente",
    subtitle: "Apoio para diagnósticos, propostas, relatórios e atendimento.",
    metrics: [
      { label: "Interações", value: "1.482", trend: "+31%" },
      { label: "Relatórios gerados", value: "86", trend: "Este mês" },
      { label: "Tempo economizado", value: "42h", trend: "Estimado" },
    ],
    records: [
      {
        title: "Diagnóstico de baixa refrigeração",
        description: "Roteiro técnico para compressor e troca térmica",
        status: "Pronto",
        value: "5 passos",
      },
      {
        title: "Resumo OS-1048",
        description: "Texto executivo com evidências e pendências",
        status: "Gerado",
        value: "PDF",
      },
      {
        title: "Proposta PMOC",
        description: "Escopo comercial com SLA e recorrência",
        status: "Rascunho",
        value: "R$ 48.600",
      },
    ],
    pipeline: [
      { label: "Diagnóstico", value: 42 },
      { label: "Propostas", value: 27 },
      { label: "Relatórios", value: 86 },
      { label: "Atendimento", value: 64 },
    ],
    actions: ["Novo chat", "Gerar relatório", "Criar proposta"],
  },
  configuracoes: {
    title: "Configurações",
    subtitle: "Empresa, usuários, permissões, integrações e preferências.",
    metrics: [
      { label: "Usuários", value: "24", trend: "5 administradores" },
      { label: "Integrações", value: "6", trend: "4 ativas" },
      { label: "Perfis de acesso", value: "8", trend: "Padronizados" },
    ],
    records: [
      {
        title: "Dados da empresa",
        description: "CNPJ, endereço, marca e documentos fiscais",
        status: "Completo",
        value: "100%",
      },
      {
        title: "Permissões técnicas",
        description: "Acesso por equipe, filial e cargo",
        status: "Ativo",
        value: "8 perfis",
      },
      {
        title: "Notificações",
        description: "Alertas de SLA, estoque e financeiro",
        status: "Configurado",
        value: "12 regras",
      },
    ],
    pipeline: [
      { label: "Empresa", value: 100 },
      { label: "Usuários", value: 24 },
      { label: "Regras", value: 12 },
      { label: "APIs", value: 6 },
    ],
    actions: ["Editar empresa", "Novo usuário", "Conectar API"],
  },
  perfil: {
    title: "Perfil",
    subtitle: "Dados do usuário, preferências, segurança e atividade recente.",
    metrics: [
      { label: "Tarefas hoje", value: "12", trend: "8 concluídas" },
      { label: "Aprovações", value: "5", trend: "Pendentes" },
      { label: "Sessões", value: "3", trend: "Dispositivos" },
    ],
    records: [
      {
        title: "Pedro Vieira",
        description: "Administrador operacional | ProFlow Services",
        status: "Online",
        value: "Tech Lead",
      },
      {
        title: "Preferências",
        description: "Tema, notificações e página inicial",
        status: "Sincronizado",
        value: "Dashboard",
      },
      {
        title: "Atividade",
        description: "Última alteração em OS-1048",
        status: "Hoje",
        value: "11:42",
      },
    ],
    pipeline: [
      { label: "OS", value: 8 },
      { label: "CRM", value: 3 },
      { label: "Financeiro", value: 2 },
      { label: "Relatórios", value: 4 },
    ],
    actions: ["Editar perfil", "Segurança", "Preferências"],
  },
};

export const dashboardHighlights = [
  { title: "Receitas", value: "R$ 86.420", icon: TrendingUp },
  { title: "Serviços", value: "148 concluídos", icon: Wrench },
  { title: "Clientes", value: "312 ativos", icon: Users },
  { title: "Produtividade", value: "91% ocupação", icon: Gauge },
  { title: "Agenda", value: "18 visitas hoje", icon: CalendarCheck },
  { title: "Estoque", value: "23 itens críticos", icon: Boxes },
  { title: "CRM", value: "R$ 128 mil abertos", icon: BriefcaseBusiness },
  { title: "OS recentes", value: "38 em andamento", icon: ClipboardCheck },
];
