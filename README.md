# 📊 Sistema de Relatórios Viking - Meta Ads

Um sistema completo de rastreamento, sincronização e análise de campanhas do Meta Ads com rastreamento preciso de vendas.

## 🚀 Quick Start

### 1. Instalação e Setup (Primeira Vez)

```bash
# Clonar o repositório
git clone <seu-repositorio>
cd sistema_de_relatorios_meta

# Instalar dependências
pnpm install

# Executar setup automático (cria banco de dados e tabelas)
npm run init
```

O comando `npm run init` faz tudo automaticamente:
- ✅ Verifica arquivo `.env`
- ✅ Conecta ao banco de dados PostgreSQL
- ✅ Executa migração SQL
- ✅ Cria as 5 tabelas necessárias

### 2. Iniciar Desenvolvimento

```bash
npm run dev
```

Abra http://localhost:5173 no seu navegador.

## 📋 Estrutura do Projeto

```
.
├── client/                 # Frontend React
│   └── src/
│       ├── components/    # Componentes reutilizáveis
│       ├── pages/         # Páginas principais
│       └── lib/           # Utilitários
├── server/                # Backend Node.js + tRPC
│   ├── routers/          # Routers tRPC
│   ├── db.ts             # Funções de banco de dados
│   └── _core/            # Core do servidor
├── drizzle/              # Configuração ORM
│   ├── schema.ts         # Definições de tabelas
│   └── migrations/       # Arquivos SQL de migração
└── scripts/              # Scripts de automatização
```

## 🗄️ Banco de Dados

### Tabelas Criadas

| Tabela | Descrição |
|--------|-----------|
| **metaCampaigns** | Campanhas do Meta Ads (nome, status, orçamento) |
| **metaAdsets** | Conjuntos de Anúncios dentro de cada campanha |
| **metaAds** | Anúncios individuais dentro de cada adset |
| **adMetrics** | Métricas diárias (gastos, cliques, impressões) |
| **adSales** | Rastreamento de vendas por anúncio |

### Schema de Relacionamentos

```
metaCampaigns
    ├── metaAdsets (1:N)
    │   ├── metaAds (1:N)
    │   │   ├── adMetrics (1:N)
    │   │   └── adSales (1:N)
    │   └── adSales (1:N)
    └── adSales (1:N)
```

## 🔄 Fluxo de Dados

### 1. Sincronizar Campanhas do Meta

```
Clique em "Sincronizar do Meta"
    ↓
API busca campanhas/adsets/anúncios
    ↓
Insere/atualiza no banco de dados
    ↓
Métricas aparecem no dashboard
```

### 2. Rastrear Vendas

```
Venda acontece (em qualquer plataforma)
    ↓
Sistema recebe via:
  - Webhook (automático)
  - Pixel do Meta (automático)
  - API (manual)
  - UTM (manual)
    ↓
Vincula venda ao anúncio correto
    ↓
Calcula ROI e CPA
```

## 📊 Funcionalidades

### Dashboard Principal
- 📈 Visualização de todas as campanhas
- 💰 Gastos totais por campanha
- 📊 ROI e CPA calculados automaticamente
- 🎯 Filtros avançados por status, data, etc

### Detalhes de Campanha
- Expansão de Campanha → Adsets → Anúncios
- Métricas em cascata (gastos agregados)
- Vendas associadas a cada nível
- Gráficos e comparações

### Sincronização Meta
- ✅ Sincroniza campanhas automaticamente
- ✅ Puxa métricas dos últimos 30 dias
- ✅ Atualiza status de anúncios
- ✅ Identifica novas campanhas

### Rastreamento de Vendas
- 🔗 Vincula vendas a anúncios específicos
- 📱 Suporta múltiplas fontes (webhook, pixel, UTM)
- 📊 Relatórios precisos de ROI por anúncio
- 🎯 Análise de CPA por campanha

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor em modo watch

# Build
npm run build        # Compila frontend e backend
npm run start        # Inicia produção

# Banco de Dados
npm run init         # Setup completo (PRIMEIRA VEZ)
npm run setup:db     # Apenas migração SQL
npm run db:push      # Sincroniza schema com Drizzle

# Outros
npm run check        # TypeScript type checking
npm run format       # Formata código com Prettier
npm run test         # Executa testes
```

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

```bash
# OBRIGATÓRIO
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# OPCIONAL (para Vercel)
VERCEL_OIDC_TOKEN="seu_token_aqui"
```

**Copiar template:**
```bash
cp .env.example .env
```

Depois edite com suas credenciais reais.

### Conectar Meta Ads

1. Acesse o painel (http://localhost:5173)
2. Vá para Configurações → Meta Ads
3. Conecte sua conta Meta
4. Selecione a conta de anúncios
5. Clique em "Sincronizar do Meta"

## 🔐 Segurança

- ✅ Autenticação com JWT
- ✅ Isolamento de dados por usuário
- ✅ Tokens Meta armazenados criptografados
- ✅ RLS (Row-Level Security) no PostgreSQL
- ✅ Validação de inputs com Zod

## 🐛 Troubleshooting

### Erro: "DATABASE_URL não configurada"
```bash
# Edite o arquivo .env
nano .env
# Adicione sua DATABASE_URL
```

### Erro: "Connection refused"
```bash
# Verifique se PostgreSQL está rodando
# Windows: verifique no Services
# Linux: sudo service postgresql status
# macOS: brew services list | grep postgres
```

### Erro: "Already exists" ao rodar setup
Isso é normal - significa as tabelas já foram criadas.
Nenhuma ação necessária!

### Campanhas não aparecem após sincronizar
- Verifique se Meta Access Token está válido
- Aguarde alguns segundos (processamento em background)
- Atualize a página (F5)

## 📚 Documentação Adicional

Veja `/scripts/README.md` para mais detalhes sobre os scripts de setup.

## 🎯 Próximos Passos

1. ✅ Setup do banco de dados (`npm run init`)
2. ✅ Iniciar desenvolvimento (`npm run dev`)
3. ✅ Conectar Meta Ads
4. ✅ Sincronizar campanhas
5. ✅ Começar a rastrear vendas

## 📝 Notas Importantes

- A migração do banco deve ser executada apenas uma vez
- Dados de vendas são imutáveis (para auditoria)
- Métricas são agregadas diariamente
- ROI é calculado automaticamente

## 🤝 Suporte

Para problemas ou dúvidas, abra uma issue no repositório.

---

**Versão:** 1.0.0  
**Última atualização:** 2026-04-22
