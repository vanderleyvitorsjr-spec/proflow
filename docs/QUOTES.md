# Orçamentos Profissionais

O agregado local segue `Página → Action → Service → Repository → Storage Adapter`.

- Chave: `proflow:{companyId}:orcamentos:v1`.
- Numeração `ORC-AAAA-NNNNNN`, independente da posição nas listas.
- Versões são novos registros vinculados; versões anteriores não são apagadas.
- Itens usam centavos inteiros e snapshots de serviços.
- Aprovação, recusa, cancelamento e conversão são explícitos.
- Conversão não cria pagamento nem movimenta Estoque.
- PDF usa a impressão do navegador; CSV segue o padrão brasileiro.

Sem servidor, a unicidade é garantida somente na empresa e navegador atuais.
