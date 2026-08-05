# Padrões de Português do Brasil

Orçamentos, Cotações, Pedidos, Equipamentos e documentos traduzem valores
internos antes da exibição. “Relatório Técnico” é o padrão quando não houver
estrutura legal suficiente para caracterizar um laudo.

Enums internos permanecem inalterados e são traduzidos somente na
apresentação pelo catálogo em `lib/translations/pt-br.ts`.

Regras principais:

- nomes próprios usam capitalização correta e conectivos como “da”, “de”,
  “do”, “das”, “dos” e “e” permanecem minúsculos no meio;
- e-mails são normalizados em minúsculas;
- telefone: `(73) 9 8893-6763`;
- CPF: `123.456.789-00`;
- CNPJ: `12.345.678/0001-99`;
- CEP: `45810-000`;
- moeda: `R$ 1.000,00`;
- percentual: `12,50%`;
- data: `16/07/2026`;
- data e hora: `16/07/2026 às 14:30`.

Não aplicar capitalização a e-mails, URLs, códigos, IDs, placas, números de
série, nomes de arquivo ou textos livres.

Metas, tarefas, materiais, custos, funções na Ordem e tipos de eventos usam
catálogos centrais. Valores internos permanecem em inglês apenas no domínio.
