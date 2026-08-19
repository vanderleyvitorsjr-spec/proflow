# ProFlow — Auditoria da Precificação V2

Data: 18/08/2026

## Diagnóstico do preço inflado

A estrutura anterior tinha dois caminhos de precificação. O caminho legado continha defaults muito altos para uma instalação simples: materiais R$ 650, 4 h, 2 técnicos a R$ 85/h, equipamento R$ 120, 40 km, alimentação R$ 120, imposto 6%, comissão 3% e margem 35%. Isso empurrava o preço para mais de R$ 2 mil mesmo antes de refletir a operação real.

No fluxo novo, a fórmula de preço usa divisor financeiro corretamente, mas os padrões antigos de margem (35% recomendada e 50% premium) e custo/km zerado ainda podiam continuar salvos no navegador. Foi criada migração leve para substituir somente os defaults antigos ainda intactos por:

- margem mínima: 15%;
- margem recomendada: 20%;
- margem premium: 25%;
- custo por km: R$ 2,50.

Personalizações diferentes dos defaults antigos são preservadas.

## Nova metodologia

1. Custo da hora técnica = custos fixos mensais / (dias produtivos × horas produtivas por dia).
2. Custo de mão de obra = horas-homem × custo da hora técnica.
3. Somar materiais em dinheiro, equipamentos rateados por uso, deslocamento efetivo e outros custos diretos.
4. Custos fixos não são adicionados novamente como overhead por serviço quando já formam a hora técnica.
5. Preço de venda = custo total / (1 - margem - imposto - taxa de cartão/antecipação).
6. Margem, imposto e taxa de cartão entram uma única vez.

## Exemplo matemático

Cenário didático:

- custos fixos mensais: R$ 5.281,00;
- 22 dias produtivos;
- 8 horas por dia;
- custo da hora técnica: R$ 5.281 / 176 = R$ 30,01/h;
- duração: 4 horas;
- mão de obra: R$ 120,04;
- materiais: R$ 290,00;
- deslocamento: R$ 25,00;
- estacionamento: R$ 10,00;
- alimentação: R$ 35,00;
- custo total: R$ 480,04;
- margem: 20%;
- imposto: 0%;
- cartão/antecipação: 3%.

Preço = 480,04 / (1 - 0,20 - 0,03) = R$ 623,43.

Lucro econômico preservado no preço: aproximadamente 20% sobre a venda, depois da taxa de cartão considerada no divisor.

## Alterações de interface

- removidos os dados técnicos de climatização da precificação;
- materiais passam a ser informados pelo valor total em R$;
- removido o seletor Rascunho/Pronta da criação/edição;
- novas precificações são salvas como prontas internamente;
- removido filtro de status da tela principal;
- mão de obra usa horas-homem;
- nova área mostra custos fixos, dias produtivos, horas/dia e custo calculado da hora técnica;
- botão para aplicar a hora técnica calculada às linhas de mão de obra;
- deslocamento usa R$ 2,50/km como referência padrão quando não houver personalização;
- taxa anteriormente chamada Comissão na interface de precificação passa a representar Taxa do cartão / antecipação;
- custos indiretos antigos deixam de ser oferecidos como novo componente para evitar duplicidade;
- equipamentos continuam integrados ao cadastro e são rateados pela depreciação/manutenção por hora mensal, nunca pelo valor integral do ativo;
- diagnóstico alerta equipamento excessivo, deslocamento excessivo, overhead legado, hora técnica fora do padrão e instalação muito acima da referência pública.

## Referências de mercado usadas apenas como conferência

- Instalação de ar-condicionado em Porto Seguro/BA: publicação consultada em agosto/2026 apresentou mínimo R$ 338, média R$ 520 e máximo R$ 702 para instalação residencial padrão.
- Serviço residencial simples de eletricista: referência pública de R$ 299,90 para até três serviços, sem materiais.
- Assistência de computador em Porto Seguro: anúncio local encontrado a partir de R$ 99. Empresas locais de T.I. consultadas oferecem suporte, redes e servidores, mas não publicam tabela de preços para serviços empresariais.

Essas referências não substituem o cálculo. Servem somente para detectar resultados potencialmente fora do padrão e solicitar revisão dos componentes.

## Identidade/PWA

- restaurado o ícone azul do ProFlow enviado pelo usuário;
- ícone no menu lateral e barra superior;
- favicon substituído;
- manifest PWA criado;
- ícones 192x192, 512x512 e Apple Touch Icon configurados;
- instalação na área de trabalho, iPad e celular passa a apontar para a identidade ProFlow.
