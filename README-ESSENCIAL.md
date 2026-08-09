# ProFlow Essencial — Dashboard e Financeiro

Esta versão mantém publicamente apenas:

- Login e recuperação de acesso, sem alterações visuais ou funcionais
- Dashboard completo, com as informações atuais
- CRM
- Clientes
- Precificação
- Financeiro
- Configurações
- Perfil

## Comportamento

- Após o login, o sistema abre o Dashboard normalmente.
- O menu lateral apresenta somente os sete itens solicitados.
- As fontes internas utilizadas pelos indicadores do Dashboard e pelas integrações do Financeiro foram preservadas em pastas privadas iniciadas por `_`.
- Essas pastas não criam rotas públicas no App Router.
- Atalhos para Agenda, Ordens, Estoque, Equipamentos, Relatórios e demais módulos retirados foram removidos das telas públicas, sem apagar os dados de referência exibidos.

## Execução local

1. Copie `.env.example` para `.env` e preencha as variáveis.
2. Execute `npm install`.
3. Execute `npm run prisma:generate`.
4. Execute `npm run dev`.
