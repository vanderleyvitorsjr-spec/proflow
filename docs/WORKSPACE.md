# Workspace Operacional

Pedidos de Compra, Orçamentos e eventos técnicos podem manter vínculo com a
Ordem. Esses vínculos locais não criam pagamentos nem movimentos de Estoque.

O Workspace em `/dashboard/projetos/[id]` consolida uma Ordem de Serviço sem
duplicar as regras dos módulos de origem. Agenda, Financeiro, Estoque,
Equipamentos, Precificação, Automações e Central Operacional são consultados
por actions públicas.

O progresso é derivado de planejamento, agendamento, materiais, execução,
relatório técnico e registro financeiro. As pendências explicam o próximo
passo. Observações internas usam a arquitetura
`Interface → Action → Service → Repository → Storage Adapter`, com chave local
isolada por empresa. Nenhuma observação é enviada ao banco.

Limitações: arquivos permanecem nos adapters atuais dos módulos; as
observações são locais ao navegador; autorização visual não substitui a futura
autorização no servidor.

O Workspace também reúne Equipe, Materiais, Custos, Rentabilidade e Checklist
Inteligente. Esses complementos são locais, isolados por empresa e emitem
eventos para a Linha do Tempo. Movimentações de Estoque e Financeiro nunca são
executadas automaticamente.
