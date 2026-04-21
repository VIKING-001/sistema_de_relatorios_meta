# Configuração de Webhooks para Rastreamento de Vendas

Este documento descreve como configurar webhooks para capturar conversões/vendas nas diferentes plataformas e integrar com o sistema de rastreamento UTM.

## Visão Geral

O sistema de rastreamento UTM funciona em dois passos:

1. **Geração de Links UTM** - Use o Gerador de URL para criar links com parâmetros UTM
2. **Captura de Conversões** - Webhooks recebem dados de vendas das plataformas e rastreiam via UTM

## Endpoint de Webhook

**URL Base:** `https://sistemaderelatoriosmetaof.vercel.app/api/trpc/utm.recordSale`

**Método:** POST

**Payload Padrão:**
```json
{
  "companyId": 1,
  "orderId": "ORDER-12345",
  "orderValue": 299.90,
  "source": "shopify",
  "utmSource": "facebook",
  "utmMedium": "cpc",
  "utmCampaign": "black_friday_2024",
  "utmContent": "anuncio_heroi",
  "utmTerm": "calça_preta",
  "customerEmail": "cliente@example.com",
  "customerPhone": "+5511999999999",
  "externalId": "SHOPIFY-ORDER-123"
}
```

### Campos Obrigatórios
- `companyId` - ID da empresa no sistema
- `orderId` - ID único do pedido
- `orderValue` - Valor da compra (numérico)
- `source` - Plataforma (shopify, woocommerce, custom, zapier)

### Campos Opcionais (UTM)
- `utmSource` - Fonte (facebook, google, tiktok, etc)
- `utmMedium` - Meio (cpc, cpm, organic, etc)
- `utmCampaign` - Campanha (nome da campanha)
- `utmContent` - Conteúdo do anúncio
- `utmTerm` - Palavra-chave/termo

### Campos Opcionais (Cliente)
- `customerEmail` - Email do cliente
- `customerPhone` - Telefone do cliente
- `externalId` - ID externo (Shopify order ID, etc)

---

## Shopify

### Passo 1: Instalar App Customizado

1. Acesse Admin Shopify → Configurações → Apps e integrações
2. Crie uma app customizada com permissões para ler pedidos
3. Copie a API Key e Password

### Passo 2: Configurar Webhook no Shopify

1. Em Admin → Configurações → Apps e integrações → Webhooks
2. Clique "Criar webhook"
3. Configure:
   - **Tópico:** `orders/paid` (quando pedido é pago)
   - **URL:** `https://sistemaderelatoriosmetaof.vercel.app/api/trpc/utm.recordSale`
   - **Formato:** JSON

### Passo 3: Mapear UTMs (Shopify)

Se usar **Klaviyo** ou **Google Analytics** para rastrear UTMs no Shopify:

```javascript
// Custom Field no Shopify (order.metafields)
{
  "namespace": "utm",
  "key": "source",
  "value": "facebook"
}
```

Ou capture no checkout:

```html
<!-- Adicione ao checkout -->
<input type="hidden" name="utm_source" value="">
<input type="hidden" name="utm_medium" value="">
<input type="hidden" name="utm_campaign" value="">
```

### Payload Shopify → Sistema

```javascript
// Transformar webhook Shopify para nosso formato
{
  "companyId": 1,
  "orderId": order.id,
  "orderValue": order.total_price,
  "source": "shopify",
  "customerEmail": order.email,
  "customerPhone": order.shipping_address?.phone,
  "externalId": order.id,
  "utmSource": order.metafields?.utm?.source || null,
  "utmMedium": order.metafields?.utm?.medium || null,
  "utmCampaign": order.metafields?.utm?.campaign || null,
  "utmContent": order.metafields?.utm?.content || null,
  "utmTerm": order.metafields?.utm?.term || null
}
```

---

## WooCommerce

### Passo 1: Instalar Plugin

1. WordPress Dashboard → Plugins → Adicionar novo
2. Procure por "WooCommerce Webhooks" ou use plugin custom
3. Instale e ative

### Passo 2: Criar Webhook

1. WooCommerce → Configurações → Webhooks → Adicionar webhook
2. Configure:
   - **Nome:** Meta Reports UTM Tracking
   - **Evento:** Pedido criado / Pedido concluído
   - **URL de entrega:** `https://sistemaderelatoriosmetaof.vercel.app/api/trpc/utm.recordSale`
   - **Versão da API:** REST API v3

### Passo 3: Capturar UTMs (WooCommerce)

Use plugin como "UTM Grabber" ou adicione ao functions.php:

