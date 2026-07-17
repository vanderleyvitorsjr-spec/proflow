# Status do Projeto ProFlow

### Fundação funcional — Precificação Ciclo B (16/07/2026)

- Precificação passou a consumir Estoque e Equipamentos exclusivamente por contratos públicos resumidos, actions públicas aditivas e gateways próprios, sem acessar repositories, adapters ou tipos internos completos dos módulos de origem.
- O envelope local evoluiu explicitamente da versão 1 para a versão 2, preservando templates, simulações, composições, perfis, cenários, IDs, sequências, revisões, históricos, preferências, arquivamentos e backup anterior validado com Zod.
- Materiais reais usam custo médio e escala inteira do Estoque, registram disponibilidade, perda técnica, custo original, eventual custo manual justificado e confirmação auditável de insuficiência sem reservar ou consumir saldo.
- Equipamentos reais suportam custo derivado por hora e custos manuais por hora ou uso; ativos de cliente e terceiros não incorporam depreciação patrimonial própria.
- Snapshots técnicos registram código, origem, valores, condição, disponibilidade, método, atualização da origem e data da consulta; nenhuma origem histórica é recalculada automaticamente.
- Divergências de custo, disponibilidade, arquivamento, status, condição, valor, depreciação, manutenção e alteração manual são derivadas comparando snapshot e referência pública atual.
- Atualizar a origem e manter o valor são decisões explícitas, geram revisão imutável e histórico; substituições criam novo snapshot e preservam o componente anterior nas revisões.
- O detalhamento passou a exibir origens reais, links para Estoque e Equipamentos, snapshots, divergências e ações técnicas; cenários também mostram custos reais, snapshots e componentes manualmente modificados.
- Integrações com Clientes, Ordens, Financeiro, reservas, consumos, lançamentos, Google Maps, equipes, Event Bus, Prisma, Supabase e autenticação permanecem reservadas ao Ciclo C ou etapas posteriores.

### Fundação funcional — Precificação Ciclo A (16/07/2026)

- Precificação passou a seguir `Página → Action → Service → Repository → Storage Adapter`; somente o adapter próprio acessa `localStorage`.
- O envelope `proflow:precificacao:v1` armazena templates, composições, perfis locais de mão de obra, simulações, cenários, preferências, revisão incremental e backup validado com Zod.
- Valores monetários usam centavos inteiros e percentuais usam basis points; as fórmulas separam custo, overhead, impostos, comissão, lucro, margem e markup sem resultados persistidos como fonte independente.
- A biblioteca de serviços possui templates reutilizáveis, versões, composições, duplicação e arquivamento, com carga inicial neutra baseada apenas nos antigos mocks visuais.
- Simulações suportam materiais manuais com perda técnica, mão de obra por perfil, equipamentos por hora ou uso, deslocamento manual, overhead e outros custos.
- Preços mínimo, recomendado, premium e promocional são derivados; preços promocionais abaixo do mínimo exigem confirmação explícita.
- Cada alteração relevante gera revisão imutável com parâmetros, componentes, regras comerciais e snapshot do resultado; duplicações e cenários começam na versão 1 com IDs e históricos próprios.
- A precificação reversa informa custo máximo, lucro, margem, redução necessária e componentes de maior impacto sem modificar automaticamente a composição.
- A nova ficha `/dashboard/precificacao/[id]` reúne componentes, custos, preços, resultado, análise reversa, revisões e histórico append-only.
- Estoque, Equipamentos, Clientes, Ordens, Financeiro, Google Maps, equipes, Prisma, Supabase, autenticação e Event Bus continuam reservados aos ciclos seguintes.

### Fundação funcional — Estoque Ciclo C (16/07/2026)

- O envelope local do Estoque evoluiu explicitamente da versão 2 para a versão 3, preservando itens, movimentos, reservas, IDs, sequências, preferências, revisões e backups dos Ciclos A e B, com validação Zod integral.
- Compras passaram a ser agregados persistentes com fornecedor em snapshot, itens e custos em centavos, quantidades na escala da unidade, status, recebimentos, vínculo financeiro, conciliação e histórico append-only.
- Rascunhos podem ser criados e editados; pedidos confirmados sem recebimento aceitam ajustes controlados, enquanto compras recebidas preservam integralmente entradas e rastreabilidade.
- Recebimentos totais ou parciais geram movimentos `ENTRY` vinculados e atualizam compra, estoque físico, custo médio e histórico em uma única gravação; o cancelamento da entrada reprocessa a quantidade recebida e o status da compra.
- Devoluções ao fornecedor geram movimentos `SUPPLIER_RETURN` vinculados ao recebimento original, reutilizam seu custo e reduzem o saldo físico sem alterar pagamentos automaticamente.
- O Financeiro foi ampliado aditivamente por contrato e actions públicas resumidas; o gateway do Estoque não acessa repository, adapter nem entidades financeiras internas completas.
- A geração de conta a pagar é explícita e idempotente; aumentos permitem complemento confirmado, enquanto reduções, cancelamentos e alterações manuais apenas sinalizam divergências e preservam pagamentos.
- A ficha da compra reúne fornecedor, itens, movimentos, resumo financeiro, conciliação, ações seguras e histórico, mantendo `Página → Action → Service → Repository → Storage Adapter`.
- Fornecedores como módulo, transferências, lotes e validade avançados, Equipamentos, emissão fiscal, conciliação bancária, Event Bus, Prisma, Supabase e autenticação continuam fora deste ciclo.

## Módulos Implementados

