# Multiempresa

`Empresa.id` é o identificador canônico do tenant. `Empresa.companyId` permanece apenas por compatibilidade histórica.

O `companyId` operacional sempre é derivado da sessão: identidade Supabase → `Usuario.authUserId` → `Usuario.companyId`. Valores enviados pelo navegador não são fonte de autorização. Consultas devem combinar ID do recurso e empresa.

Os módulos ainda locais serão migrados em lote posterior. O helper central de chaves já define `proflow:{companyId}:{domínio}:v{versão}` e preserva a chave antiga somente para detecção explícita, sem importação silenciosa.
