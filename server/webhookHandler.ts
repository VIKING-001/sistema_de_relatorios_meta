import { Request, Response } from "express";
import crypto from "crypto";
import { getRawPool } from "./db";
import { TRPCError } from "@trpc/server";

/**
 * Valida assinatura HMAC de Shopify/WooCommerce
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("base64");
  return hash === signature;
}

/**
 * Handler genérico para webhooks de venda
 */
export async function handleSaleWebhook(req: Request, res: Response) {
  try {
    const { companyId, orderId, orderValue, source, ...utmParams } = req.body;

    // Validações básicas
    if (!companyId || !orderId || !orderValue || !source) {
      return res.status(400).json({
        error: "Campos obrigatórios faltando: companyId, orderId, orderValue, source",
      });
    }

    // Chamar tRPC utm.recordSale
    const pool = await getRawPool();
    if (!pool) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    // Procurar tracking ID baseado nos parâmetros UTM
    let trackingId = null;
    if (utmParams.utmCampaign) {
      const trackResult = await pool.query(
        `SELECT id FROM "utmTracking"
         WHERE "companyId" = $1
           AND "utmCampaign" = $2
           AND "utmSource" IS NOT DISTINCT FROM $3
           AND "utmMedium" IS NOT DISTINCT FROM $4
         ORDER BY "createdAt" DESC LIMIT 1`,
        [
          companyId,
          utmParams.utmCampaign,
          utmParams.utmSource || null,
          utmParams.utmMedium || null,
        ]
      );

      if (trackResult.rows.length > 0) {
        trackingId = trackResult.rows[0].id;

        // Incrementar contador de conversões
        await pool.query(
          `UPDATE "utmTracking" SET "conversionCount" = "conversionCount" + 1 WHERE "id" = $1`,
          [trackingId]
        );
      }
    }

    // Registrar a venda
    const saleResult = await pool.query(
      `INSERT INTO "trackedSales" (
        "companyId", "userId", "trackingId", "orderId", "orderValue",
        "utmSource", "utmMedium", "utmCampaign", "utmContent", "utmTerm",
        "customerEmail", "customerPhone", "source", "externalId", "saleDate"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      RETURNING *`,
      [
        companyId,
        null, // userId
        trackingId,
        orderId,
        orderValue,
        utmParams.utmSource || null,
        utmParams.utmMedium || null,
        utmParams.utmCampaign || null,
        utmParams.utmContent || null,
        utmParams.utmTerm || null,
        utmParams.customerEmail || null,
        utmParams.customerPhone || null,
        source,
        utmParams.externalId || null,
      ]
    );

    return res.status(200).json({
      success: true,
      saleId: saleResult.rows[0].id,
      trackingFound: !!trackingId,
      message: trackingId
        ? "Venda rastreada com sucesso"
        : "Venda registrada mas UTM não encontrada",
    });
  } catch (err: any) {
    console.error("[Webhook] Error:", err);
    return res.status(500).json({
      error: err.message || "Erro ao processar webhook",
    });
  }
}

/**
 * Handler específico para Shopify
 */
export async function handleShopifyWebhook(req: Request, res: Response) {
  try {
    // Validar assinatura Shopify
    const signature = req.headers["x-shopify-hmac-sha256"] as string;
    const body = req.rawBody || JSON.stringify(req.body);

    // Nota: Você precisa configurar a variável de ambiente SHOPIFY_WEBHOOK_SECRET
    // const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    // if (!validateWebhookSignature(body, signature, secret)) {
    //   return res.status(401).json({ error: "Invalid signature" });
    // }

    const order = req.body;

    // Mapear dados Shopify para nosso formato
    const payload = {
      companyId: req.query.companyId || 1,
      orderId: order.id.toString(),
      orderValue: parseFloat(order.total_price),
      source: "shopify",
      customerEmail: order.email,
      customerPhone: order.shipping_address?.phone,
      externalId: order.id.toString(),
      // UTMs viriam de custom fields ou checkout
      utmSource: order.metafields?.find((m: any) => m.key === "utm_source")?.value,
      utmMedium: order.metafields?.find((m: any) => m.key === "utm_medium")?.value,
      utmCampaign: order.metafields?.find((m: any) => m.key === "utm_campaign")?.value,
      utmContent: order.metafields?.find((m: any) => m.key === "utm_content")?.value,
      utmTerm: order.metafields?.find((m: any) => m.key === "utm_term")?.value,
    };

    // Usar handler genérico
    return handleSaleWebhook({ body: payload } as Request, res);
  } catch (err: any) {
    console.error("[Shopify Webhook] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Handler específico para WooCommerce
 */
export async function handleWooCommerceWebhook(req: Request, res: Response) {
  try {
    const order = req.body;

    const payload = {
      companyId: req.query.companyId || 1,
      orderId: order.id.toString(),
      orderValue: parseFloat(order.total),
      source: "woocommerce",
      customerEmail: order.billing.email,
      customerPhone: order.billing.phone,
      externalId: order.id.toString(),
      utmSource: order.meta_data?.find((m: any) => m.key === "_utm_source")?.value,
      utmMedium: order.meta_data?.find((m: any) => m.key === "_utm_medium")?.value,
      utmCampaign: order.meta_data?.find((m: any) => m.key === "_utm_campaign")?.value,
      utmContent: order.meta_data?.find((m: any) => m.key === "_utm_content")?.value,
      utmTerm: order.meta_data?.find((m: any) => m.key === "_utm_term")?.value,
    };

    return handleSaleWebhook({ body: payload } as Request, res);
  } catch (err: any) {
    console.error("[WooCommerce Webhook] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
