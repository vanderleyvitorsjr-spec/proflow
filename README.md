# ProFlow

O ProFlow inclui Orçamentos profissionais, Catálogo de Serviços, Cotações e
Compras, histórico técnico de Equipamentos e documentos A4. Os fluxos seguem a
arquitetura local em camadas e permanecem preparados para migração ao servidor.

O ProFlow adota interface integralmente em português do Brasil, formatação
brasileira centralizada e módulos operacionais conectados por actions públicas.
Consulte [os padrões de interface](docs/INTERFACE_STANDARDS.md), [as regras de
português](docs/PORTUGUESE_BR_STANDARDS.md), [o Workspace](docs/WORKSPACE.md),
[a Agenda](docs/AGENDA.md), [a Central Operacional](docs/OPERATIONAL_CENTER.md)
e [os Relatórios](docs/REPORTS.md).

Os fluxos comerciais e técnicos completos estão descritos no
[Editor de Orçamentos](docs/QUOTE_EDITOR.md), na
[conversão para Ordem](docs/QUOTE_TO_ORDER.md), em
[Compras e Recebimentos](docs/PURCHASE_RECEIVING.md), na
[Manutenção Preventiva](docs/PREVENTIVE_MAINTENANCE.md) e na
[Central de Documentos](docs/DOCUMENT_CENTER.md).

O uso diário também está documentado em [Cliente 360](docs/CUSTOMER_360.md),
[Funil Comercial](docs/CRM_PIPELINE.md), [Operações Financeiras](docs/FINANCIAL_OPERATIONS.md),
[Gestão de Inventário](docs/INVENTORY_MANAGEMENT.md), [Busca Global](docs/GLOBAL_SEARCH.md)
e [Notificações](docs/NOTIFICATIONS.md).

As evoluções locais também estão documentadas em [Metas](docs/GOALS.md),
[Linha do Tempo](docs/OPERATIONAL_TIMELINE.md),
[Checklist](docs/WORKSPACE_CHECKLIST.md), [Equipe e Materiais](docs/ORDER_TEAM.md)
e [Custos](docs/ORDER_COSTS.md).

ProFlow é uma plataforma SaaS multiempresa para gestão de empresas de climatização,
refrigeração, elétrica e manutenção.

## Autenticação e ambiente

O Dashboard usa Supabase Auth com sessão SSR em cookies. Configure `.env.example`, aplique as migrations no ambiente PostgreSQL/Supabase de desenvolvimento e crie o usuário no Supabase Auth. No primeiro acesso, o onboarding cria a empresa e vincula o usuário como Proprietário.

`Empresa.id` é o tenant canônico. Consulte `docs/AUTHENTICATION.md`, `docs/MULTITENANCY.md`, `docs/PERMISSIONS.md` e `docs/BRAZILIAN_DATA_STANDARDS.md`.

## Estado Atual

O projeto possui um MVP navegável com login fake, dashboard, sidebar, topbar,
dark/light mode e páginas internas acessíveis para os principais módulos.

Status detalhado: [PROJECT_STATUS.md](./PROJECT_STATUS.md)

## Fundação Técnica

- Next.js App Router
- TypeScript
- TailwindCSS
- Prisma ORM
- Supabase
- React Hook Form
- Zod
- TanStack Query
- Lucide React
- Recharts
- Framer Motion
- ESLint
- Prettier

## Módulos Navegáveis

- Dashboard
- CRM
- Clientes
- Agenda
- Ordens de Serviço
- Precificação
- Financeiro
- Estoque
- Equipamentos
- Relatórios
- Biblioteca Técnica
- IA Assistente
- Configurações
- Perfil

## Estrutura

```txt
app/                 Rotas e composição de páginas
components/          Componentes reutilizáveis de UI e layout
constants/           Navegação e constantes compartilhadas
features/            Interfaces e dados por domínio funcional
lib/                 Clientes e utilitários de infraestrutura
prisma/              Schema, config e migrations do banco
providers/           Providers globais de tema e cache
schemas/             Validação com Zod
public/              Assets estáticos
```

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run format
npm run prisma:generate
npm run prisma:migrate
```

## Ambiente

Copie `.env.example` para `.env.local` e preencha as credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

## Banco de Dados

A modelagem Prisma multi tenant está em `prisma/schema.prisma`.

A migration inicial está em:

```txt
prisma/migrations/20260709123000_initial_schema/migration.sql
```
