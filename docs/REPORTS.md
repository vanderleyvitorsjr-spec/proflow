# Painel e Relatórios

Dados comerciais e técnicos novos ficam disponíveis por actions públicas para
futura inclusão em indicadores, sem acesso direto aos adapters.

O Painel Executivo e os Relatórios usam o mesmo mecanismo de agregação e
status de fontes. Indicadores indisponíveis não são inventados. Comparações só
são exibidas quando existe base válida.

A exportação CSV usa UTF-8 com BOM, ponto e vírgula, cabeçalhos em português e
formatadores brasileiros, mantendo compatibilidade com o Excel configurado
para o Brasil.

Limitações: Metas são persistidas somente no navegador atual; fontes locais
indisponíveis permanecem claramente sinalizadas.

Metas Executivas agora são configuráveis localmente no Painel e em Relatórios.
O progresso não é calculado quando o valor-alvo é zero ou o realizado está
indisponível. A exportação das Metas usa o mesmo padrão CSV brasileiro.
