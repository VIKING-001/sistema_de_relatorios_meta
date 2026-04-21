import { Router, Request, Response } from "express";
import {
  handleSaleWebhook,
  handleShopifyWebhook,
  handleWooCommerceWebhook,
} from "./webhookHandler";

const router = Router();

/**
 * POST /webhook/sale
 * Webhook genérico para capturar vendas
 *
 * Body:
 * {
 *   companyId: number,
 *   orderId: string,
 *   orderValue: number,
 *   source: "shopify" | "woocommerce" | "custom" | "zapier",
 *   utmSource?: string,
 *   utmMedium?: string,
 *   utmCampaign?: string,
 *   utmContent?: string,
 *   utmTerm?: string,
 *   customerEmail?: string,
 *   customerPhone?: string,
 *   externalId?: string
 * }
 */
router.post("/webhook/sale", handleSaleWebhook);

/**
 * POST /webhook/shopify
 * Webhook específico para Shopify
 * Configure em: Shopify Admin → Configurações → Apps → Webhooks
 * URL: https://seudominio.com/webhook/shopify?companyId=1
 */
router.post("/webhook/shopify", (req: Request, res: Response) => {
  // Adicionar rawBody para validação de assinatura
  handleShopifyWebhook(req, res);
});

/**
 * POST /webhook/woocommerce
 * Webhook específico para WooCommerce
 * Configure em: WordPress Admin → WooCommerce → Configurações → Webhooks
 * URL: https://seudominio.com/webhook/woocommerce?companyId=1
 */
router.post("/webhook/woocommerce", (req: Request, res: Response) => {
  handleWooCommerceWebhook(req, res);
});

/**
 * POST /webhook/test
 * Endpoint de teste para validar webhooks
 */
router.post("/webhook/test", (req: Request, res: Response) => {
  console.log("[Webhook Test]", {
    headers: req.headers,
    body: req.body,
  });

  res.status(200).json({
    success: true,
    message: "Webhook test received",
    body: req.body,
  });
});

export default router;