- Login com autenticação fake e sessão em `localStorage`.
- Layout privado compartilhado em `/dashboard`.
- Sidebar responsiva, recolhível e com destaque de página ativa.
- Topbar com busca global visual, notificações, alternância de tema, empresa ativa e perfil.
- Dashboard com cards, gráfico visual, agenda, OS recentes, financeiro e produtividade.
- Páginas navegáveis:
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
- Rota legada `/dashboard/os` redirecionando para `/dashboard/ordens`.
- Modelagem Prisma multi tenant com schema e migration inicial.
- Fundação do domínio financeiro adicionada no schema: `FinancialCategory`, `FinancialAccount`, `TransactionType`, `ExpenseClassification` e `AccountType`.
- Fundação do domínio financeiro adicionada no schema: `FinancialCategory`, `FinancialAccount`, `TransactionType`, `ExpenseClassification` e `AccountType`.
- Expansão de `ContaReceber` no schema para suportar movimentações financeiras:
  - Campos monetários adicionais (`grossAmount`, `discountAmount`, `interestAmount`, `penaltyAmount`, `netAmount`)
  - Campos de parcelamento/opcionais (`installmentNumber`, `installmentCount`, `paymentMethod`)
  - `financialTransactionId` e `financialAccountId` (opcionais) e `createdById` (opcional)
  - Relações inversas adicionadas em `Usuario`, `Empresa`, `Cliente`, `OrdemServico`, `Contrato`, `FinancialTransaction` e `FinancialAccount`
  - Migração criada: `20260711170000_contas_receber_financial_transaction` (não aplicada)
- Cliente Prisma compartilhado e seguro para uso no servidor, com prevenção de múltiplas instâncias em desenvolvimento.
- Tema claro/escuro via `next-themes`.
- Build e lint sem erros.

- Fundação de `Centros de Custo` adicionada ao schema:
  - `CentroCusto` model expandido para suportar hierarquia (`parentId`, `children`), `color`, `icon` e campo `isActive` (mapeado para a coluna existente `active`).
  - Restrições únicas e índices garantidos por empresa: `code` (unique), `name` (unique por empresa via índice parcial), `parentId`, `deletedAt`.
  - Migração criada: `20260711182000_centros_custo_foundation` (não aplicada)
- Fundação do módulo `Patrimônio` adicionada ao schema:
- Model `Asset` e `AssetCategory` adicionados (`patrimonios`, `categorias_patrimoniais`)
- Enums criados: `AssetStatus`, `AssetCondition`
- Migração criada: `20260711194000_patrimonio_foundation` (não aplicada)
- Índices e uniqueness por `companyId` para `assetCode` e `name` garantidos
- Fundação do módulo `Equipamentos Instalados` (histórico técnico) adicionada:
- Model `EquipmentServiceHistory` adicionado para armazenar eventos técnicos de equipamentos instalados
- Enum `EquipmentHistoryEventType` criado
- Migração criada: `20260711212000_equipamento_historico_foundation` (não aplicada)
- Relações inversas adicionadas em `Empresa`, `EquipamentoInstalado`, `OrdemServico` e `Usuario`
- Índices e constraints por `companyId` e `installedEquipmentId` garantidos

- Fundação de `Planos de Manutenção Preventiva` adicionada/estendida ao schema:
  - Model existente `ManutencaoPreventiva` estendido para suportar planejamento de manutenção (frequência, intervalos, datas previstas, estimativas e configurações de auto-criação)
  - Enum `MaintenanceFrequencyType` criado
  - Migração criada: `20260711230000_manutencao_preventiva_plans_foundation` (não aplicada)
  - Índices adicionados: `[companyId, installedEquipmentId]`, `[companyId, nextServiceDate]`, `[companyId, isActive]`, `[companyId, contractId]`, `[companyId, deletedAt]`

- Fundação de `Checklists Técnicos` adicionada ao schema:
  - Models `ChecklistTemplate` e `ChecklistTemplateItem` criados
  - Enums `ChecklistCategory` e `ChecklistItemType` criados
  - Migração criada: `20260711240000_checklist_templates_foundation` (não aplicada)
  - Índices e constraint de versão única: `[companyId, name, version]` (unique), `[companyId, category]`, `[companyId, isActive]`, `[companyId, name]`, `[companyId, deletedAt]` e índices do lado dos items
- Fundação do modelo de aceitação/assinatura de cliente para Ordens de Serviço adicionada ao schema:
  - Model `ServiceOrderAcceptance` criado
  - Enums `ServiceOrderAcceptanceType` e `ServiceOrderAcceptanceStatus` criados
  - Relações com `Empresa`, `OrdemServico`, `Cliente` e `ServiceOrderAttachment`
  - Migração criada: `20260711270000_service_order_acceptances_foundation` (não aplicada)
  - Índices adicionados: `[companyId, serviceOrderId]`, `[companyId, clientId]`, `[companyId, status]`, `[companyId, acceptanceType]`, `[companyId, acceptedAt]`, `[companyId, rejectedAt]`, `[companyId, deletedAt]`

## Módulos Incompletos

- Autenticação real.
- Autorização por permissões.
- CRUD real dos módulos.
- Integração das telas com Prisma.
- Integração com Supabase.
- Upload real de fotos, arquivos e assinaturas.
- Busca global funcional.
- Notificações reais.
- Relatórios exportáveis.
- Assistente IA integrado a modelo real.
- Validações completas de formulários.
- Testes automatizados.

## Estrutura de Pastas

```txt
app/                 Rotas, layouts e páginas do App Router
app/dashboard/       Área privada e módulos navegáveis
components/layout/   Shell principal do dashboard
components/ui/       Componentes base reutilizáveis
constants/           Navegação e constantes compartilhadas
features/dashboard/  Interface do dashboard
features/workspace/  Dados mockados e página reutilizável dos módulos
features/crm/        Componentes e dados antigos do CRM
features/pricing/    Componentes e dados antigos de precificação
features/service-orders/ Componentes e dados antigos de OS
lib/                 Utilitários e clientes de infraestrutura
prisma/              Schema, config e migrations
providers/           Providers globais
schemas/             Schemas Zod
public/              Assets estáticos
```

## Pendências

- Conectar Prisma Client aos repositories e services.
- Criar repositories por entidade principal.
- Substituir dados mockados por consultas reais.
- Implementar seed inicial para empresa, usuário admin e dados de demonstração.
- Criar formulários de criação e edição.
- Aplicar soft delete em operações reais.
- Validar isolamento multi tenant em todas as queries.
- Criar middleware de proteção de rotas.
- Configurar `.env.local` real.
- Revisar módulos antigos em `features/crm`, `features/pricing` e `features/service-orders`.

## Bugs Conhecidos

