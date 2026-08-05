# Padrões brasileiros de dados

Exportações CSV neutralizam textos iniciados por `=`, `+`, `-` ou `@`, usam
UTF-8 com BOM, separador `;`, datas brasileiras e valores monetários em reais.

- Nomes usam capitalização natural e preservam conectivos.
- E-mails são armazenados em minúsculas.
- CPF, CNPJ, CEP e telefones são armazenados apenas com dígitos e formatados na apresentação.
- Valores financeiros são armazenados preferencialmente em centavos.
- Datas persistidas usam tipos de data ou ISO; apresentação usa `dd/MM/aaaa` e `dd/MM/aaaa às HH:mm`.
- Códigos, placas, URLs, senhas, tokens e números de série não recebem capitalização automática.

Os helpers canônicos estão em `lib/br-formatters.ts`. Módulos não devem criar formatadores concorrentes.
