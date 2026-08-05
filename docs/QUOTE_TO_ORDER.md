# Conversão de Orçamento em Ordem

A conversão valida cliente, título, itens, endereço, tipo de serviço, responsável,
situação e conversão anterior. A confirmação reutiliza a action pública de Ordens,
cria uma única Ordem e vincula seu número ao Orçamento.

O fluxo não cria pagamentos, recebimentos, agenda, reserva ou movimento de Estoque.
Essas operações continuam exigindo ações explícitas em seus módulos.