- A sessão fake depende apenas de `localStorage`.
- Rotas privadas são protegidas no client, não no server.
- Botões de ação dos módulos ainda são visuais.
- Busca global ainda não executa pesquisa.
- Notificações não possuem dados reais.
- O Prisma possui migration gerada, mas ainda não foi aplicada em banco real.

## Próximos Passos

1. Implementar Prisma Client compartilhado.
2. Criar seed inicial.
3. Implementar autenticação real.
4. Criar CRUD de Clientes.
5. Criar CRUD de Ordens de Serviço.
6. Conectar Agenda, Estoque e Financeiro ao banco.
7. Implementar permissões multi tenant.
8. Adicionar testes de rotas, repositories e services.

## Modernização Visual Global

### Lote 1 — Dashboard, CRM e Clientes (15/07/2026)

- Dashboard consolidado em estrutura executiva densa, com cabeçalho compacto, indicadores financeiros em faixa, blocos Comercial e Operacional horizontais, três painéis analíticos e alertas compactos.
- CRM padronizado com cabeçalho e toolbar integrados, indicadores em faixa, pipeline horizontal compacto, colunas de 16rem e visualização em lista preservada.
- Formulário de Novo Lead alinhado à linguagem visual do CRM, com seções compactas e melhor aproveitamento horizontal.
- Clientes padronizado com cabeçalho e filtros integrados, métricas em faixa, tabela como visualização principal e cartões compactos como alternativa.
- Funcionalidades, filtros, dados, rotas, autenticação, Prisma e regras de negócio preservados.

### Lote 2 — Agenda e Ordens de Serviço (15/07/2026)

- Agenda padronizada com cabeçalho e toolbar integrados, métricas em faixa, calendário ampliado, visualizações de dia, semana e mês compactadas e painel lateral reduzido.
- Eventos, equipes, navegação de períodos, botão Hoje, busca e filtros por tipo e responsável preservados.
- Ordens de Serviço padronizadas com cabeçalho compacto, filtros integrados, cinco métricas em faixa, tabela principal densa e Kanban com colunas de 16rem.
- Status, prioridades, clientes, técnicos, datas, valores, checklist, busca, filtros e alternância entre tabela e Kanban preservados.
- Shell, estilos globais, autenticação, Prisma, banco, rotas e demais módulos não foram alterados.

### Lote 3 — Precificação e Financeiro (15/07/2026)

- Precificação padronizada com cabeçalho e toolbar compactos, indicadores em faixa horizontal, calculadora com melhor aproveitamento lateral e resumo de cálculo fixo e denso.
- Catálogo de serviços preservado em lista e cartões, com filtros integrados, tabela compacta e preços mínimo, sugerido e premium mantidos.
- Financeiro padronizado com cabeçalho, período, filtros e ações integrados, navegação compacta, indicadores em faixa e grid horizontal para fluxo de caixa e contas.
- Movimentações mantidas como conteúdo principal, com busca, filtros, status, valores e ações preservados em tabela de maior densidade.
- Cálculos, dados, handlers, formatação brasileira, responsividade e dark mode foram preservados; shell, estilos globais, autenticação, Prisma, banco, rotas e demais módulos não foram alterados.

### Lote 4 — Estoque e Equipamentos (15/07/2026)

- Estoque padronizado com cabeçalho, ações, busca, filtros e seletor de visualização integrados, seis indicadores em faixa horizontal e tabela principal de maior densidade.
- Cartões de estoque compactados sem remover códigos, categorias, quantidades, reservas, disponibilidade, estoque mínimo, localização, custos, valor total e compras pendentes.
- Equipamentos padronizados com cabeçalho e filtros integrados, cinco indicadores em faixa horizontal, tabela principal compacta e cartões como visualização alternativa.
- Fabricante, modelo, série, patrimônio, propriedade, responsável, localização, status, manutenção, garantia, valores e vínculos existentes foram preservados.
- Estados críticos, baixo estoque e manutenção continuam destacados de forma discreta; cálculos, dados, handlers, formatação brasileira, responsividade e dark mode foram mantidos.
- Não foram criados componentes globais neste lote: cabeçalhos e filtros possuem ações específicas, e a futura unificação das faixas de métricas deve ser realizada em lote próprio para abranger os módulos já modernizados sem regressões.
- Shell, estilos globais, autenticação, Prisma, banco, rotas e demais módulos não foram alterados.

### Lote 5 — Relatórios e Biblioteca Técnica (15/07/2026)

- Relatórios padronizados com cabeçalho, período, área, comparação e ações integrados, indicadores em faixa horizontal contínua e composição analítica de maior densidade.
- Gráficos financeiros, margem, conversão e produtividade foram reorganizados horizontalmente e tiveram a altura reduzida sem alterar cálculos, filtros ou comparação com o período anterior.
- Rankings, tabelas de equipes e cidades foram compactados, preservando exportações visuais, valores, percentuais e scroll horizontal.
- Biblioteca Técnica recebeu cabeçalho e toolbar integrados, organização compacta por categorias, equipamentos, fabricantes e tipos, além de destaques horizontais menores.
- Cartões, lista, busca, filtros e favoritos foram preservados; documentos mantêm título, descrição, tipo, categoria, fabricante, equipamento, versão, tags, atualização, acessos, favorito, tamanho ou duração e vínculos existentes.
- Foram reutilizados Card, Button, Input, Badge e tokens globais; nenhuma nova abstração global foi criada por não haver ganho adicional claro dentro do escopo deste lote.
- Dados neutros e mockados, ações visuais, responsividade e dark mode foram mantidos; shell, estilos globais, autenticação, Prisma, banco, rotas e demais módulos não foram alterados.

### Lote de Refinamento 1 — Fundamentos, Clientes e Estoque (15/07/2026)

