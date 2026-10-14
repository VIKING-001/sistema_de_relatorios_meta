import { Router, Request, Response } from "express";
import {
  handleSaleWebhook,
  handleShopifyWebhook,
  handleWooCommerceWebhook,
} from "./webhookHandler";

const router = Router();

/**
 * Generic normalized webhook, authenticated with Bearer or X-Webhook-Secret.
 */
router.post("/webhook/sale", handleSaleWebhook);
router.post("/webhook/custom", handleSaleWebhook);

/**
 * POST /webhook/shopify
 * Webhook específico para Shopify
 * Configure em: Shopify Admin → Configurações → Apps → Webhooks
 * URL: generated in the app; configure the Shopify orders/paid event.
 */
router.post("/webhook/shopify", (req: Request, res: Response) => {
  // Adicionar rawBody para validação de assinatura
  handleShopifyWebhook(req, res);
});

/**
 * POST /webhook/woocommerce
 * Webhook específico para WooCommerce
 * Configure em: WordPress Admin → WooCommerce → Configurações → Webhooks
 * URL: generated in the app; configure the WooCommerce order webhook.
 */
router.post("/webhook/woocommerce", (req: Request, res: Response) => {
  handleWooCommerceWebhook(req, res);
});

/**
 * POST /webhook/test
 * Endpoint de teste para validar webhooks
 */
router.post("/webhook/test", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "O servidor respondeu ao teste. Isso não confirma o recebimento de uma venda.",
  });
});

export default router;
