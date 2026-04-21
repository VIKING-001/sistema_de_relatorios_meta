# 🎯 Sistema de Rastreamento UTM - Guia Rápido

> **Implementação integrada de rastreamento de vendas via UTM + Webhooks**

---

## ✅ O que foi feito

### ✓ Remoção de complexidade
- ❌ Removido: Página Rastreamento.tsx (isolada e complexa)
- ✅ Mantido: Gerador de URL (simples, direto)
- ✅ Mantido: Integrações (Meta Ads, Google Analytics, Webhooks)

### ✓ Documentação completa
- **WEBHOOK_SETUP.md** - Guia de configuração por plataforma
  - Shopify: metafields, webhooks
  - WooCommerce: Custom fields, PHP
  - Zapier: Automação genérica
  
- **WEBHOOK_EXAMPLES.md** - Exemplos prontos
  - cURL, JavaScript, Shopify Liquid, PHP, Python, Google Apps Script, Make.com

### ✓ Handlers de webhook
- `webhookHandler.ts` - Processamento de vendas
  - Validação HMAC (Shopify/WooCommerce)
  - Rastreamento automático de conversões
  - Mapeamento de UTMs para plataformas

- `webhookRoutes.ts` - Express routes
  - POST `/webhook/sale` - Endpoint genérico
  - POST `/webhook/shopify` - Shopify-specific
  - POST `/webhook/woocommerce` - WooCommerce-specific
  - POST `/webhook/test` - Para testes

---

## 🚀 Como usar

### 1️⃣ Criar Link UTM

```
Dashboard → Gerador de URL
↓
Escolher plataforma (Facebook, Google, TikTok, Manual)
↓
Preencher parâmetros (campaign, source, medium, etc)
↓
Copiar URL gerada
↓
Colocar no anúncio
```

**Exemplo:**
```
https://seusite.com/produto?utm_source=facebook&utm_medium=cpc&utm_campaign=black_friday
```

### 2️⃣ Configurar Webhook

Escolher sua plataforma:

**Shopify:**
- Admin → Apps → Webhooks
- Copiar URL: `https://sistemaderelatoriosmetaof.vercel.app/webhook/shopify?companyId=1`

**WooCommerce:**
- WooCommerce → Configurações → Webhooks
- Copiar URL: `https://sistemaderelatoriosmetaof.vercel.app/webhook/woocommerce?companyId=1`

**Outro:**
- Usar endpoint genérico: `https://sistemaderelatoriosmetaof.vercel.app/webhook/sale`
- Ver exemplos em WEBHOOK_EXAMPLES.md

### 3️⃣ Testar Webhook

```bash
curl -X POST https://sistemaderelatoriosmetaof.vercel.app/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": "ok"}'
```

### 4️⃣ Acompanhar Vendas

- **Dashboard** → Vê conversões por campanha
- **Relatórios** → Analisa ROAS (gasto Meta vs vendas rastreadas)
- **Gerador URL** → Vê clicks e conversões por link

---

## 📊 Fluxo Completo

```
┌─────────────────────────────────────────┐
│ 1. CRIAR LINK UTM                       │
│    Gerador de URL                       │
│    https://site.com?utm_source=facebook │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 2. ANÚNCIO                              │
│    Facebook/Google Ads                  │
│    Direcionar para link UTM             │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 3. USUÁRIO CLICA                        │
│    Vai para seu site                    │
│    UTM params são preservados           │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 4. COMPRA                               │
│    Usuário completa pedido              │
│    Lojas: Shopify, WooCommerce, etc     │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 5. WEBHOOK DISPARA                      │
│    Loja envia: orderId, value, UTMs     │
│    → https://sistemaderelatorios/       │
│       webhook/shopify?companyId=1       │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 6. RASTREAMENTO                         │
│    Sistema:                             │
│    - Procura link UTM correspondente    │
│    - Registra conversão                 │
│    - Incrementa contador                │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 7. DASHBOARD                            │
│    Mostra:                              │
│    - ROAS real (gasto Meta vs vendas)   │
│    - Conversões por campanha            │
│    - Receita por fonte                  │
└─────────────────────────────────────────┘
```

