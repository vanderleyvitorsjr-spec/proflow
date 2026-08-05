# Testes de integração

Defina `TEST_DATABASE_URL` para um PostgreSQL/Supabase dedicado e descartável. A suíte cria dados próprios e nunca usa produção. Sem essa variável, o teste de banco é explicitamente ignorado; isso não equivale a uma aprovação da integração.
