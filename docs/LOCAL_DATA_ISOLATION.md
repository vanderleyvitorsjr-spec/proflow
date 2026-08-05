# Isolamento local

Chaves novas seguem `proflow:{companyId}:{domínio}:v{versão}`. O tenant vem da sessão, nunca de entrada editável. Chaves globais antigas são somente detectadas: não são importadas nem apagadas automaticamente.

Troca de empresa e logout devem invalidar caches em memória. Adapters não podem usar a chave global como fallback silencioso.