---

## 🔧 Campos do Webhook

**Obrigatórios:**
```json
{
  "companyId": 1,           // ID da empresa
  "orderId": "PEDIDO-123",  // ID único do pedido
  "orderValue": 299.90,     // Valor total
  "source": "shopify"       // shopify, woocommerce, custom, zapier
}
```

**Opcionais (UTM):**
```json
{
  "utmSource": "facebook",       // Fonte do tráfego
  "utmMedium": "cpc",            // Tipo de tráfego
  "utmCampaign": "black_friday", // Nome da campanha
  "utmContent": "anuncio_video", // ID do anúncio
  "utmTerm": "tenis_azul"        // Palavra-chave
}
```

**Opcionais (Cliente):**
```json
{
  "customerEmail": "cliente@email.com",
  "customerPhone": "+5511999999999",
  "externalId": "SHOPIFY-ORDER-123"
}
```

---

## 🧪 Teste Rápido

### 1. Criar link de teste
```
Gerador URL → Coloque:
  URL: https://seusite.com/teste
  Campaign: "teste_webhook"
  Source: "facebook"
  Medium: "cpc"
  
Copie a URL gerada
```

### 2. Enviar teste
```bash
curl -X POST https://sistemaderelatoriosmetaof.vercel.app/webhook/sale \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": 1,
    "orderId": "TESTE-001",
    "orderValue": 100.00,
    "source": "custom",
    "utmSource": "facebook",
    "utmMedium": "cpc",
    "utmCampaign": "teste_webhook"
  }'
```

### 3. Verificar resposta
```json
{
  "success": true,
  "saleId": 1,
  "trackingFound": true,
  "message": "Venda rastreada com sucesso"
}
```

---

## 📚 Documentação

- **WEBHOOK_SETUP.md** - Guia detalhado por plataforma (Shopify, WooCommerce, Zapier)
- **WEBHOOK_EXAMPLES.md** - Código pronto para copiar (cURL, JS, PHP, Python, etc)
- **Este arquivo** - Visão geral e quick start

---

## ❓ Dúvidas Comuns

**P: Meu webhook está sendo chamado, mas conversão não aparece**
- R: Verifique se `utmCampaign` corresponde exatamente ao link criado
- R: Verifique se `companyId` está correto
- R: Teste com `/webhook/test` para confirmar que está chegando

**P: Como capturar UTMs do meu site?**
- R: Veja exemplos em WEBHOOK_EXAMPLES.md (JavaScript localStorage, sessionStorage)
- R: Para Shopify: configure metafields no checkout
- R: Para WooCommerce: use filtros PHP para capturar GET params

**P: Qual é a diferença entre gasto Meta e vendas rastreadas?**
- R: Gasto Meta = o quanto você investiu em anúncios (importado automaticamente)
- R: Vendas rastreadas = pedidos que vieram através dos links UTM (via webhook)
- R: ROAS = vendas rastreadas ÷ gasto Meta

**P: Como integrar com uma plataforma que não está listada?**
- R: Use endpoint genérico `/webhook/sale`
- R: Envie `companyId, orderId, orderValue, source`
- R: Opcional: envie parâmetros UTM (source, medium, campaign, etc)
- R: Ver exemplo em WEBHOOK_EXAMPLES.md para Python/Flask

---

## 🎯 Próximas Etapas

1. ✅ Criar links UTM no Gerador de URL
2. ✅ Copiar links para seus anúncios
3. ✅ Configurar webhook em sua plataforma (Shopify/WooCommerce/Zapier)
4. ✅ Testar com `/webhook/test`
5. ✅ Aguardar primeira venda e verificar rastreamento
6. ✅ Analisar ROAS no Dashboard

---

**Status:** ✅ Sistema pronto para usar

**Últimas mudanças:**
- ✅ Remoção de página Rastreamento.tsx (simplificação)
- ✅ Adição de documentação completa de webhooks
- ✅ Handlers de webhook prontos para Shopify e WooCommerce
- ✅ Exemplos de código em múltiplas linguagens

**Deploy:** `sistemaderelatoriosmetaof.vercel.app`
