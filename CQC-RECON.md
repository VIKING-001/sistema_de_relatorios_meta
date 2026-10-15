# Mapa Funcional do CQC

Data da observacao: 15/10/2026
Referencia: `https://cqc.onpromedia.com.br/`
Objetivo: registrar padroes funcionais que podem inspirar o Sistema de Relatorios Meta, sem copiar marca, textos, layout proprietario ou dados de clientes.

## Metodo e limites

- As telas foram observadas em uma sessao autenticada, em modo somente leitura.
- Nenhuma configuracao, integracao, usuario, plano ou dado foi criado, alterado ou removido.
- O inventario abaixo descreve o que estava visivel na interface; nao valida a infraestrutura interna nem garante que cada integracao esteja ativa.
- A skill REA pede um endpoint CDP local para gerar evidencias estruturadas. O navegador conectado nao expoe esse endpoint, entao a inspecao foi feita pela arvore de acessibilidade do navegador, sem uma analise REA de bundles ou chamadas internas.
- Onboarding abriu sem conteudo acessivel na observacao; detalhes de telas de conversa foram limitados para nao registrar mensagens ou identificadores pessoais.

## Inventario de telas

| Area | Funcionalidades observadas | Relevancia para o Sistema de Relatorios Meta |
|---|---|---|
| Visao Geral | Periodo atual vs periodo anterior de mesma duracao; escolha entre data da conversa e data da venda; filtros por origem e numero; leads, vendas, receita, ticket, valor por lead e tempos de resposta; serie diaria; desempenho por canal; funil; mapa de calor hora x dia; desempenho por UTM | Alta: conecta origem, conversas, etapas, vendas e eficiencia do atendimento |
| Conversas | Vista em tabela e Kanban; busca; filtros por status, origem, tags, numero, etapa, UTM e periodo; exportacao CSV; tempo de primeira resposta, ultima mensagem de lead/atendente, resposta media e quantidade de mensagens; abertura de detalhes | Muito alta: CRM operacional e rastreabilidade por contato |
| Meu Progresso | Janela movel de 30 dias comparada ao periodo anterior; leads, vendas, receita, conversao, resposta e marcos | Media: resumo de evolucao para operacao |
| Numeros | Gestao de numeros conectados, estado da conexao, empresa, notificacoes e acoes | Alta para estado e diagnostico de WhatsApp |
| Eventos | Mapeamento de eventos de conversao enviados para plataformas de anuncios; configuracao de evento e condicoes de disparo | Alta, mas requer consentimento, deduplicacao e eventos reais antes de ativar |
| Pixels e Conversoes | Configuracoes Meta CAPI e importacao de conversoes offline do Google Ads | Alta, depende de credenciais, permissoes e correspondencia correta de eventos |
| Links de Rastreamento | Criacao de links que carregam origem/UTM e associam o clique a uma conversa | Muito alta para atribuir uma conversa e venda ao anuncio |
| Formularios (beta) | Captura de leads de formulario/site; associacao por telefone a conversa; indicacao de pendencias e limpeza apos 30 dias | Alta para unificar site e WhatsApp, mas o recurso aparece como beta |
| Empresas | Cadastro e gestao de empresas, dados de pixel, numeros, status e configuracoes operacionais | Media/alta para organizacao multiempresa |
| Usuarios | Busca, filtro por status, perfis de acesso, empresas vinculadas e acoes de usuario | Media; importante ao evoluir para equipe e agencia |
| Configurar IA | Configuracao de tokens por empresa para transcricao de audio e qualificacao automatica; estimativa de custo | Media; requer controles de custo e privacidade |
| Webhooks | Envio de eventos de conversa para CRM, planilhas, Zapier, Make, n8n e outros destinos | Alta para automacao, separada dos webhooks de compra que entram no sistema |
| Meu Plano | Plano, limites de empresas/numeros, complementos, faturas e troca de plano | Baixa para o nucleo de atribuicao; nao replicar cobranca sem decisao de produto |
| Notificacoes | Feed de novidades e mudancas do produto; nao foi observado como alerta operacional de novas mensagens | Baixa/media |
| Central de Ajuda | Busca por tutoriais agrupados por primeiros passos, Meta Ads, Google Ads, IA e funcionalidades | Media: reduz falhas de configuracao |
| Comunidade, suporte e depoimento | Acessos de apoio, contato e feedback | Secundaria; fora do nucleo de rastreamento |

## Fluxos funcionais

1. **Preparar empresa:** criar empresa, conectar numero(s), configurar pixels/eventos e horarios; a conta limita empresas e numeros conforme o plano.
2. **Capturar origem:** criar link rastreavel ou receber uma conversa de anuncio; preservar UTMs e identificadores da origem ao longo do percurso.
3. **Atender e qualificar:** listar ou organizar conversas por etapa, status, origem, numero e tags; acompanhar tempos e mensagens.
4. **Registrar conversao:** associar venda/evento ao contato e a campanha, sem contar novamente o mesmo pedido.
5. **Analisar:** filtrar periodo, canal, numero e origem; comparar intervalos de mesmo tamanho; consultar funil, horarios, tempos e UTM.
6. **Distribuir eventos:** emitir eventos para Meta/Google ou webhooks externos, com validacao, deduplicacao e diagnostico de entrega.

## Comparacao com o Sistema de Relatorios Meta

