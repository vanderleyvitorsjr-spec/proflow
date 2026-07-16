# ProFlow

ProFlow é uma plataforma SaaS multiempresa para gestão de empresas de climatização,
refrigeração, elétrica e manutenção.

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
