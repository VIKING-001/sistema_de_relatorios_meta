# Scripts de Inicialização

Aqui estão os scripts disponíveis para gerenciar o banco de dados e inicializar o projeto.

## 🚀 Inicialização Rápida (Recomendado)

```bash
npm run init
```

Este comando faz tudo automaticamente:
- Verifica o arquivo `.env`
- Conecta ao banco de dados
- Executa a migração SQL
- Cria todas as 5 tabelas necessárias

## 🔧 Scripts Individuais

### 1. Setup do Banco de Dados

```bash
npm run setup:db
```

Executa apenas a migração SQL do arquivo `drizzle/migrations/add_ad_sales_tracking.sql`.

Use quando você precisa re-criar as tabelas sem fazer o setup completo.

## 📋 Tabelas Criadas

Os scripts criam automaticamente 5 tabelas:

| Tabela | Descrição |
|--------|-----------|
| `metaCampaigns` | Campanhas do Meta Ads |
| `metaAdsets` | Conjuntos de Anúncios (Ad Sets) |
| `metaAds` | Anúncios individuais |
| `adMetrics` | Métricas diárias (gastos, cliques, impressões) |
| `adSales` | Rastreamento de vendas por anúncio |

## 🔐 Variáveis de Ambiente

O arquivo `.env` deve conter:

```
DATABASE_URL="postgresql://user:password@host:5432/database"
```

Copie o arquivo `.env.example` como referência:

```bash
cp .env.example .env
```

Depois edite o arquivo `.env` com suas credenciais reais.

## ⚠️ Requisitos

- Node.js 16+
- PostgreSQL 12+
- Variável `DATABASE_URL` configurada

## 🐛 Solução de Problemas

### "DATABASE_URL não configurada"

Edite o arquivo `.env` e adicione:
```
DATABASE_URL="sua_url_postgresql_aqui"
```

### "Connection refused"

Verifique se:
- O servidor PostgreSQL está rodando
- A URL está correta
- As credenciais (usuário/senha) estão corretas

### "Already exists" ao executar migração

Isso é normal! Significa que as tabelas já foram criadas anteriormente.
Nenhuma ação necessária.

## 📝 Próximos Passos

Após executar `npm run init`, você pode:

1. Iniciar o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Abrir no navegador:
   ```
   http://localhost:5173
   ```

3. Fazer login e conectar ao Meta Ads

4. Clicar em "Sincronizar do Meta" para trazer campanhas
