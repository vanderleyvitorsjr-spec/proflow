# Correções aplicadas

## Precificação de T.I.
- Mantida isolada por `segment === "IT"`, sem alterar o motor de Climatização ou Elétrica.
- Forma de cobrança sugerida conforme o tipo de serviço de T.I. (hora, dispositivo, ponto, projeto ou mensal).
- Textos de ajuda específicos para mão de obra, peças/licenças e terceiros.
- Perfil técnico vazio agora é explicado; custo da hora pode ser informado manualmente mesmo sem custos fixos configurados.
- Aviso de custos fixos deixou de sugerir que a precificação fica inutilizável: o cálculo funciona com custo/hora manual.
- Referências de mercado de T.I. ampliadas por categoria de serviço e apresentadas apenas como conferência, sem substituir o cálculo de custo real.

## Identidade e logomarca
- Logo dos documentos aumentada para área máxima aproximada de 260 x 104 px, preservando proporção.
- Fallback de nome da empresa não usa `ProFlow`/`Proflow` como prestador quando não é a razão/nome fantasia cadastrado.

## Recibo
- Quando a URL não informa `paymentId`, o recibo agora procura o recebimento ativo mais recente do lançamento, permitindo recuperar forma de pagamento, data e parcela em vez de cair imediatamente em “Não informada”.
- Parcela única é exibida como “À vista”.

## Validação neste ambiente
- Os quatro arquivos alterados passaram por parse/transpilação TypeScript isolada sem erros de sintaxe.
- O ZIP original excluiu `node_modules`; a reinstalação completa das dependências excedeu o tempo disponível neste ambiente. Portanto, execute no projeto local: `npx tsc --noEmit`, `npm run lint`, `npm test` e `npm run build` antes do deploy.
