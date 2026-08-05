# Conclusão Operacional do ProFlow

Este lote substitui a persistência principal no navegador por estado multiempresa armazenado no PostgreSQL para os módulos operacionais mais utilizados, preservando a interface e os contratos existentes.

## Entregas

- Clientes, CRM, Agenda, Ordens, Financeiro, Estoque e Equipamentos passam a usar `CompanyModuleState` no banco.
- Dados locais existentes são importados automaticamente na primeira leitura quando ainda não existe estado remoto para a empresa.
- Cada gravação preserva um backup remoto da versão anterior.
- Workspace de Ordem passa a persistir equipe, materiais, custos e eventos no servidor.
- Materiais selecionados no Workspace podem reservar, consumir e devolver saldo no Estoque mediante confirmação explícita.
- Evidências de Ordens usam bucket privado do Supabase Storage e URLs assinadas temporárias.
- Central de Documentos permite armazenamento privado, download autorizado e remoção controlada.
- Comprovante financeiro pode ser visualizado, impresso ou salvo em PDF quando existe valor registrado.
- Assistente Inteligente analisa dados reais da empresa e registra a consulta na auditoria, sem executar ações sensíveis.

## Segurança

- Todas as operações de estado são filtradas por `companyId` obtido da sessão autenticada.
- O endpoint de estado valida permissões de leitura e escrita por módulo.
- Arquivos são privados e acessados por URL assinada de curta duração.
- O bucket `proflow-private` é criado automaticamente pelo servidor quando necessário.
- Nenhuma chave secreta é enviada ao navegador.

## Persistência

A estrutura `CompanyModuleState` é uma ponte segura entre a arquitetura local existente e a futura normalização integral dos módulos. Ela permite sincronização entre dispositivos e usuários sem reescrever imediatamente todos os contratos de interface.

Clientes e CRM podem ser normalizados em tabelas relacionais em um lote posterior, mantendo os mesmos services e componentes.
