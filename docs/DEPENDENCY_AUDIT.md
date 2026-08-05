# Auditoria de dependências — 30/07/2026

O `npm audit` encontrou inicialmente 17 vulnerabilidades: 13 altas e 4 moderadas. Foram atualizados, sem `--force`, Next.js de 16.2.10 para 16.2.12 e Prisma/client/adapter de 7.8.0 para 7.9.1.

Após a atualização restam 12 vulnerabilidades altas. Elas estão concentradas na cadeia de ferramentas ESLint/minimatch e em dependências transitivas do Next.js (`postcss` e `sharp`). As correções sugeridas pelo npm exigem mudanças major ou downgrade incompatível e, por isso, não foram aplicadas automaticamente.

As vulnerabilidades do ESLint afetam desenvolvimento. `postcss` e `sharp` são transitivas de produção; a exploração depende de CSS, mapas de fonte ou imagens controladas por atacante. Devem ser acompanhadas em novas versões compatíveis do Next.js.
