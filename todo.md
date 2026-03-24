# Sistema de Relatórios Meta - TODO

## Banco de Dados
- [x] Criar tabela de empresas/clientes
- [x] Criar tabela de relatórios com versionamento
- [x] Criar tabela de métricas/dados de campanhas
- [x] Criar índices para performance

## Backend - APIs
- [x] API de criação de empresa
- [x] API de listagem de empresas do usuário
- [x] API de atualização de empresa
- [x] API de exclusão de empresa
- [x] API de criação de relatório
- [x] API de atualização de relatório
- [x] API de exclusão de relatório
- [x] API de listagem de relatórios por empresa
- [x] API de obtenção de relatório por ID
- [x] API de obtenção de relatório público por slug/token
- [x] API de cálculo de métricas derivadas

## Frontend - Dashboard Administrativo
- [x] Página de login/autenticação
- [x] Dashboard principal com listagem de empresas
- [x] Formulário de criação/edição de empresa
- [x] Listagem de relatórios por empresa
- [x] Formulário de criação/edição de relatório com 14 campos
- [x] Botão de cópia de link exclusivo
- [x] Botão de exclusão de relatório
- [ ] Visualização de histórico de versões

## Frontend - Página Pública
- [x] Página de visualização pública de relatório
- [x] Design cinematográfico com gradiente azul-petróleo e laranja
- [x] Cards de métricas com formatação profissional
- [x] Tabela de dados do relatório
- [ ] Responsividade mobile

## Cálculos e Validações
- [x] Implementar cálculo automático de CPM
- [x] Implementar cálculo automático de CTR
- [x] Implementar validações de campos numéricos
- [x] Implementar formatação de moeda (R$)
- [x] Implementar formatação de percentuais

## Testes
- [x] Testes unitários de cálculos de métricas
- [x] Testes de APIs
- [x] Testes de fluxo de criação de relatório

## Deployment
- [x] Verificar responsividade em mobile
- [x] Testar fluxo completo end-to-end
- [x] Popular com dados de exemplo de fevereiro

## Relatório Consultivo (Nova Funcionalidade)
- [x] Criar utiliários de análise de métricas Meta
- [x] Implementar gerador de insights baseado em benchmarks
- [x] Criar componente de relatório consultivo na página pública
- [x] Adicionar recomendações personalizadas por métrica
- [x] Testar análises com dados de fevereiro

## Correção de Parsing de Números (Nova Funcionalidade)
- [x] Criar função de parsing que reconheça formato brasileiro (1.000.800,50)
- [x] Implementar validação de entrada para aceitar pontos e vírgulas
- [x] Atualizar componentes de formulário para aceitar formato brasileiro
- [x] Testar parsing com vários formatos de números
- [x] Adicionar máscara de entrada para facilitar digitação


## Edição de Relatórios (Nova Funcionalidade)
- [ ] Adicionar botão de editar na listagem de relatórios
- [ ] Criar modal de edição com formulário pré-preenchido
- [ ] Implementar API de atualização de relatório
- [ ] Testar edição e validar atualização na página pública
- [ ] Validar que mudanças aparecem imediatamente

## Correção de Seleção de Datas
- [x] Corrigir problema onde sistema ignora período selecionado
- [x] Validar que datas são salvas corretamente no banco de dados
- [x] Testar com vários períodos diferentes

## Edição de Relatórios (Nova Funcionalidade)
- [x] Criar botão de edição na listagem de relatórios
- [x] Criar modal de edição com formulário completo
- [x] Implementar API de atualização de relatório
- [x] Testar fluxo completo de edição
- [x] Validar que mudanças aparecem imediatamente