- O título contextual do topbar passou a priorizar a rota mais específica e deixou de competir com o título principal semântico de cada página.
- O conteúdo principal retorna ao topo nas trocas de rota, sem interferir nos scrolls internos horizontais de tabelas e painéis.
- O carregamento inicial do dashboard recebeu uma estrutura visual estável com skeletons, preservando integralmente a validação de sessão e os redirecionamentos existentes.
- Foi adicionado suporte global a `prefers-reduced-motion`, reduzindo animações, transições e deslocamentos para usuários que solicitam menos movimento.
- Foram criados os primitives reutilizáveis `PageHeader`, `MetricStrip` e `MetricItem`; `Table`, `EmptyState` e `SectionHeader` ganharam variações compatíveis com os consumidores anteriores.
- Clientes e Estoque foram os módulos-piloto: ambos passaram a usar cabeçalho composto, toolbar integrada, faixa contínua de métricas, tabela compacta com indicação de scroll em telas pequenas e estado vazio padronizado.
- Dados, filtros, handlers, visualizações, cálculos, rotas, autenticação, Prisma e regras de negócio permaneceram inalterados.

### Lote de Refinamento 2 — Agenda, Ordens de Serviço e Equipamentos (15/07/2026)

- Agenda passou a usar `PageHeader`, `MetricStrip`, `MetricItem`, `Select`, `EmptyState` e `SectionHeader` compacto, preservando dia, semana, mês, período, calendário, eventos, filtros e painel lateral.
- Ordens de Serviço passou a usar cabeçalho e toolbar compostos, métricas globais, tabela compacta com `TableFrame`, selects e estados vazios padronizados; tabela, Kanban, checklist, filtros, valores e handlers foram preservados.
- Equipamentos passou a compartilhar cabeçalho, toolbar, faixa de métricas, selects, tabela compacta com moldura e estados vazios, mantendo cartões, filtros e todos os dados técnicos e patrimoniais existentes.
- O primitive `Table` ganhou composição opcional com `TableFrame`, preservando o comportamento anterior como padrão para manter compatibilidade com Clientes, Estoque e demais consumidores.
- Cada um dos três módulos possui um único título principal semântico; responsividade, dark mode, formatação brasileira e scroll horizontal interno foram mantidos.
- Nenhum dado, cálculo, regra de negócio, rota, autenticação, Prisma, banco ou módulo fora do escopo foi alterado.

### Fundação funcional — Clientes com persistência desacoplada (15/07/2026)

- O fluxo de Clientes passou a seguir a cadeia `Página → Action → Service → Repository → Storage Adapter`, sem acesso direto da página ou do formulário ao armazenamento do navegador.
- A persistência local ficou isolada em um adapter substituível, preparando a futura troca por Prisma ou Supabase sem acoplar páginas, formulários, services ou repositories à tecnologia de armazenamento.
- Cadastro, edição, detalhamento, exclusão lógica, busca e filtros foram conectados ao fluxo completo, com validação, prevenção de duplicidade por CPF/CNPJ, e-mail ou telefone, estados de carregamento e vazio, confirmação e feedback de erro ou sucesso.
- O detalhamento utiliza a rota existente de Clientes e mantém indicadores operacionais, dados de contato e endereço em formatação brasileira.
- Os dados demonstrativos existentes continuam sendo a carga inicial local; novos registros começam sem OS, equipamentos, contratos ou valores acumulados até a futura integração funcional dos respectivos módulos.
- Prisma, migrations, autenticação, Supabase, `companyId`, banco, shell global e módulos externos a Clientes não foram alterados.

### Fundação funcional — CRM persistente e integrado a Clientes (15/07/2026)

- O CRM passou a seguir `Página → Action → Service → Repository → Storage Adapter`, mantendo o acesso ao armazenamento do navegador exclusivamente no adapter local.
- Pipeline, lista, busca, filtros, criação, edição, mudança persistente de etapa, arquivamento lógico e detalhamento foram conectados aos registros locais.
- Cada lead mantém histórico de criação, edição, mudança de etapa, conversão e arquivamento.
- A conversão utiliza a action pública de Clientes, reaproveitando validação e prevenção de duplicidade antes de vincular o cliente criado ao lead.
- Prisma, migrations, autenticação, Supabase, `companyId`, banco e módulos fora de CRM e da integração autorizada com Clientes permaneceram inalterados.

### Fundação funcional — Ordens de Serviço operacionais (15/07/2026)

- Ordens passou a seguir `Página → Action → Service → Repository → Storage Adapter`, com persistência local isolada no adapter.
- Cadastro, edição, status, checklist, cancelamento, arquivamento, detalhamento, numeração sequencial e histórico foram conectados a registros persistidos.
- Clientes são validados pela action pública de Clientes; leads de origem são validados pela action pública do CRM e precisam pertencer ao cliente convertido.
- A integração com Agenda foi isolada por uma porta provisória; a OS permanece como fonte única de data e horário até a Agenda receber persistência funcional.
- Prisma, migrations, autenticação, Supabase, banco e módulos fora das integrações públicas autorizadas não foram alterados.

### Fundação funcional — Agenda persistente e integrada a Ordens (15/07/2026)

- A Agenda passou a seguir `Página → Action → Service → Repository → Storage Adapter`; somente o adapter local acessa o armazenamento do navegador.
- Eventos independentes agora possuem cadastro, edição, recorrência limitada, cancelamento, arquivamento lógico, histórico e detalhamento persistentes.
- Eventos vinculados são projeções das Ordens de Serviço: a OS permanece como fonte de data, horário, duração, cliente, responsável, localização e estado operacional.
- A porta de Ordens foi conectada a um vínculo idempotente da Agenda; alterações operacionais feitas pela Agenda utilizam as actions públicas de Ordens.
- Conflitos incompatíveis do mesmo responsável em horários sobrepostos são identificados antes da gravação, exibidos ao usuário e bloqueados até ajuste de responsável ou horário.
- Busca, filtros, dia, semana, mês, navegação de período, painel lateral, responsividade e dark mode foram preservados.
- Prisma, migrations, autenticação, Supabase, banco e demais módulos permaneceram inalterados.

### Fundação funcional — Financeiro Ciclo A (15/07/2026)

