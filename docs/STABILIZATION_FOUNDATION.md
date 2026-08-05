# Estabilização da Fundação

Este lote remove o fallback local do Prisma, torna a aceitação de convites explícita e idempotente, permite negações personalizadas de permissões e isola os principais adapters locais por empresa.

## Mudanças principais

- `DATABASE_URL` passa a ser obrigatória. O sistema não tenta mais conectar silenciosamente a `localhost`.
- Convites somente alteram o banco depois da confirmação do usuário por uma Server Action.
- Permissões personalizadas agora podem conceder ou negar acesso; a negação tem precedência.
- Clientes, CRM, Agenda, Ordens, Financeiro, Estoque, Equipamentos, Fornecedores, Configurações, Perfil, Biblioteca Técnica e Precificação usam chaves locais com `companyId`.
- Dados antigos em chaves globais não são importados ou apagados automaticamente.

## Limitação deste lote

Clientes e CRM ainda utilizam adapters locais. A migração definitiva para Prisma deve ser feita em um lote separado, com migration própria, importador explícito e testes no banco de desenvolvimento.
