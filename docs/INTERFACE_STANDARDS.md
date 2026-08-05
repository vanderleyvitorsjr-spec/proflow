# Padrões de Interface

## Documentos e fluxos comerciais

- Situações e ações devem aparecer em português do Brasil.
- Valores comerciais são exibidos em reais e armazenados em centavos.
- Tabelas largas preservam rolagem; ações destrutivas exigem confirmação.
- Documentos impressos ocultam a navegação e respeitam página A4.

- Todo texto visível deve estar em português do Brasil.
- Um único `h1` por página, por meio de `PageHeader`.
- Métricas usam `MetricStrip`; estados vazios usam `EmptyState`.
- Campos possuem rótulo, exemplo, ajuda e erro associado quando aplicável.
- Ações destrutivas exigem confirmação; ícones isolados exigem `aria-label`.
- Drawers e dialogs móveis devem usar `100dvh`, área interna rolável,
  rodapé acessível e safe-area.
- Estados não dependem apenas de cor.
- Transições são sutis e devem respeitar `prefers-reduced-motion`.
- Tabelas largas usam rolagem controlada; no celular, cards são preferíveis
  quando preservam melhor a leitura.
- Dark mode deve manter contraste em textos, badges, gráficos e foco.
- Diálogos de adiamento, resolução e Metas usam conteúdo rolável, `100dvh`,
  safe-area e mensagens associadas aos campos.
- Ações que alteram situação, removem registros ou representam movimentações
  exigem confirmação explícita.
