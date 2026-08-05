# Auditoria Funcional do ProFlow — 05/08/2026

## Escopo analisado

- 642 arquivos no pacote.
- 52 rotas com `page.tsx`.
- 511 usos do componente `Button` e 19 botões HTML nativos.
- 29 arquivos de actions.
- 29 adapters ou arquivos relacionados a adapters.
- 27 arquivos com acesso a `localStorage`; a maior parte está concentrada em adapters, mas a persistência operacional ainda é majoritariamente local.

## Diagnóstico executivo

O ProFlow possui uma cobertura visual e de domínio ampla, mas ainda não pode ser considerado integralmente persistente no servidor. Autenticação, empresa, equipe e migrations já utilizam Supabase/Prisma; a maior parte de Clientes, CRM, Agenda, Ordens, Financeiro, Estoque, Equipamentos, Compras, Orçamentos, Documentos, Configurações e Automações continua em adapters locais.

O principal risco não é a existência dos botões: é a diferença entre uma ação visualmente funcional e uma ação que persiste, sincroniza e respeita autorização no servidor.

## Entregue nesta fase

- Recuperação de senha por e-mail.
- Rota protegida para criação de nova senha.
- Mensagens de sucesso e erro.
- Link “Esqueci minha senha” no login.
- Atualização da aba Segurança do Perfil para refletir a autenticação real.
- Auditor estático executável por `npm run audit:functional`.

## Pendências críticas

### Persistência no servidor

1. Clientes e contatos.
2. CRM, etapas, retornos e tarefas.
3. Agenda e conflitos.
4. Ordens, checklist, evidências e materiais.
5. Financeiro e movimentações.
6. Estoque, reservas, consumos e inventários.
7. Equipamentos e histórico técnico.
8. Fornecedores, cotações, pedidos e recebimentos.
9. Orçamentos, precificação e documentos.
10. Automações, notificações e Central Operacional.

### Funções explicitamente incompletas encontradas

- “Emitir comprovante” continua desabilitado no detalhe financeiro.
- Movimentações de materiais no Workspace informam que o Estoque real não é alterado automaticamente.
- Custos, equipe e materiais do Workspace são locais.
- Documentos não armazenam arquivo binário; dependem de regeneração e impressão pelo navegador.
- Evidências de Ordem dependem do dispositivo onde foram registradas.
- A página do Assistente de IA usa apenas a estrutura genérica do módulo e não apresenta integração real de IA no arquivo analisado.

## Ordem recomendada de implementação

### Fase 2 — Clientes e CRM no Prisma

- Repositories Prisma filtrados por `companyId`.
- Server Actions com RBAC.
- Importação explícita dos registros locais.
- Contatos, endereços, histórico, tarefas e retornos.
- Testes com duas empresas.

### Fase 3 — Agenda e Ordens

- Agenda e Ordens como fontes canônicas no banco.
- Vínculos entre Cliente, CRM, Orçamento, Ordem e Agenda.
- Checklist, materiais, evidências e conclusão transacional.

### Fase 4 — Financeiro

- Contas, parcelas, recebimentos, pagamentos, estornos e conciliação.
- Idempotência e auditoria.
- Geração de comprovante real.

### Fase 5 — Estoque, Compras e Equipamentos

- Recebimento confirmado gerando entrada.
- Reserva, consumo, devolução e inventário.
- Custos vinculados à Ordem.

### Fase 6 — Arquivos e documentos

- Supabase Storage privado.
- Upload, download, versionamento e permissões.
- PDFs e comprovantes.

## Critério para declarar um botão concluído

Um botão só deve ser considerado funcional quando:

1. possui ação ou navegação real;
2. valida os dados;
3. respeita a permissão;
4. persiste na fonte canônica;
5. permanece após recarregar;
6. funciona em outro dispositivo, quando aplicável;
7. registra auditoria quando necessário;
8. evita duplicidade;
9. apresenta sucesso e erro;
10. possui teste automatizado ou cenário manual documentado.