- O Financeiro passou a seguir `Página → Action → Service → Repository → Storage Adapter`, com acesso ao armazenamento local restrito ao adapter financeiro.
- Contas financeiras possuem criação, edição, conta padrão única, saldo inicial, arquivamento confirmado e saldos derivados de lançamentos realizados.
- Receitas, despesas e investimentos manuais possuem cadastro, edição, duplicação, arquivamento lógico, detalhe, sequência e histórico persistentes.
- Todos os valores operacionais são armazenados em centavos inteiros; métricas, saldos e fluxo mensal são calculados exclusivamente a partir do estado persistido.
- O envelope local possui versão, revisão, sequência, validação Zod, backup do último estado válido e recuperação sem sobrescrita silenciosa de dados inválidos.
- Busca e filtros por natureza, conta, categoria e período foram conectados aos dados persistidos, preservando o layout-base, responsividade e dark mode.
- Parcelas, pagamentos, estornos, recorrência, conciliação e integrações com Clientes ou Ordens permanecem fora deste ciclo.

### Fundação funcional — Financeiro Ciclo B (15/07/2026)

- O envelope local `proflow:financeiro:v1` evoluiu de forma explícita da versão 1 para a versão 2, preservando IDs, sequências, revisões, contas, lançamentos e históricos do Ciclo A, com cópia anterior mantida no backup e validação Zod antes da gravação.
- Contas a receber e contas a pagar manuais agora possuem criação persistente, parcelas incorporadas ao agregado, vencimentos mensais, saldo aberto e status derivados, mantendo valores exclusivamente em centavos inteiros.
- A divisão de parcelas distribui qualquer resto de centavos entre as primeiras parcelas, garantindo que a soma seja exatamente igual ao total e impedindo parcelas nulas ou negativas.
- Recebimentos e pagamentos parciais ou totais são registrados por parcela e conta ativa, sem exceder o saldo aberto, com trilha histórica e reflexo no saldo apenas enquanto estiverem ativos.
- Cancelamento de parcela, cancelamento do saldo aberto e estorno exigem motivo; valores já realizados e registros financeiros nunca são apagados, e estornos reabrem o saldo sem permitir duplicidade.
- Métricas, saldos por conta e fluxo de caixa foram ampliados para separar previsto por vencimento e realizado por data de pagamento, sem contar recebíveis ou pagáveis duas vezes.
- As visões de movimentações, contas a receber e contas a pagar passaram a ter conteúdos funcionais próprios; o detalhe financeiro exibe parcelas, pagamentos, estornos, cancelamentos e histórico completo com ações compatíveis com o estado atual.
- Integrações com Clientes, Ordens, Estoque e Equipamentos, geração por OS, recorrência, conciliação bancária e persistência externa permanecem reservadas para ciclos posteriores.

### Fundação funcional — Financeiro Ciclo C (15/07/2026)

- Foram formalizados contratos públicos mínimos para Clientes, Ordens e Financeiro em `lib/contracts`, expondo somente referências cadastrais, snapshots financeiros e resumos necessários aos consumidores.
- O gateway de relações do Financeiro passou a concentrar validações de existência, arquivamento e elegibilidade sem acessar repositories, adapters ou tipos internos completos de Clientes e Ordens.
- O envelope financeiro evoluiu explicitamente da versão 2 para a versão 3, preservando contas, lançamentos, parcelas, pagamentos, IDs, sequências, revisões e históricos dos Ciclos A e B.
- Recebíveis manuais podem ser vinculados a clientes ativos, mantendo `clientId` e snapshot histórico do nome; vínculos antigos permanecem válidos após eventual arquivamento cadastral.
- Ordens elegíveis podem gerar recebíveis somente por confirmação explícita, com snapshot da OS, cliente, finalidade e chave idempotente persistente `SERVICE_ORDER:{id}:RECEIVABLE:MAIN`.
- A reconciliação compara valor atual da OS, valor emitido, recebido e saldo, sinalizando aumento, redução, cancelamento, arquivamento, indisponibilidade ou modificação manual sem sobrescrever o Financeiro.
- Aumentos permitem complemento confirmado com finalidade `ADDITIONAL:{sequência}`; reduções e cancelamentos preservam pagamentos e direcionam para o fluxo seguro de cancelamento do saldo aberto.
- A visualização de divergências oferece acesso à OS, cliente e recebível, revisão explícita e atualização de snapshot, mantendo o estado real sempre derivado.
- Event Bus, CQRS, persistência externa, Prisma, Supabase, autenticação, recorrência, conciliação bancária e alterações automáticas de recebíveis continuam fora do escopo.

### Fundação funcional — Equipamentos Ciclo A (15/07/2026)

- Equipamentos passou a representar ativos e patrimônios duráveis por meio de `EquipmentAsset`, separando tipo, categoria, propriedade, status operacional e condição técnica.
- O módulo passou a seguir `Página → Action → Service → Repository → Storage Adapter`; somente o adapter local acessa `localStorage`.
- O envelope `proflow:equipamentos:v1` possui versão, revisão incremental, sequência, validação Zod, backup e recuperação sem reinicialização silenciosa.
- Cadastro, edição, arquivamento lógico, detalhe, busca, filtros, tabela, cartões, histórico append-only e metadados manuais de fotos e documentos foram conectados à persistência.
- Código interno, número de série e patrimônio possuem prevenção de duplicidade inclusive contra registros arquivados.
- Aquisição e depreciação usam centavos inteiros; o valor atual linear é derivado por meses completos, respeita o residual e ativos de clientes ou terceiros não compõem o patrimônio próprio.
- Localização passou a ser estruturada; status operacional e condição técnica são persistidos separadamente, enquanto criticidade e depreciação completa são derivadas.
- Manutenção, garantia avançada, Clientes, Ordens, Financeiro, upload real, Prisma e Supabase permanecem reservados aos próximos ciclos.

### Fundação funcional — Equipamentos Ciclo B (15/07/2026)

