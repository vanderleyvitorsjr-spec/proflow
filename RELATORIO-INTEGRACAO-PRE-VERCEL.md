# ProFlow — Integração pré-Vercel

## Objetivo desta revisão

Fechar o fluxo operacional e financeiro principal antes do deploy, mantendo a identidade e a responsividade já aprovadas, e adaptar ao ProFlow as regras de integração que funcionavam como princípio no StudioFlow: dado conhecido não deve ser digitado duas vezes e módulos devem alimentar uns aos outros.

## Fluxo principal implementado

```text
CRM
  ↓ aprovação / orçamento aceito
Cliente
  ↓ orçamento
Precificação sistêmica
  ↓ gera simulação auditável
Simulação
  ↓ Cliente / CRM / Ordem de Serviço
Ordem de Serviço
  ↓ aplicar preço
Financeiro
  ↓ recebível / parcelas / baixa
Regra dos Três
  ↓
Salário / Empresa / Fundo de reserva
  ↓
Relatório anual gerencial

Equipamentos próprios
  ↓ depreciação + manutenção média
CFM da Precificação
```

## CRM → Clientes

- Mover um lead para **Aprovados** converte automaticamente o registro em Cliente.
- O vínculo fica gravado no lead por `convertedClientId` e `convertedAt`.
- A mesma conversão não ocorre duas vezes.
- Se a criação do Cliente falhar, a aprovação é revertida.
- Simulações de Precificação já ligadas ao Lead recebem o novo `clientId` automaticamente após a conversão.
- A ação **Criar orçamento** leva o vínculo do CRM e, quando disponível, o Cliente convertido para a Precificação.

## Clientes como visão integrada

A lista e a ficha do Cliente não dependem mais dos antigos totais demonstrativos. Os indicadores são derivados dos módulos reais:

- **Recebido**: pagamentos/receitas realizadas do Financeiro vinculados ao `clientId`.
- **A receber**: saldo aberto dos recebíveis daquele Cliente.
- **OS ativas**: Ordens reais ainda não concluídas/canceladas.
- **Equipamentos**: equipamentos de propriedade do Cliente vinculados ao cadastro.
- contatos, endereços e observações do Cliente também passam a ser sincronizados remotamente por empresa.

## Precificação sistêmica

Fonte principal de cálculo:

1. `CFM = custos fixos + pró-labore + depreciação/manutenção mensal dos equipamentos próprios`.
2. `CHT = CFM / (dias produtivos × horas produtivas por dia)`.
3. `CVS = materiais + itens técnicos + deslocamento + alimentação + ajudante + terceiros + outros variáveis`.
4. `CTS = horas estimadas × CHT + CVS`.
5. `PV = CTS / (1 - ((margem + imposto + cartão) / 100))`.

O pró-labore é obrigatório. A geração é bloqueada quando pró-labore, capacidade produtiva ou divisor forem inválidos.

A composição técnica possui perfis para:

- instalação de ar-condicionado;
- manutenção/higienização de ar-condicionado;
- refrigeração;
- circuito/instalação elétrica;
- manutenção elétrica;
- composição personalizada.

Os perfis carregam **itens e estrutura**, não preços fictícios. Quantidade e custo unitário vêm dos custos reais da empresa/fornecedor. O campo SINAPI/mercado é apenas referência comparativa e não entra automaticamente no preço final.

O cálculo sistêmico gera uma **Simulação real da Precificação**, com ajuste centesimal para que o custo representado preserve exatamente o CTS arredondado em centavos. Essa simulação pode ser vinculada a Cliente, CRM e Ordem de Serviço e aplicada à OS.

## Equipamentos → Precificação e Financeiro

Equipamentos voltou ao menu e possui:

- ativos próprios, de clientes e de terceiros;
- ferramentas, veículos, instrumentos, máquinas e outros ativos duráveis;
- aquisição;
- vida útil;
- valor residual;
- depreciação linear;
- valor atual;
- garantia;
- manutenção preventiva/corretiva;
- vínculo com OS;
- integração financeira explícita para aquisição/manutenção;
- referência para Precificação.

Somente ativos próprios da empresa entram automaticamente no custo fixo da Precificação. A depreciação mensal deixa de compor o custo depois de esgotada a vida útil e o custo médio mensal de manutenção usa manutenções concluídas nos últimos 12 meses.

## Precificação → Ordem → Financeiro

