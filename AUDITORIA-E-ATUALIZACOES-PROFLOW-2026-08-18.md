# Auditoria e atualização do ProFlow — 18/08/2026

## Escopo executado

A atualização foi feita sobre a arquitetura atual do ProFlow, preservando os módulos existentes e sem criar migração de banco nesta etapa.

### 1. Precificação

A aba de Precificação foi reestruturada para operar como calculadora profissional para três segmentos:

- Ar-condicionado / Refrigeração
- Elétrica
- T.I.

A lógica existente de margem foi preservada porque já utiliza o denominador correto sobre o preço de venda. Imposto sobre venda, comissão e margem são descontados do denominador; não foi convertido para markup simples.

A nova criação/edição de precificação agora possui:

- segmento;
- tipo de serviço por segmento;
- forma de cobrança;
- complexidade;
- urgência;
- risco operacional;
- garantia;
- SLA para T.I.;
- campos técnicos por segmento;
- composição de custo em português;
- resultado em tempo real;
- preço mínimo;
- preço recomendado;
- preço premium;
- preço com desconto;
- lucro estimado;
- margem efetiva;
- aviso quando o preço final fica abaixo do mínimo.

### 2. Materiais e deslocamento

Materiais não são mais apresentados ao usuário como uma unidade genérica na criação da precificação. A linha de material recebe diretamente o custo em reais.

Deslocamento substitui o termo TRAVEL na interface. O usuário pode informar:

- valor fixo em reais; ou
- cálculo detalhado por km, com origem, destino, distância, custo por km, pedágio, estacionamento, alimentação, hospedagem e outras despesas.

### 3. Equipamentos conectados à precificação

A precificação consulta o cadastro real de equipamentos do ProFlow. Ao selecionar um equipamento:

- o equipamento fica vinculado à composição;
- o snapshot do equipamento é preservado;
- custo mensal de depreciação e manutenção é usado para derivar o custo por hora/uso;
- alterações manuais ficam identificadas;
- equipamento que não pertence à empresa não recebe depreciação própria;
- divergências futuras do cadastro continuam rastreáveis pela arquitetura existente.

### 4. T.I.

A precificação de T.I. inclui suporte, computadores, sistemas, redes, servidores, segurança/backup, infraestrutura e serviços empresariais.

O serviço de implantação de compartilhamento para exames OCT foi incluído como referência técnica, incluindo pasta centralizada, máquina OCT, recepção, salas, permissões, testes de leitura/gravação e orientação da equipe.

### 5. CRM → Cliente

Ao mover uma oportunidade para `Aprovado`, o ProFlow passa a criar automaticamente o cadastro do cliente quando ainda não houver cliente convertido.

Os dados são normalizados antes do cadastro e o segmento é inferido pelo serviço de interesse entre Climatização, Elétrica, T.I. ou Multissegmento.

A conversão manual continua disponível como mecanismo de revisão.

### 6. Ordem de Serviço → Financeiro → Dashboard/Relatórios

Ao concluir uma Ordem de Serviço com valor válido e cliente válido, o ProFlow passa a garantir a criação idempotente do recebível principal no Financeiro.

Isso usa uma chave única por OS, evitando duplicar o recebível ao processar a conclusão novamente.

Como Dashboard e Relatórios já consomem as fontes operacionais/financeiras existentes, o recebível passa a entrar na mesma cadeia de dados utilizada por esses módulos.

### 7. Formatação brasileira

Nos fluxos principais revisados foram mantidos/aplicados os formatadores compartilhados do ProFlow:

- nomes: capitalização adequada;
- telefone: `(00) 0 0000-0000` ou formato de telefone fixo quando aplicável;
- CPF/CNPJ: pontuação brasileira;
- moeda: `R$ 250,00`, `R$ 2.000,00`;
- percentuais: formatação brasileira.

A conversão manual CRM → Cliente também passou a utilizar os componentes mascarados de nome, CPF/CNPJ e telefone.

### 8. Navegação removida

Foram removidos do menu principal:

- Central Operacional
- Automações
- Equipe
- Biblioteca Técnica
- Documentos

As rotas/código subjacente não foram apagadas para evitar quebra de integrações ou perda de compatibilidade; apenas deixam de ser expostas na navegação solicitada.

### 9. Configurações

Foram removidos da navegação de Configurações:

- Equipe
- Metadados da logomarca

### 10. Identidade visual

O cabeçalho lateral e a tela de login usam a nova marca ProFlow azul/branca. A linguagem visual do módulo de Precificação não usa laranja como cor de identidade; alertas utilizam tons funcionais separados da marca.

## Validação matemática

Premissas dos três cenários abaixo:

- imposto sobre preço de venda: 6%
- comissão: 3%
- margem recomendada: 30%
- sem desconto

Fórmula usada pela calculadora:

`Preço = custo / (1 - imposto - comissão - margem)`

### Cenário A — Instalação de ar-condicionado

Composição ilustrativa validada:

- mão de obra: R$ 300,00
- materiais: R$ 350,00
- equipamentos: R$ 60,00
- deslocamento: R$ 90,00
- custos indiretos: R$ 50,00
- custo total: R$ 850,00

Resultado:

- preço recomendado: R$ 1.393,44
- lucro estimado após imposto e comissão: R$ 418,03
- margem efetiva: aproximadamente 30,00%

### Cenário B — Serviço elétrico

Composição ilustrativa validada:

- mão de obra: R$ 200,00
- materiais: R$ 120,00
- equipamentos: R$ 20,00
- deslocamento: R$ 50,00
- custos indiretos: R$ 30,00
- custo total: R$ 420,00

Resultado:

- preço recomendado: R$ 688,52
- lucro estimado após imposto e comissão: R$ 206,55
- margem efetiva: aproximadamente 30,00%

### Cenário C — T.I.

Composição ilustrativa validada:

- mão de obra: R$ 320,00
- materiais/insumos: R$ 30,00
- equipamentos: R$ 40,00
- deslocamento: R$ 80,00
- custos indiretos/reserva: R$ 130,00
- custo total: R$ 600,00

Resultado:

- preço recomendado: R$ 983,61
- lucro estimado após imposto e comissão: R$ 295,09
- margem efetiva: aproximadamente 30,00%

## Validação técnica realizada

Foi executada validação sintática/transpilação TypeScript dos arquivos alterados usando o compilador TypeScript disponível no ambiente, sem erros de sintaxe.

O build completo do Next.js não pôde ser executado neste ambiente porque o ZIP de código não contém `node_modules` e a instalação das dependências não ficou disponível no runtime. Antes do deploy, executar localmente:

```powershell
npm install
npm run build
```

Se o build concluir, seguir com o deploy de produção.