- O envelope local evoluiu explicitamente da versão 1 para a versão 2, preservando ativos, IDs, sequências e históricos do Ciclo A, mantendo o conteúdo anterior em backup e acrescentando coleções próprias para manutenções e vínculos técnicos com Ordens.
- Equipamentos passou a consumir Clientes e Ordens somente por contratos públicos resumidos e por um gateway interno, sem acessar adapters, repositories ou tipos internos completos desses módulos.
- Ativos de propriedade de cliente mantêm `clientId` e snapshot histórico do nome; clientes arquivados são bloqueados em novos vínculos e a remoção do vínculo preserva o evento técnico.
- Vínculos persistentes com Ordens validam existência, cancelamento, arquivamento e duplicidade; a desvinculação é lógica e mantém snapshots e histórico.
- Manutenções preventivas e corretivas possuem registro, edição enquanto abertas, início, conclusão e cancelamento, com custos em centavos, fornecedor, responsável, próxima manutenção, OS opcional e histórico append-only.
- O início da manutenção altera o ativo para `UNDER_MAINTENANCE`; conclusão define o novo status e cancelamento restaura o estado anterior quando disponível.
- A garantia estruturada registra período, fornecedor, descrição, documento e observações; seus estados ativo, próximo do vencimento, expirado ou não informado são derivados pela data atual.
- Criticidade, garantia, manutenção vencida ou próxima, manutenção em andamento e depreciação completa passaram a ser indicadores derivados, sem alterar automaticamente o status operacional por garantia isolada.
- A ficha técnica foi ampliada com cliente, Ordens, manutenções, garantia, alertas e histórico técnico, preservando identificação, aquisição, depreciação, localização, fotos e documentos.
- Financeiro, Estoque, upload real, notificações, Event Bus, Prisma, Supabase e autenticação real permanecem fora deste ciclo.

### Fundação funcional — Equipamentos Ciclo C (16/07/2026)

- O contrato público do Financeiro foi ampliado de forma aditiva com DTOs resumidos para origem técnica, contas, criação e consulta de lançamentos de Equipamentos, sem expor parcelas, pagamentos ou entidades financeiras internas ao módulo consumidor.
- O gateway financeiro de Equipamentos concentra o consumo das actions públicas; páginas, services e repositories de Equipamentos não acessam o repository nem o storage adapter financeiro.
- O envelope local de Equipamentos evoluiu da versão 2 para a versão 3 com backup, validação Zod e migração explícita, preservando integralmente ativos, manutenções, vínculos, IDs, sequências, revisões e históricos anteriores.
- Aquisições podem gerar investimento ou despesa por decisão explícita, com conta, competência, vencimento, parcelas e pagamento integral opcional; nenhum lançamento é criado durante o cadastro do ativo.
- Manutenções concluídas com custo positivo podem gerar despesas vinculadas, mantendo no equipamento somente ID, finalidade, snapshot resumido, revisão e observações de reconciliação.
- As chaves `EQUIPMENT:{id}:ACQUISITION` e `EQUIPMENT_MAINTENANCE:{id}:EXPENSE` são validadas pelo service financeiro; repetições retornam o lançamento existente e registros cancelados ou arquivados não são recriados silenciosamente.
- A reconciliação compara valores técnicos e financeiros, valores pagos, saldo, cancelamento, arquivamento e modificação manual; nenhuma divergência altera automaticamente parcelas ou pagamentos.
- Aumentos permitem complementos explícitos com chave `:ADDITIONAL:{sequência}`; reduções permitem revisão, atualização de snapshot ou cancelamento seguro do saldo aberto, bloqueando parcelas parcialmente pagas para tratamento no Financeiro.
- A ficha do equipamento exibe resumo financeiro da aquisição e das manutenções, links para lançamentos, divergências, complementos, revisão e histórico técnico-financeiro append-only.
- Integração com Estoque, upload real, notificações, Event Bus, Prisma, Supabase e autenticação continuam fora do escopo.

### Fundação funcional — Estoque Ciclo A (16/07/2026)

- Estoque passou a seguir `Página → Action → Service → Repository → Storage Adapter`; somente o adapter local acessa `localStorage`.
- O envelope `proflow:estoque:v1` possui revisão incremental, validação Zod integral, backup, recuperação explícita e bloqueio quando principal e backup estão corrompidos.
- A carga demonstrativa foi migrada para itens cadastrais e movimentos `ENTRY` de abertura, eliminando saldos, reservas, compras e status independentes.
- Quantidades fracionárias são armazenadas como inteiros na menor escala da unidade; `PAIR` passou a integrar o tipo e os labels suportados.
- Quantidade física, disponível, custo médio ponderado móvel, valor patrimonial e status são derivados por replay cronológico dos movimentos ativos.
- Cadastro, edição, arquivamento lógico, detalhe, busca, filtros persistentes, tabela e cartões foram conectados à persistência local.
- Entradas, saídas, perdas, ajustes positivos e negativos e devoluções manuais registram custos em centavos e histórico append-only; cancelamentos reprocessam o ledger e são bloqueados quando causariam saldo histórico inválido.
- Código interno e código de barras possuem prevenção de duplicidade inclusive contra itens arquivados; nome e unidade semelhantes geram aviso assistido.
- Reservas, consumo em OS, compras, Financeiro, fornecedores persistentes, transferências complexas, lotes, validade, Prisma, Supabase e autenticação continuam fora deste ciclo.

### Fundação funcional — Estoque Ciclo B (16/07/2026)

- O envelope local evoluiu explicitamente da versão 1 para a versão 2, preservando itens, movimentos, IDs, sequências, custos, históricos, arquivamentos, preferências, revisões e backup do Ciclo A.
- Estoque passou a consumir Ordens somente pelo contrato público resumido e por `estoque-ordens-gateway.ts`, sem acessar repository, adapter ou registro interno completo de Ordens.
- Reservas persistentes utilizam chave idempotente `STOCK_RESERVATION:{os}:{item}:{finalidade}`; repetições retornam a reserva existente e reservas encerradas não são recriadas silenciosamente.
- Quantidade reservada é derivada do saldo das reservas; disponibilidade é quantidade física menos reservado, enquanto a reserva isolada não cria movimento físico.
- Consumos totais, parciais e administrativos criam movimentos `CONSUMPTION` com custo médio vigente, OS e reserva vinculadas, persistindo reserva e movimento atomicamente.
- Liberações totais e parciais devolvem disponibilidade sem alterar o físico; devoluções vinculadas reutilizam o custo do consumo original e não reabrem reservas automaticamente.
- Cancelamentos de consumo ou devolução preservam movimentos, refazem o ledger e recalculam o saldo da reserva, bloqueando inconsistências históricas.
- Cancelamento, arquivamento, indisponibilidade ou atualização da OS são derivados como divergências, com revisão e atualização explícita do snapshot sem reescrever movimentos antigos.
- A ficha do item passou a exibir reservas, Ordens vinculadas, consumo, liberação, devoluções, divergências, links e histórico append-only.
- Compras, Financeiro, fornecedores persistentes, transferências complexas, lotes, validade, Equipamentos, Prisma, Supabase e autenticação continuam fora do escopo.
## 2026-07-16 — Precificação, Ciclo C

