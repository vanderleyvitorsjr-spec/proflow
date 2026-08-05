# Linha do Tempo Operacional

A Linha do Tempo reutiliza o contrato `GlobalActivity` e agrega actions
públicas de módulos operacionais, Metas, Pendências, observações do Workspace,
equipe, materiais e custos.

Eventos possuem ID idempotente, origem, entidade, data, responsável, prioridade,
status, link e metadados seguros. Duplicidades são removidas pelo identificador.
É possível pesquisar e filtrar por módulo e período. Os registros são agrupados
em Hoje, Ontem, Esta Semana e data completa.

O Workspace restringe a visualização à Ordem. O Painel e a Central mostram a
atividade global resumida.
