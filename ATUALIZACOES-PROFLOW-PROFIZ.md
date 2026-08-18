# Atualizações ProFlow — fluxo operacional inspirado no Profiz

Data: 18/08/2026

## Entregue neste pacote

- Navegação do ProFlow reorganizada para o fluxo de empresa de serviços.
- Barra de navegação inferior responsiva no celular: Início, Agenda, OS, Clientes e Mais.
- Dashboard com atalhos operacionais.
- Novo módulo **Serviços** com catálogo de Climatização, Elétrica e T.I.; preço padrão; unidade; garantia; checklist padrão; busca e filtro.
- Novo módulo **Produtos** com Climatização, Elétrica e T.I.; marca; custo; venda; garantia; observações; busca e filtro.
- Novo módulo **Recibos** com numeração; cliente; descrição; valor; forma de pagamento; data; observações e impressão.
- **T.I.** incluído como área válida em Ordens de Serviço e Orçamentos.
- **T.I.** incluído no cadastro de clientes, incluindo perfil multissetorial.
- Agenda ganhou o tipo **T.I. / Suporte técnico**.
- Estoque ganhou categoria **T.I. / Informática**.
- Equipamentos ganharam os tipos **Servidor**, **Impressora** e **Equipamento de rede**, além de computador/notebook.
- Catálogo inicial de T.I. inclui visita técnica, configuração de rede/compartilhamento, servidor e instalação/configuração de software.
- Telas novas seguem o tema visual existente do ProFlow e foram construídas para desktop, tablet e celular.

## Estrutura já existente e preservada

O pacote preserva os módulos que já estavam implementados no ProFlow, incluindo Clientes, CRM, Agenda, Ordens, Orçamentos, Precificação, Financeiro, Estoque, Fornecedores, Equipamentos, Relatórios, Documentos, Biblioteca Técnica, Equipe, Configurações e automações.

## Persistência dos módulos novos

Serviços, Produtos e Recibos usam armazenamento local versionado neste lote para não alterar migrations, Supabase ou banco de produção sem uma migration revisada. Os módulos existentes continuam usando seus adapters e persistências atuais.

## Validação

Os arquivos TS/TSX novos e os componentes diretamente alterados foram verificados por compilação sintática com o compilador TypeScript disponível no ambiente. O `npm ci` completo não pôde ser executado neste ambiente porque uma dependência não estava presente no cache offline; por isso não é declarado build completo de produção aqui.

## Refinamento visual — estética Profiz + identidade ProFlow

- Sidebar redesenhada com hierarquia visual semelhante a aplicativos operacionais de campo: área de marca, cartão de perfil, itens compactos e estado ativo destacado.
- Paleta ProFlow preservada em azul, removendo o verde característico do Profiz.
- Dark mode atualizado para superfícies grafite mais neutras e planas, próximas da leitura operacional observada no Profiz.
- Light mode atualizado com sidebar cinza-clara e conteúdo de baixo ruído visual.
- Cabeçalho superior simplificado e busca global priorizada no desktop.
- Cards, tabelas, inputs e botões receberam acabamento mais plano, com menos sombras e menor raio.
- Tabelas em dark mode ganharam alternância sutil de linhas e hover discreto.
- Navegação móvel continua fixa no rodapé, preservando acesso rápido a Início, Agenda, OS e Clientes.
- Responsividade existente foi preservada em desktop, tablet e celular.
