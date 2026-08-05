# Metas Executivas

As Metas seguem `Interface → Action → Service → Repository → Storage Adapter`
e usam a chave `proflow:{companyId}:metas-executivas:v1`.

Existem Metas de Faturamento, Ordens Concluídas, Novos Clientes, Conversão do
CRM, Ticket Médio, redução de atrasos, Recebimentos, Margem e Produtividade.
Valores financeiros são persistidos em centavos. O realizado é derivado dos
indicadores disponíveis; quando não existe base válida, a interface mostra
“Dados Insuficientes”.

Criar, editar, ativar, desativar, duplicar, excluir, pesquisar, filtrar e
exportar CSV são operações locais. O histórico é preservado enquanto a Meta
existir. A exclusão exige confirmação explícita.
