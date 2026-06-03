# 🚀 Instruções de Setup Completo

## O Que Foi Criado?

Criei automaticamente 3 arquivos de script para você:

### 1. `/scripts/setup-db.js`
Script que executa a migração SQL do banco de dados.

### 2. `/scripts/init-project.js`
Script completo que faz todo o setup inicial (recomendado para primeira vez).

### 3. `/scripts/README.md`
Documentação detalhada dos scripts disponíveis.

### 4. `.env.example`
Template com as variáveis de ambiente necessárias.

### 5. `README.md`
Documentação completa do projeto.

---

## ✅ Instruções Passo-a-Passo

### Passo 1️⃣: Execute o Setup Inicial

```bash
npm run init
```

**O que este comando faz:**
- ✅ Verifica se `.env` existe
- ✅ Conecta ao banco de dados PostgreSQL (usando DATABASE_URL)
- ✅ Executa o arquivo SQL de migração
- ✅ Cria as 5 tabelas automaticamente:
  - `metaCampaigns`
  - `metaAdsets`
  - `metaAds`
  - `adMetrics`
  - `adSales`

**Resultado esperado:**
```
╔════════════════════════════════════════╗
║    ✅ Setup Completo com Sucesso!    ║
╚════════════════════════════════════════╝

📚 Próximos passos:
  1. npm run dev          - Inicie o servidor
  2. Abra http://localhost:5173
  3. Configure suas credenciais do Meta Ads
  4. Use o botão "Sincronizar do Meta"

📊 Tabelas criadas:
  • metaCampaigns     - Campanhas do Meta Ads
  • metaAdsets        - Conjuntos de Anúncios
  • metaAds           - Anúncios
  • adMetrics         - Métricas de Anúncios
  • adSales           - Rastreamento de Vendas
```

### Passo 2️⃣: Inicie o Servidor de Desenvolvimento

```bash
npm run dev
```

**O que acontece:**
- 🔧 Compila o TypeScript
- 🚀 Inicia servidor em http://localhost:5173
- 👀 Ativa hot reload (recarrega ao salvar arquivo)

### Passo 3️⃣: Abra no Navegador

```
http://localhost:5173
```

### Passo 4️⃣: Configure Meta Ads

1. Faça login (ou crie conta)
2. Vá para **Configurações** → **Meta Ads**
3. Clique em **Conectar Meta**
4. Autorize sua conta Meta
5. Selecione a conta de anúncios
6. Salve

### Passo 5️⃣: Sincronize Campanhas

1. Vá para **Campanhas**
2. Clique em **"Sincronizar do Meta"**
3. Aguarde alguns segundos
4. As campanhas aparecerão na lista

### Passo 6️⃣: Comece a Rastrear Vendas

Quando uma venda acontece:
1. Sistema recebe a venda (webhook, pixel ou manual)
2. Venda é vinculada ao anúncio correto
3. ROI e CPA são calculados automaticamente
4. Tudo aparece no dashboard

---

## 🔄 Fluxo de Execução

```
┌─────────────────────┐
│  npm run init       │
└──────────┬──────────┘
           │
           ├─→ Verifica .env
           │
           ├─→ Conecta ao PostgreSQL
           │
           ├─→ Executa migração SQL
           │
           └─→ Cria 5 tabelas no banco
                │
                ├─ metaCampaigns
                ├─ metaAdsets
                ├─ metaAds
                ├─ adMetrics
                └─ adSales

┌─────────────────────┐
│  npm run dev        │ (Depois)
└──────────┬──────────┘
           │
           ├─→ Inicia servidor
           │
           └─→ Abre http://localhost:5173
```

---

## 🛠️ Resumo de Arquivos Criados

| Arquivo | Propósito |
|---------|-----------|
| `scripts/setup-db.js` | Execute a migração SQL |
| `scripts/init-project.js` | Setup completo (USAR PRIMEIRO) |
| `scripts/README.md` | Documentação dos scripts |
| `.env.example` | Template de variáveis de ambiente |
| `README.md` | Documentação do projeto |
| `SETUP_INSTRUCTIONS.md` | Este arquivo (instruções) |

---

## ⚠️ Checklist de Verificação

- [ ] Executei `npm run init` com sucesso
- [ ] Tabelas aparecem no banco PostgreSQL
- [ ] `npm run dev` roda sem erros
- [ ] Navegador abre em http://localhost:5173
- [ ] Consigo fazer login
- [ ] Consigo acessar Configurações → Meta Ads
- [ ] Consigo clicar em "Sincronizar do Meta"

Se tudo estiver ✅, você está pronto para usar o sistema!

---

## 💡 Dicas

**Se der erro "DATABASE_URL não configurada":**
1. Edite o arquivo `.env`
2. Adicione sua DATABASE_URL completa
3. Rode `npm run init` novamente

**Se der erro "Connection refused":**
1. Verifique se PostgreSQL está rodando
2. Teste a conexão: `psql <DATABASE_URL>`
3. Se falhar, reinicie PostgreSQL

**Se der "Already exists":**
- Isso é normal! Significa as tabelas já foram criadas
- Você pode deletar as tabelas e rodar novamente se quiser

---

## 📞 Próximas Ações

1. ✅ Execute `npm run init`
2. ✅ Aguarde conclusão
3. ✅ Execute `npm run dev`
4. ✅ Configure Meta Ads
5. ✅ Sincronize campanhas
6. ✅ Comece a usar!

---

**Tudo pronto! 🎉**

O sistema está automatizado para criar todas as tabelas e configurações necessárias. 
Você não precisa fazer nada manualmente - apenas execute os comandos acima!