Ao aplicar uma simulação vinculada a uma OS:

- o preço é aplicado como snapshot na Ordem;
- o usuário informa primeiro vencimento e quantidade de parcelas;
- o Financeiro cria automaticamente a conta a receber da OS;
- o recebível guarda Cliente e Ordem;
- uma chave idempotente impede gerar o recebível principal duas vezes para a mesma OS.

## Financeiro

O Financeiro mantém:

- receitas realizadas;
- despesas e investimentos;
- contas a receber;
- contas a pagar;
- parcelas;
- pagamentos, reversões e cancelamentos;
- Cliente e OS vinculados;
- posição recebida e em aberto;
- fonte do recurso usado em saídas.

## Regra dos Três

Percentuais configuráveis com soma obrigatória de 100%:

- Salário;
- Caixa da empresa;
- Fundo de reserva.

Cada recebimento grava um snapshot da distribuição vigente naquele momento. Alterar percentuais no futuro não reescreve o histórico anterior.

Ao registrar saída, o usuário escolhe a origem do recurso. Retiradas da Reserva criam **Reserva a recompor**; somente parcelas destinadas à Reserva em recebimentos posteriores reduzem essa obrigação cronologicamente.

## Relatório anual

O Financeiro exporta CSV anual e impressão/salvamento em PDF com:

- receita por competência;
- receita efetivamente recebida;
- despesas efetivamente pagas;
- investimentos pagos;
- resultado de caixa;
- contas a receber abertas;
- depreciação estimada de equipamentos no ano;
- Regra dos Três;
- receitas recebidas por Cliente;
- receitas recebidas por categoria;
- resumo mês a mês;
- movimentação realizada do ano com data, tipo, título, categoria, cliente/fornecedor, OS e valor.

É um relatório gerencial de apoio para conferência e contador; não é uma declaração fiscal oficial.

## Persistência, multiempresa e migração do navegador

CRM, Clientes, relacionamentos do Cliente, Ordens, Financeiro, Precificação, Equipamentos, Configurações e Precificação Sistêmica são sincronizados no servidor por empresa usando `module_states` e o `companyId` autenticado.

O `localStorage` permanece como espelho/fallback e como fonte de migração do conteúdo já existente no navegador. Chaves legadas são copiadas para o escopo da empresa antes da primeira sincronização.

Novas empresas não recebem mais os antigos leads/clientes/OS/equipamentos/transações demonstrativos. O Financeiro nasce apenas com uma conta principal zerada e a distribuição padrão da Regra dos Três, que pode ser alterada.

### Limite conhecido

A persistência dos módulos usa snapshots JSON por empresa. Isso resolve recarga, Vercel e uso em dispositivos diferentes, mas duas edições simultâneas no mesmo módulo ainda seguem **última gravação vence**. Não existe merge colaborativo em tempo real neste ciclo.

## Migration nova

```text
prisma/migrations/20260809143000_add_module_state_persistence/migration.sql
```

Antes do deploy, executar localmente contra o banco correto:

```powershell
npm install
npx prisma generate
npx prisma migrate deploy
npm run prevercel:check
npm run dev
```

Depois da migration, o projeto deve reportar 15 migrations conhecidas e nenhuma migration pendente.

## Teste manual obrigatório antes do Vercel

1. Criar Lead.
2. Criar uma simulação/orçamento a partir do Lead.
3. Mover o Lead para Aprovados.
4. Confirmar que aparece em Clientes e que a simulação recebeu o vínculo do Cliente.
5. Confirmar na ficha do Cliente `Recebido` e `A receber` derivados do Financeiro.
6. Preencher CFM, pró-labore, capacidade produtiva, CVS, margem, imposto e taxa de cartão.
7. Gerar simulação aplicável e conferir CTS/PV.
8. Criar/vincular uma OS e aplicar o preço.
9. Confirmar o recebível automático no Financeiro.
10. Baixar uma parcela e confirmar a distribuição da Regra dos Três.
11. Registrar despesa usando Fundo de reserva e conferir `Reserva a recompor`.
12. Registrar recebimento posterior e confirmar redução da recomposição.
13. Cadastrar equipamento próprio com vida útil e valor residual.
14. Confirmar depreciação/manutenção no CFM da Precificação.
15. Exportar CSV anual e abrir impressão/PDF.
16. Abrir o sistema em outro navegador/dispositivo com a mesma conta e conferir os módulos principais.
