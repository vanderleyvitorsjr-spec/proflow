# ProFlow — Precificação V3

## Correções principais

- A precificação agora alerta e bloqueia o salvamento quando a mão de obra está zerada ou sem horas-homem.
- O resultado passa a mostrar "Lucro da empresa" e explica que pró-labore, mão de obra e custos fixos fazem parte do custo, não do lucro.
- Incluído "Valor técnico sem materiais" para permitir enxergar quanto o sistema está formando para o serviço propriamente dito antes dos materiais.
- Mantida a fórmula financeira por divisor: preço = custo / (1 - margem - imposto - taxa), evitando margem sobre margem.
- O componente legado de calculadora também foi corrigido para a mesma fórmula, evitando divergências futuras.
- Valores padrão legados e inflados da calculadora antiga foram zerados/normalizados.

## Campos numéricos

- Distância total em km agora é digitável sem setas de incremento.
- Horas-homem e horas/usos de equipamento agora são digitáveis em campo decimal brasileiro.
- Custos fixos mensais em Configurações agora usam campo monetário em reais.
- Dias produtivos, horas faturáveis por dia e horas mensais de equipamento agora usam campos sem spinners.
- Percentuais em Configurações usam máscara brasileira.
- Custo por km usa campo monetário brasileiro.

## Hora técnica

- O ProFlow continua usando CHT = custos fixos mensais / (dias produtivos x horas faturáveis por dia).
- A configuração foi renomeada para "Horas faturáveis por dia" para deixar claro que o denominador deve representar horas realmente disponíveis para serviços faturáveis.
- Se os custos fixos estiverem zerados e não houver custo/hora manual, o sistema não trata o preço como completo.
