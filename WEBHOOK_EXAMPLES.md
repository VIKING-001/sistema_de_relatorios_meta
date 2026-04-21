# Exemplos de Integração com Webhooks

## 1. Teste Rápido com cURL

```bash
# Testar endpoint de webhook
curl -X POST https://sistemaderelatoriosmetaof.vercel.app/webhook/sale \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": 1,
    "orderId": "PEDIDO-001",
    "orderValue": 299.90,
    "source": "custom",
    "utmSource": "facebook",
    "utmMedium": "cpc",
    "utmCampaign": "black_friday",
    "utmContent": "anuncio_video",
    "utmTerm": "tenis_azul",
    "customerEmail": "cliente@email.com",
    "customerPhone": "+5511987654321",
    "externalId": "SHOP-123456"
  }'
```

---

## 2. JavaScript/Node.js (Genérico)

```javascript
// Função para enviar venda ao webhook
async function trackSale(saleData) {
  const response = await fetch(
    'https://sistemaderelatoriosmetaof.vercel.app/webhook/sale',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: 1,
        orderId: saleData.orderId,
        orderValue: saleData.total,
        source: 'custom',
        utmSource: localStorage.getItem('utm_source'),
        utmMedium: localStorage.getItem('utm_medium'),
        utmCampaign: localStorage.getItem('utm_campaign'),
        utmContent: localStorage.getItem('utm_content'),
        utmTerm: localStorage.getItem('utm_term'),
        customerEmail: saleData.email,
        customerPhone: saleData.phone,
        externalId: saleData.orderId
      })
    }
  );
  
  return response.json();
}

// Usar após confirmação de pedido
trackSale({
  orderId: 'ORD-12345',
  total: 199.90,
  email: 'cliente@example.com',
  phone: '+5511999999999'
});
```

---

## 3. Shopify (Liquid Template)

### No Arquivo `thank-you.liquid`

```liquid
<!-- Capturar UTMs do URL -->
<script>
  // Extrair UTMs da URL
  const params = new URLSearchParams(window.location.search);
  const utm = {
    source: params.get('utm_source') || sessionStorage.getItem('utm_source'),
    medium: params.get('utm_medium') || sessionStorage.getItem('utm_medium'),
    campaign: params.get('utm_campaign') || sessionStorage.getItem('utm_campaign'),
    content: params.get('utm_content') || sessionStorage.getItem('utm_content'),
    term: params.get('utm_term') || sessionStorage.getItem('utm_term')
  };

  // Enviar dados de venda
  fetch('https://sistemaderelatoriosmetaof.vercel.app/webhook/shopify?companyId=1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: '{{ order.id }}',
      orderValue: {{ order.total_price }},
      source: 'shopify',
      customerEmail: '{{ order.email }}',
      customerPhone: '{{ order.shipping_address.phone }}',
      externalId: '{{ order.id }}',
      utmSource: utm.source,
      utmMedium: utm.medium,
      utmCampaign: utm.campaign,
      utmContent: utm.content,
      utmTerm: utm.term
    })
  });

  // Também guardar UTMs no localStorage quando cliente chegar
  sessionStorage.setItem('utm_source', utm.source || '');
  sessionStorage.setItem('utm_medium', utm.medium || '');
  sessionStorage.setItem('utm_campaign', utm.campaign || '');
</script>
```

### Capturar UTMs no Checkout (Shopify Plus)

```liquid
<!-- Em additional-checkout-buttons.liquid ou post-purchase -->
<script>
  // Guardar UTMs durante checkout
  function captureUTM() {
    const params = new URLSearchParams(window.location.search);
    const utmData = {
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_content: params.get('utm_content') || '',
      utm_term: params.get('utm_term') || ''
    };
    
    // Salvar no sessionStorage
    Object.entries(utmData).forEach(([key, value]) => {
      sessionStorage.setItem(key, value);
    });
  }
  
  captureUTM();
</script>
```

---

## 4. WooCommerce (PHP)

### No arquivo `functions.php` do tema

```php
<?php

// 1. Capturar UTMs no checkout
add_filter('woocommerce_process_checkout_field_billing_email', function($value) {
    if(isset($_GET['utm_source'])) {
        WC()->session->set('utm_source', sanitize_text_field($_GET['utm_source']));
    }
    return $value;
});

// 2. Salvar UTMs na ordem
add_action('woocommerce_checkout_order_created', function($order) {
    if(WC()->session) {
        $utm_source = WC()->session->get('utm_source');
        $utm_medium = WC()->session->get('utm_medium');
        $utm_campaign = WC()->session->get('utm_campaign');
        
        if($utm_campaign) {
            $order->update_meta_data('_utm_source', $utm_source);
            $order->update_meta_data('_utm_medium', $utm_medium);
            $order->update_meta_data('_utm_campaign', $utm_campaign);
            $order->update_meta_data('_utm_content', WC()->session->get('utm_content'));
            $order->update_meta_data('_utm_term', WC()->session->get('utm_term'));
            $order->save();
        }
    }
});

// 3. Webhook quando pedido é completado
add_action('woocommerce_order_status_completed', function($order_id) {
    $order = wc_get_order($order_id);
    
    $payload = [
        'companyId' => 1, // Seu ID de empresa
        'orderId' => (string)$order_id,
        'orderValue' => $order->get_total(),
        'source' => 'woocommerce',
        'customerEmail' => $order->get_billing_email(),
        'customerPhone' => $order->get_billing_phone(),
        'externalId' => (string)$order_id,
        'utmSource' => $order->get_meta('_utm_source'),
        'utmMedium' => $order->get_meta('_utm_medium'),
        'utmCampaign' => $order->get_meta('_utm_campaign'),
        'utmContent' => $order->get_meta('_utm_content'),
        'utmTerm' => $order->get_meta('_utm_term')
    ];
    
    // Enviar webhook
    wp_remote_post('https://sistemaderelatoriosmetaof.vercel.app/webhook/woocommerce?companyId=1', [
        'method' => 'POST',
        'body' => json_encode($payload),
        'headers' => ['Content-Type' => 'application/json']
    ]);
});

?>
```

