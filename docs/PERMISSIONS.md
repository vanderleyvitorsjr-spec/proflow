# Permissões

As funções são Proprietário, Administrador, Gestor, Atendimento, Financeiro, Técnico, Estoque e Visualização. O catálogo e a matriz vivem em `lib/auth/permissions.ts`.

A navegação é filtrada para orientar o usuário, mas a segurança depende de `requirePermission()` nas operações de servidor. O perfil Visualização não altera dados; Técnico não confirma pagamento; Financeiro não movimenta Estoque; Estoque não gerencia Configurações. O último Proprietário não pode ser desativado ou rebaixado.
