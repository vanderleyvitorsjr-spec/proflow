# Agenda Profissional

A Agenda mantém as visualizações de dia, semana e mês e as integrações atuais
com Ordens. O domínio compartilhado detecta sobreposição quando o mesmo
responsável possui dois compromissos ativos no mesmo intervalo.

O resumo diário apresenta total, pendentes, concluídos, urgentes e conflitos.
Filtros por responsável e período são funções puras testadas. Reagendamentos
continuam passando pelas actions e pelo service existentes.

Limitações: arrastar e soltar usa o comportamento já existente; a resolução de
conflito continua sendo uma decisão explícita do usuário.