---

## 5. Python/Flask

```python
from flask import Flask, request, jsonify
import requests
import json

app = Flask(__name__)

WEBHOOK_URL = 'https://sistemaderelatoriosmetaof.vercel.app/webhook/sale'
COMPANY_ID = 1

@app.route('/order/confirm', methods=['POST'])
def confirm_order():
    order_data = request.get_json()
    
    # Preparar payload
    payload = {
        'companyId': COMPANY_ID,
        'orderId': order_data['order_id'],
        'orderValue': float(order_data['total']),
        'source': 'custom',
        'customerEmail': order_data.get('email'),
        'customerPhone': order_data.get('phone'),
        'externalId': order_data['order_id'],
        'utmSource': request.cookies.get('utm_source'),
        'utmMedium': request.cookies.get('utm_medium'),
        'utmCampaign': request.cookies.get('utm_campaign'),
        'utmContent': request.cookies.get('utm_content'),
        'utmTerm': request.cookies.get('utm_term')
    }
    
    # Enviar ao webhook
    response = requests.post(
        WEBHOOK_URL,
        json=payload,
        headers={'Content-Type': 'application/json'}
    )
    
    return jsonify(response.json())

if __name__ == '__main__':
    app.run(debug=True)
```

---

## 6. Zapier (Configuração)

### Passo a Passo no Zapier

1. **Criar Zap**
   - Trigger: Sua plataforma de vendas (Amazon, Mercado Livre, etc)
   - Evento: Nova venda / Pedido completado

2. **Configurar Action: Webhooks by Zapier**
   - Método: POST
   - URL: `https://sistemaderelatoriosmetaof.vercel.app/webhook/sale`
   - Payload:

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

## 7. Google Apps Script (Planilha Google)

```javascript
// Adicionar ao onEdit ou schedule
function enviarVendaParaWebhook(orderId, email, telefone, valor, utmCampaign) {
  const url = 'https://sistemaderelatoriosmetaof.vercel.app/webhook/sale';
  
  const payload = {
    companyId: 1,
    orderId: orderId,
    orderValue: valor,
    source: 'custom',
    customerEmail: email,
    customerPhone: telefone,
    externalId: orderId,
    utmCampaign: utmCampaign,
    utmSource: 'spreadsheet',
    utmMedium: 'manual'
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };
  
  const response = UrlFetchApp.fetch(url, options);
  Logger.log(response.getContentText());
}

// Usar a função
enviarVendaParaWebhook(
  'PEDIDO-12345',
  'cliente@email.com',
  '+5511999999999',
  299.90,
  'black_friday_2024'
);
```

---

## 8. Automação com Make.com (antigo Integromat)

### Configuração:

1. **Trigger:** Sua fonte de vendas
2. **Action 1:** Parse JSON (se necessário)
3. **Action 2:** HTTP POST

```
URL: https://sistemaderelatoriosmetaof.vercel.app/webhook/sale
Method: POST
Body type: Raw

Body:
{
  "companyId": 1,
  "orderId": "{{map(orders.id)}}",
  "orderValue": "{{map(orders.value)}}",
  "source": "make",
  "customerEmail": "{{map(orders.email)}}",
  "customerPhone": "{{map(orders.phone)}}",
  "utmCampaign": "{{map(orders.campaign)}}"
}
```

---

## Response Esperado

```json
{
  "success": true,
  "saleId": 123,
  "trackingFound": true,
  "message": "Venda rastreada com sucesso"
}
```

Ou se UTM não encontrado:

```json
{
  "success": true,
  "saleId": 124,
  "trackingFound": false,
  "message": "Venda registrada mas UTM não encontrada"
}
```

---

## Próximas Etapas

1. ✅ Criar link UTM no Gerador de URL
2. ✅ Integrar webhook em sua plataforma
3. ✅ Testar com webhook/test
4. ✅ Verificar conversões em Dashboard
5. ✅ Analisar ROAS no relatório

**Dúvidas?** Veja `WEBHOOK_SETUP.md` para guias detalhados por plataforma.
