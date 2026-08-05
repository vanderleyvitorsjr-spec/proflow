# Banco de dados

Use um Supabase de desenvolvimento dedicado. `DATABASE_URL` aponta para o pooler da aplicação; `DIRECT_URL` usa conexão direta para migrations. Nunca use produção em testes.

Execute `npm run db:validate`, `npm run db:generate` e `npm run db:status`. Após backup e revisão do SQL, use `npm run db:migrate:dev` em desenvolvimento ou `npm run db:migrate:deploy` em ambiente já versionado. Confirme tabelas, índices, constraints, RLS e policies.

O pooler transacional não deve executar migrations. A ausência de `localhost:5432` apenas indica que o fallback local não está ativo. Rollback exige restauração do backup e reversão do código; não apague migrations já aplicadas.