- Integração comercial concluída por contratos públicos resumidos de Clientes, CRM e Ordens.
- Vínculos com cliente, lead e OS passaram a persistir snapshots mínimos na simulação.
- Aplicação e atualização de preço na OS exigem confirmação explícita, preservam revisões e mantêm histórico append-only.
- Envelope local da Precificação evoluído da versão 2 para a versão 3, com migração explícita, backup e preservação dos dados dos ciclos anteriores.
- Comparação entre versão aplicada e atual, valor manual justificado e divergências comerciais adicionados ao detalhamento.

### Fundação funcional — Relatórios analíticos (16/07/2026)

- Relatórios deixou de consumir os dados demonstrativos da interface e passou a gerar um dataset analítico a partir das fontes persistidas de CRM, Clientes, Ordens, Agenda, Financeiro, Estoque, Equipamentos e Precificação.
- A integração segue `Página → Action de Relatórios → Service analítico → Engines puras → Gateways locais → Actions públicas`, sem acesso de Relatórios a `localStorage`, repositories, adapters ou registros operacionais completos.
- Foram adicionados contratos públicos analíticos mínimos e aditivos em `lib/contracts`; cada módulo adapta seu estado interno para DTOs resumidos antes de entregá-lo ao gateway de Relatórios.
- As oito fontes são consultadas independentemente com tolerância a falhas; indisponibilidade e parcialidade ficam explícitas e uma falha isolada não oculta as demais áreas.
- Períodos reais, intervalo personalizado, período anterior equivalente, comparação personalizada e filtros compatíveis por área passaram a alimentar métricas, gráficos e rankings.
- A camada `analytics` centraliza datas, agregações, comparações, tendências e fórmulas, distinguindo zero, ausência, dados insuficientes e base não comparável.
- Foram implementadas análises comerciais, operacionais, financeiras, de estoque, de equipamentos e de precificação com links para as rotas operacionais e sem promover estimativas a valores realizados.
- A exportação CSV usa o dataset filtrado, BOM UTF-8, separador `;`, metadados da geração e status das fontes; a impressão utiliza o fluxo nativo do navegador.
- O layout de Relatórios foi refinado de forma localizada com cabeçalho e toolbar compactos, faixas de métricas, gráficos, rankings, loading, erro, vazio e status das fontes, preservando os primitives globais existentes.
- Relatórios não criou storage operacional, não alterou banco, Prisma, autenticação, rotas ou regras de negócio das fontes.

### Fundação funcional — Configurações (16/07/2026)

- Configurações deixou de usar `ModulePage` e passou a seguir `Página → Action → Service → Repository → Storage Adapter`, com acesso ao `localStorage` restrito ao adapter do módulo.
- O envelope `proflow:configuracoes:v1` possui revisão, validação integral Zod, backup, recuperação, conflito entre abas, histórico append-only e preparação para migrações locais.
- Empresa, identidade documental, equipe, parâmetros operacionais, Financeiro, Precificação, numeração, aparência e preferências gerais passaram a ser editáveis e persistentes por seção.
- Integrantes possuem cadastro, edição, arquivamento, reativação, custo/hora, encargos, disponibilidade, especialidades e prevenção de duplicidade por e-mail, telefone e documento.
- Foi criado contrato público resumido para empresa, equipe, operação, Financeiro, Precificação, numeração e aparência, sem migrar consumidores automaticamente.
- Aparência utiliza `next-themes` e atributos do documento somente após confirmação, sem alterar o shell ou reescrever `globals.css`.
- Exportação e importação JSON validam versão e schema, exibem impacto e criam backup antes da gravação; nenhum dado operacional integra o arquivo.
- Banco, Prisma, autenticação, Supabase, permissões reais, multiempresa, uploads e integrações externas permanecem fora do escopo.

### Adoção funcional de Configurações (16/07/2026)

- CRM, Agenda e Ordens passaram a obter integrantes ativos por gateways locais e contrato público resumido; valores históricos continuam visíveis como legados e integrantes arquivados não entram em novos vínculos.
- Novos eventos da Agenda adotam horário e duração padrão, e a visualização inicial respeita a configuração salva sem alterar eventos existentes.
- Novas Ordens adotam status inicial, categoria, prioridade e duração configurados, mantendo compatibilidade com enums e registros anteriores.
- Financeiro passou a consumir categorias, conta padrão validada e métodos de pagamento configurados; conta padrão ausente exige seleção manual e pagamentos continuam limitados ao saldo.
- Novas simulações de Precificação adotam margens, imposto, comissão e confirmação mínima vigentes, enquanto simulações existentes preservam seus snapshots.
- Um provider global leve aplica tema, densidade, contraste, tamanho de fonte e redução de movimentos, reagindo às alterações salvas sem acessar o armazenamento diretamente.
- Todos os consumidores acessam Configurações exclusivamente por actions públicas, contratos resumidos e gateways locais, com defaults seguros e aviso localizado em caso de indisponibilidade.

### Lote integrado — Biblioteca, Dashboard e produtividade global (16/07/2026)