```php
add_filter('woocommerce_checkout_posted_data', function($posted_data) {
    if(isset($_GET['utm_source'])) {
        $posted_data['utm_source'] = sanitize_text_field($_GET['utm_source']);
    }
    // ... outros parâmetros UTM
    return $posted_data;
});

// Salvar na ordem
add_action('woocommerce_checkout_order_created', function($order) {
    $order->update_meta_data('_utm_source', $posted_data['utm_source'] ?? null);
    // ... outros UTMs
    $order->save();
});
```

### Payload WooCommerce → Sistema

```javascript
{
  "companyId": 1,
  "orderId": order.id,
  "orderValue": order.total,
  "source": "woocommerce",
  "customerEmail": order.billing.email,
  "customerPhone": order.billing.phone,
  "externalId": order.id,
  "utmSource": order.meta_data.find(m => m.key === "_utm_source")?.value || null,
  "utmMedium": order.meta_data.find(m => m.key === "_utm_medium")?.value || null,
  "utmCampaign": order.meta_data.find(m => m.key === "_utm_campaign")?.value || null,
  "utmContent": order.meta_data.find(m => m.key === "_utm_content")?.value || null,
  "utmTerm": order.meta_data.find(m => m.key === "_utm_term")?.value || null
}
```

---

## Integração com Zapier (Genérica)

Para integrar com outras plataformas (Amazon, Mercado Livre, etc):

### Passo 1: Criar Zap

1. Zapier.com → Create Zap
2. **Trigger:** Escolha a plataforma (Amazon, Mercado Livre, etc)
3. **Evento:** Nova venda / Pedido completado

### Passo 2: Mapear para Webhook

1. **Action:** Webhooks → POST
2. **URL:** `https://sistemaderelatoriosmetaof.vercel.app/api/trpc/utm.recordSale`
3. **Payload:**

```json
{
  "companyId": 1,
  "orderId": "{{order_id}}",
  "orderValue": {{order_total}},
  "source": "zapier",
  "customerEmail": "{{customer_email}}",
  "customerPhone": "{{customer_phone}}",
  "externalId": "{{order_id}}",
  "utmSource": "{{utm_source}}",
  "utmMedium": "{{utm_medium}}",
  "utmCampaign": "{{utm_campaign}}"
}
```

---

## Fluxo Completo: Anúncio → Link UTM → Venda → Rastreamento

```
1. Criar anúncio no Facebook/Google
   ↓
2. Usar Gerador de URL para criar link com UTMs
   Exemplo: https://seusite.com/produto?utm_source=facebook&utm_campaign=black_friday
   ↓
3. Usuário clica no link e vai para sua loja
   ↓
4. Usuário faz a compra
   ↓
5. Webhook da plataforma (Shopify/WooCommerce) envia dados de venda
   ↓
6. Sistema recebe webhook e:
   - Encontra o link UTM que originou a venda
   - Registra a venda com conversão
   - Incrementa contador de conversões do link
   ↓
7. Dashboard mostra ROAS real (gasto Meta vs vendas rastreadas)
```

---

## Teste de Webhook

Use Postman ou curl para testar:

```bash
curl -X POST https://sistemaderelatoriosmetaof.vercel.app/api/trpc/utm.recordSale \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": 1,
    "orderId": "TEST-001",
    "orderValue": 100.00,
    "source": "custom",
    "utmSource": "facebook",
    "utmCampaign": "test_campaign",
    "customerEmail": "teste@example.com"
  }'
```

---

## Troubleshooting

### Webhook não dispara
- Verifique se o URL está correto
- Confirme que a plataforma está enviando no evento certo
- Veja logs de webhook na plataforma

### Conversões não aparecem
- Verifique se `companyId` está correto
- Confirme se `utmCampaign` existe no sistema
- Verifique se os parâmetros UTM correspondem exatamente

### Conversão rastreada mas ROAS não atualiza
- Aguarde alguns minutos para atualizar cache
- Verifique se há gasto registrado em Meta Ads para o período
- Confirme se as datas estão corretas

---

## API de Teste

Para testar e validar webhooks, use:

**GET** `/api/trpc/utm.list?companyId=1`
- Lista todos os links de rastreamento

**GET** `/api/trpc/utm.getStats?companyId=1`
- Retorna estatísticas de conversões

**GET** `/api/trpc/utm.getRoasComparison?companyId=1`
- Compara gasto Meta vs revenue rastreada

---

**Última atualização:** 2024-04-21
**Suporte:** Entre em contato para configuração customizada
