# Autenticação

O ProFlow usa Supabase Auth com `@supabase/ssr`. A sessão é mantida em cookies pelo `proxy.ts` do Next.js 16. O Dashboard valida novamente a identidade no servidor e exige um `Usuario` ativo vinculado pelo `authUserId`.

Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. A chave de service role nunca pode ser exposta no navegador. Login, logout e expiração de sessão usam Server Actions e mensagens públicas sem detalhes sensíveis.

No Supabase, habilite autenticação por e-mail e configure URLs de redirecionamento apenas para domínios controlados.