- Biblioteca Técnica passou a seguir `Página → Action → Service → Repository → Storage Adapter`, com envelope `proflow:biblioteca-tecnica:v1`, backup, migração dos documentos demonstrativos e histórico append-only.
- Arquivos locais permitidos são validados e armazenados isoladamente em IndexedDB; o envelope guarda apenas metadados, URLs temporárias são revogadas e formatos sem preview nativo continuam disponíveis para abertura ou download local.
- Cadastro, edição, duplicação, arquivamento, favoritos, acessos, validade, busca, filtros, cartões/lista, vínculos e ficha detalhada da Biblioteca foram conectados à persistência.
- Vínculos da Biblioteca com Equipamentos, Ordens e Clientes usam gateways locais e actions públicas resumidas, preservando snapshots e impedindo novas associações com registros indisponíveis.
- Dashboard passou a consumir o dataset analítico de Relatórios, com estado parcial explícito e preferências próprias apenas para período, visibilidade, ordem e tamanho dos widgets.
- Central de Notificações materializa regras derivadas com chave idempotente, leitura, arquivamento, restauração, adiamento e backup, sem Event Bus, push ou envio externo.
- Timeline Global agrega atividades resumidas por actions públicas e Pesquisa Global consulta Clientes, CRM, Ordens, Equipamentos e Biblioteca com `Ctrl/Cmd + K`, sem copiar os registros de origem.
- Header passou a exibir pesquisa, timeline e contador de notificações sem ampliar a sidebar ou alterar o shell estrutural.

### Fundação funcional — Perfil local (16/07/2026)

- Perfil deixou de usar `ModulePage` e passou a seguir `Página → Action → Service → Repository → Storage Adapter`, com envelope `proflow:perfil:v1`, backup, revisão otimista, validação, histórico append-only e preparação para migrações.
- Identidade pessoal, vínculo resumido com integrante ativo da equipe, preferências individuais, disponibilidade, notificações pessoais, documentos profissionais, atividade, produtividade e metadados neutros de segurança passaram a ser persistentes.
- Avatar e assinatura usam IndexedDB isolado, com validação de formato e tamanho; nenhuma imagem, assinatura, senha ou credencial é armazenada em base64 no envelope local.
- Foi criado contrato público mínimo para identidade, preferências, disponibilidade, documentos válidos e revisão, sem expor documento pessoal completo.
- Timeline Global, Central de Notificações e Configurações são consumidas por gateways ou actions públicas; Perfil não acessa adapters ou repositories externos.
- Exportação e importação JSON preservam o envelope versionado e rejeitam versões incompatíveis; blobs não são incorporados ao JSON.
- A área de segurança deixa explícita a ausência de senha, 2FA e sessões reais, sem simular autenticação.

## Fornecedores funcional

- Módulo criado em `app/dashboard/fornecedores/`.
- Cadastro, edição, detalhe, arquivamento e reativação persistentes.
- Persistência local versionada em `proflow:fornecedores:v1`, com backup.
- CPF/CNPJ, telefones, CEP, nomes, datas e valores seguem os formatadores brasileiros compartilhados.
- Categorias de fornecimento, condições comerciais, prazo, pedido mínimo e avaliação.
- Prevenção de duplicidade por documento, telefone e e-mail.
- Contrato público resumido criado em `lib/contracts/fornecedores.contract.ts`.
- Entrada adicionada à navegação principal.

## Lote operacional: Ordens, Agenda e Dashboard

- Ordens de Serviço receberam controle de execução com início, pausa, retomada, conclusão, sessões cronometradas, equipe participante e apontamentos internos/para cliente.
- A ficha da OS passou a exibir progresso do checklist, tempo registrado e timeline operacional ampliada.
- Agenda recebeu reagendamento por arrastar e soltar nas visões de dia, semana e mês, preservando validação de conflitos e integração com Ordens.
- Dashboard foi reorganizado em visão executiva por áreas, com status das fontes, atualização, métricas prioritárias e personalização preservada.
- Utilitários brasileiros foram ampliados para normalização de telefone, CPF/CNPJ, moeda e horário.
- Persistências existentes foram preservadas; registros antigos de Ordens são normalizados de forma compatível na leitura.

## 2026-07-16 — CRM profissional

- CRM recebeu probabilidade de fechamento e pipeline ponderado.
- Próxima ação e follow-up podem ser agendados e persistidos.
- Atividades comerciais suportam ligação, WhatsApp, e-mail, visita, observação e follow-up.
- Tarefas comerciais possuem prazo, prioridade, conclusão e indicação de atraso.
- Lead perdido exige motivo explícito e mantém histórico.
- Tempo na etapa, atividades, tarefas e histórico foram integrados ao detalhamento.
- Dados antigos são migrados de forma compatível na leitura do adapter local.

## 2026-07-16 — Lote premium complementar: Ordens e Agenda

- A base atual já continha CRM avançado com probabilidade, pipeline ponderado, tempo em etapa, atividades, tarefas, follow-up e motivo de perda; esses recursos foram preservados sem duplicação.
- Ordens de Serviço receberam evidências locais por IndexedDB para fotos de antes, depois e gerais, além de assinaturas do cliente e do técnico, sem base64 no localStorage.
- A ficha da OS passou a armazenar somente metadados dos arquivos no domínio local, com abertura, download e remoção segura do blob no dispositivo.
- Foi adicionado relatório técnico estruturado com diagnóstico, serviço executado, recomendações e ciência do cliente, preservado no histórico append-only da Ordem.
- A impressão da OS foi disponibilizada pelo navegador, sem criação de PDF fictício ou instalação de biblioteca adicional.
- Agenda recebeu uma faixa operacional por responsável, permitindo alternar rapidamente entre agenda geral e agenda individual e visualizar disponibilidade ou ocupação.
- Dados antigos de Ordens continuam compatíveis; mídia e relatório técnico são opcionais e adicionados sem reinicialização da persistência existente.


## 2026-07-16 — Central Operacional e consistência brasileira

- Foi criada a rota `/dashboard/central-operacional`, adicionada à navegação principal.
- A Central Operacional agrega Ordens, Agenda, Estoque e Equipamentos por actions públicas, sem acessar adapters ou repositories externos.
- A tela apresenta OS do dia, Ordens atrasadas, execuções em andamento, equipe em campo, próximos compromissos, estoque crítico, manutenção e garantias.
- Um assistente operacional determinístico destaca pendências reais, sem IA e sem inventar dados quando uma fonte está indisponível.
- As consultas são tolerantes a falhas por fonte e exibem o estado operacional parcial.
- O formatador monetário brasileiro passou a distinguir explicitamente valores legados em reais de valores modernos em centavos.
- Nomes exibidos na Central são normalizados para capitalização brasileira, preservando conectivos e siglas.
