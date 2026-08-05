# Cotações e Compras

- Chave: `proflow:{companyId}:compras:v1`.
- Cotações comparam preço, prazo, frete e condições sem escolha automática.
- Escolher proposta fora do menor preço exige justificativa.
- Pedidos mantêm vínculos opcionais com Cotação, Orçamento e Ordem.
- Recebimentos aceitam total, parcial, divergente ou recusado.
- Idempotência impede o mesmo recebimento local duas vezes.
- A integração atual prepara, mas não executa movimentação de Estoque.