| Capacidade | Estado no nosso sistema antes desta entrega | Decisao |
|---|---|---|
| Relatorios Meta com metricas, funil e analise IA | Existe e permanece inalterado | Preservar links e dados publicados |
| Portal fixo e comparacao de periodos | Existe | Nao mexer nesta entrega |
| Links UTM, redirecionamento curto e sessoes de clique | Existe; venda atribuida quando checkout/webhook/manual envia identificador | Manter e testar ponta a ponta por plataforma |
| Webhooks de compra | Shopify, WooCommerce, API custom, Zapier e FacilZap possuem adaptadores/validacoes implementados | Nao confundir estes endpoints de entrada com webhooks de saida do CQC |
| Venda manual e separacao de canal site/WhatsApp | Existe | Preservar; canal da venda nao substitui origem da campanha |
| WhatsApp: receber e ler mensagens, atribuicao CTWA e vinculo de venda | Existe parcialmente; mensagens recebidas ficam no historico por telefone | Nao afirmar que envia/responde mensagens pelo painel |
| Etapa/status, etiquetas e quadro por contato | Implementados; etiquetas podem ser usadas para filtrar contatos e atendimentos | Dados antigos recebem etapa padrao `Lead`; conversoes por venda vinculada ficam bloqueadas como estado derivado |
| Historico por sessao, nao apenas por telefone | Implementado para novas mensagens: atendimento novo apos 24h sem atividade; mensagens antigas continuam no historico do contato e nao sao reclassificadas | A janela e uma regra de agrupamento operacional, nao uma afirmacao sobre cobranca Meta; etapas/status continuam no nivel do contato |
| Tempos de primeira resposta/tempo entre mensagens | Implementado para novas mensagens quando a Meta entrega `smb_message_echoes` (Coexistence); a tela informa que dados historicos nao sao reconstruidos | Confirmar assinatura do campo no webhook e validar com um numero real elegivel para Coexistence |
| Funil e segmentacao temporal de conversas | Parcial: sessoes podem ser consultadas, mas ainda nao ha historico de transicoes de etapa nem funil temporal real | Modelar eventos de etapa antes de apresentar taxas de conversao por etapa |
| CAPI Meta / conversoes offline Google | Nao identificado no fluxo atual do nosso app | Integracao futura; depende de requisitos e permissao do usuario |
| Formularios web associados a WhatsApp | Nao identificado no fluxo atual | Integracao futura, com consentimento e normalizacao de telefone |
| Webhooks de saida para automacoes | Nao identificado como produto de webhook generico de eventos | Fase futura; assinar eventos com segredo, retries e historico de entrega |
| IA para transcricao/qualificacao de conversas | Nao existe no fluxo de Conversas; ha IA separada para analise de relatorios | Nao misturar os dois casos de uso nem enviar mensagens a modelo sem politica de dados |

## Implementado nesta entrega

- Etapas comerciais e status independentes para contatos do WhatsApp.
- Filtros por texto, origem, status, etapa e etiqueta; etiquetas nao diferenciam maiusculas/minusculas.
- Alternancia de visualizacao entre lista responsiva e quadro por etapa.
- Atualizacao automatica da lista a cada 15 segundos enquanto a tela esta aberta.
- Mudancas de status/etapa autorizadas por empresa e validadas no servidor.
- Conversao por venda vinculada e estado derivado, sem permitir que a interface sobrescreva essa conversao.
- Resumo calculado em SQL sobre o historico inteiro, nao somente sobre a pagina carregada.
- Contatos e atendimentos sao filtrados no servidor e paginados em lotes de 50; lista e quadro refletem filtros e a pagina atual.
- Etiquetas por contato, com limite de 10, visiveis na lista/quadro e editaveis no detalhe.
- Novas mensagens recebidas sao deduplicadas por `wamid` e gravadas com sessao e contato na mesma transacao; retentativas nao incrementam contagens novamente.
- O webhook confirma sucesso somente apos persistir; falhas retornam erro para permitir retry sem duplicar o processamento.
- Visao separada de atendimentos com filtros no servidor e paginas de 50; o historico antigo continua acessivel na visao de contatos.
- A janela de 24h agrupa mensagens recebidas e ecos outbound capturados para separar atendimentos; dados historicos anteriores ao evento de eco nao sao reclassificados.
- Respostas enviadas pelo WhatsApp Business podem ser gravadas por `smb_message_echoes`; eventos sao deduplicados por `wamid`, vinculados ao contato/atendimento e entram no calculo da primeira resposta.
- O webhook WhatsApp valida `X-Hub-Signature-256` com `META_APP_SECRET`; sem assinatura valida, o evento nao e processado.
- Testes unitarios para filtro, agrupamento e precedencia de conversao.

## Proximas fases recomendadas

1. Validar em producao `smb_message_echoes` com um numero real em Coexistence; somente depois avaliar metricas adicionais de ritmo e SLA.
2. (Concluido) Adicionar etiquetas e paginacao/filtragem no servidor para contatos e atendimentos.
3. Criar webhooks de saida com assinatura, retentativas, idempotencia e tela de entregas.
4. Avaliar CAPI/Google offline e captura de formularios como integracoes independentes, com consentimento, configuracao e diagnostico.
5. Avaliar IA de qualificacao/transcricao separada da analise de relatorios, com controle de consentimento e custo.
