import { Request, Response } from "express";
import crypto from "crypto";
import { getRawPool, getCompanyById, logWebhookEvent } from "./db";

type UTMFields = {
  utmId?: string;
  utmSession?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

type SalePayload = UTMFields & {
  orderId: string;
  externalId?: string;
  orderValue: number;
  currency?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  saleDate?: Date;
};

type RawBodyRequest = Request & { rawBody?: string };

function asString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function parseDate(value: unknown): Date | undefined {
  const raw = asString(value);
  if (!raw) return undefined;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!payload || !signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("base64");
  return safeEqual(signature, expected);
}

function getUtmMetadata(record: any): Map<string, string> {
  const values = new Map<string, string>();
  const collections = [record?.meta_data, record?.metafields, record?.note_attributes, record?.attributes, record?.custom_fields];
  for (const collection of collections) {
    if (Array.isArray(collection)) {
      for (const item of collection) {
        const key = asString(item?.key ?? item?.name);
        const value = asString(item?.value);
        if (key && value) values.set(key.toLowerCase().replace(/^_+/, ""), value);
      }
    } else if (collection && typeof collection === "object") {
      for (const [key, rawValue] of Object.entries(collection)) {
        const value = asString(rawValue);
        if (value) values.set(key.toLowerCase().replace(/^_+/, ""), value);
      }
    }
  }
  return values;
}

export function extractUtmFields(record: any): UTMFields {
  const metadata = getUtmMetadata(record);
  const landingPage = asString(record?.landing_site ?? record?.landingSite ?? record?.landing_page);
  let urlParams: URLSearchParams | undefined;
  if (landingPage) {
    try { urlParams = new URL(landingPage).searchParams; } catch { /* Ignore non-absolute landing URLs. */ }
  }
  const read = (camel: string, snake: string): string | undefined =>
    asString(record?.[camel] ?? record?.[snake] ?? record?.[`_${snake}`]) ??
    metadata.get(snake) ??
    asString(urlParams?.get(snake));

  return {
    utmId: read("utmId", "utm_id"),
    utmSession: read("utmSession", "utm_session") ?? metadata.get("session_id"),
    utmSource: read("utmSource", "utm_source"),
    utmMedium: read("utmMedium", "utm_medium"),
    utmCampaign: read("utmCampaign", "utm_campaign"),
    utmContent: read("utmContent", "utm_content"),
    utmTerm: read("utmTerm", "utm_term"),
  };
}

async function activeWebhookConfig(companyId: number, platform: string, webhookId?: number) {
  const pool = await getRawPool();
  if (!pool) return null;
  const result = webhookId
    ? await pool.query(
        `SELECT * FROM "webhookConfigs" WHERE "id" = $1 AND "companyId" = $2 AND "platform" = $3 AND "status" = 'active' LIMIT 1`,
        [webhookId, companyId, platform]
      )
    : await pool.query(
        `SELECT * FROM "webhookConfigs" WHERE "companyId" = $1 AND "platform" = $2 AND "status" = 'active' ORDER BY "createdAt" DESC LIMIT 1`,
        [companyId, platform]
      );
  return result.rows[0] ?? null;
}

async function persistSale(companyId: number, platform: string, payload: SalePayload) {
  const company = await getCompanyById(companyId);
  if (!company) throw new Error("Empresa não encontrada");
  const pool = await getRawPool();
  if (!pool) throw new Error("Banco de dados indisponível");

  const externalId = payload.externalId || payload.orderId;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${companyId}:${platform}:${externalId}`]);
    const duplicate = await client.query(
      `SELECT id FROM "trackedSales" WHERE "companyId" = $1 AND "source" = $2 AND "externalId" = $3 LIMIT 1`,
      [companyId, platform, externalId]
    );
    if (duplicate.rows.length) {
      await client.query("COMMIT");
      return { saleId: duplicate.rows[0].id as number, duplicate: true, trackingFound: false };
    }

    let sessionRow: any = null;
    if (payload.utmSession) {
      const result = await client.query(
        `SELECT s.id AS "sessionRowId", t.*
         FROM "utmSessions" s JOIN "utmTracking" t ON t.id = s."trackingId"
         WHERE s."sessionId" = $1 AND t."companyId" = $2
         ORDER BY s."clickedAt" DESC LIMIT 1`,
        [payload.utmSession, companyId]
      );
      sessionRow = result.rows[0] ?? null;
    }

    let tracking = sessionRow;
    if (!tracking && payload.utmId) {
      const result = await client.query(
        `SELECT * FROM "utmTracking" WHERE "companyId" = $1 AND ("shortCode" = $2 OR "id"::text = $2) LIMIT 1`,
        [companyId, payload.utmId]
      );
      tracking = result.rows[0] ?? null;
    }
    if (!tracking && payload.utmCampaign) {
      const result = await client.query(
        `SELECT * FROM "utmTracking"
         WHERE "companyId" = $1 AND lower(trim("utmCampaign")) = lower(trim($2))
           AND ($3::text IS NULL OR lower(trim(COALESCE("utmSource", ''))) = lower(trim($3)))
           AND ($4::text IS NULL OR lower(trim(COALESCE("utmMedium", ''))) = lower(trim($4)))
         ORDER BY "createdAt" DESC LIMIT 2`,
        [companyId, payload.utmCampaign, payload.utmSource ?? null, payload.utmMedium ?? null]
      );
      tracking = result.rows.length === 1 ? result.rows[0] : null;
    }

    const trackingId = tracking?.id ?? null;
    const values = {
      utmSource: payload.utmSource ?? tracking?.utmSource ?? null,
      utmMedium: payload.utmMedium ?? tracking?.utmMedium ?? null,
      utmCampaign: payload.utmCampaign ?? tracking?.utmCampaign ?? null,
      utmContent: payload.utmContent ?? tracking?.utmContent ?? null,
      utmTerm: payload.utmTerm ?? tracking?.utmTerm ?? null,
    };
    const sale = await client.query(
      `INSERT INTO "trackedSales" (
        "companyId", "userId", "sessionId", "trackingId", "utmSource", "utmMedium",
        "utmCampaign", "utmContent", "utmTerm", "orderId", "orderValue", "currency",
        "saleDate", "customerName", "customerEmail", "customerPhone", "source", "externalId", "status"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'confirmed')
      RETURNING id`,
      [companyId, company.userId, sessionRow?.sessionRowId ?? null, trackingId,
        values.utmSource, values.utmMedium, values.utmCampaign, values.utmContent, values.utmTerm,
        payload.orderId, payload.orderValue, payload.currency || "BRL", payload.saleDate || new Date(),
        payload.customerName ?? null, payload.customerEmail ?? null, payload.customerPhone ?? null,
        platform, externalId]
    );
    const saleId = sale.rows[0].id as number;

    if (trackingId) {
      await client.query(`UPDATE "utmTracking" SET "conversionCount" = "conversionCount" + 1 WHERE id = $1`, [trackingId]);
    }
    if (sessionRow?.sessionRowId) {
      await client.query(
        `UPDATE "utmSessions" SET "convertedAt" = COALESCE("convertedAt", NOW()),
          "conversionValue" = $2, "conversionType" = 'purchase', "externalConversionId" = $3 WHERE id = $1`,
        [sessionRow.sessionRowId, payload.orderValue, externalId]
      );
    }
    await client.query("COMMIT");
    return { saleId, duplicate: false, trackingFound: !!trackingId };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

function getCompanyId(req: Request, allowBody = false): number {
  const raw = req.query.companyId ?? (allowBody ? req.body?.companyId : undefined);
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

async function logRejected(companyId: number, platform: string, message: string) {
  await logWebhookEvent({ companyId: companyId || null, platform, success: false, message });
}

async function saveAndRespond(res: Response, companyId: number, platform: string, payload: SalePayload) {
  if (!payload.orderId || !Number.isFinite(payload.orderValue) || payload.orderValue <= 0) {
    await logRejected(companyId, platform, "Pedido sem identificador ou valor válido");
    return res.status(400).json({ error: "orderId e orderValue positivo são obrigatórios" });
  }
  const result = await persistSale(companyId, platform, payload);
  const message = result.duplicate
    ? "Entrega duplicada ignorada"
    : result.trackingFound ? "Venda recebida e UTM atribuída" : "Venda recebida sem atribuição de UTM";
  await logWebhookEvent({
    companyId, platform, success: true, saleId: result.saleId,
    trackingFound: result.trackingFound, message,
    payloadSummary: `pedido=${payload.orderId} valor=${payload.orderValue}`,
  });
  return res.status(200).json({ success: true, ...result, message });
}

function normalizeGenericSale(body: any): SalePayload {
  const record = body?.data?.order ?? body?.order ?? body?.data ?? body ?? {};
  const utm = extractUtmFields(record);
  const orderId = asString(record.orderId ?? record.order_id ?? record.id) ?? "";
  const orderValue = Number(record.orderValue ?? record.order_value ?? record.total ?? record.amount);
  return {
    ...utm,
    orderId,
    externalId: asString(record.externalId ?? record.external_id ?? record.id) ?? orderId,
    orderValue,
    currency: asString(record.currency)?.toUpperCase(),
    customerName: asString(record.customerName ?? record.customer_name),
    customerEmail: asString(record.customerEmail ?? record.customer_email ?? record.email),
    customerPhone: asString(record.customerPhone ?? record.customer_phone ?? record.phone),
    saleDate: parseDate(record.saleDate ?? record.created_at ?? record.createdAt),
  };
}

export function normalizeFacilzapSale(body: any): SalePayload | null {
  const event = asString(body?.evento)?.toLowerCase();
  if (event && !event.startsWith("pedido_")) return null;

  const order = body?.dados;
  if (!order || typeof order !== "object" || Array.isArray(order)) return null;

  const paid = order.status_pago === true || order.status_pago === 1 ||
    ["true", "1", "sim"].includes(String(order.status_pago ?? "").toLowerCase());
  if (!paid) return null;

  const utm = order.utm && typeof order.utm === "object" ? order.utm : {};
  const customer = order.cliente && typeof order.cliente === "object" ? order.cliente : {};
  const orderId = asString(order.id ?? order.codigo) ?? "";

  return {
    orderId,
    externalId: orderId,
    orderValue: Number(order.total ?? order.valor_total),
    currency: "BRL",
    customerName: asString(customer.nome),
    customerEmail: asString(customer.email),
    customerPhone: asString(customer.whatsapp_e164 ?? customer.telefone_e164 ?? customer.whatsapp ?? customer.telefone),
    saleDate: parseDate(order.data),
    utmSource: asString(utm.source ?? order.utm_source),
    utmMedium: asString(utm.medium ?? order.utm_medium),
    utmCampaign: asString(utm.campaign ?? order.utm_campaign),
    utmContent: asString(utm.content ?? order.utm_content),
    utmTerm: asString(utm.term ?? order.utm_term),
  };
}

/** FácilZap does not document a signature header; authenticate with the per-webhook URL token. */
export async function handleFacilzapWebhook(req: Request, res: Response) {
  const companyId = getCompanyId(req);
  const platform = "facilzap";
  try {
    if (!companyId) return res.status(400).json({ error: "companyId inválido" });
    const webhookId = Number(req.query.webhookId) || undefined;
    const config = await activeWebhookConfig(companyId, platform, webhookId);
    if (!config) return res.status(404).json({ error: "Webhook FácilZap ativo não encontrado" });

    const providedToken = asString(req.query.token) ?? "";
    if (!safeEqual(providedToken, config.webhookSecret)) {
      await logRejected(companyId, platform, "Token do webhook inválido");
      return res.status(401).json({ error: "Token inválido" });
    }

    const event = asString(req.body?.evento) ?? "evento desconhecido";
    const sale = normalizeFacilzapSale(req.body);
    if (!sale) {
      await logWebhookEvent({
        companyId, platform, success: true,
        message: `Evento FácilZap ignorado (${event}): não é pedido pago`,
      });
      return res.status(200).json({ success: true, ignored: true, reason: "Evento não representa um pedido pago" });
    }

    return await saveAndRespond(res, companyId, platform, sale);
  } catch (error: any) {
    console.error("[Webhook FácilZap] falha ao processar pedido:", error?.message || error);
    await logRejected(companyId, platform, "Falha ao processar pedido FácilZap");
    return res.status(500).json({ error: "Falha ao processar pedido FácilZap" });
  }
}

/** Webhook genérico autenticado por Bearer token ou X-Webhook-Secret. */
export async function handleSaleWebhook(req: Request, res: Response) {
  const companyId = getCompanyId(req, true);
  const platform = "custom";
  try {
    if (!companyId) return res.status(400).json({ error: "companyId inválido" });
    const webhookId = Number(req.query.webhookId) || undefined;
    const config = await activeWebhookConfig(companyId, platform, webhookId);
    if (!config) return res.status(404).json({ error: "Webhook ativo não encontrado" });
    const bearer = /^Bearer\s+(.+)$/i.exec(req.get("authorization") || "")?.[1];
    const provided = req.get("x-webhook-secret") || bearer || "";
    if (!safeEqual(provided, config.webhookSecret)) {
      await logRejected(companyId, platform, "Credencial inválida");
      return res.status(401).json({ error: "Credencial inválida" });
    }
    return await saveAndRespond(res, companyId, platform, normalizeGenericSale(req.body));
  } catch (error: any) {
    console.error("[Webhook custom] falha ao processar venda:", error?.message || error);
    await logRejected(companyId, platform, "Falha ao processar pedido");
    return res.status(500).json({ error: "Falha ao processar venda" });
  }
}

function shopifyCustomerName(order: any): string | undefined {
  const customer = order?.customer ?? order?.billing_address ?? order?.shipping_address;
  return [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || asString(customer?.name);
}

/** Shopify signs raw JSON with the app's shared secret. */
export async function handleShopifyWebhook(req: RawBodyRequest, res: Response) {
  const companyId = getCompanyId(req);
  const platform = "shopify";
  try {
    if (!companyId) return res.status(400).json({ error: "companyId inválido" });
    const config = await activeWebhookConfig(companyId, platform, Number(req.query.webhookId) || undefined);
    if (!config) return res.status(404).json({ error: "Webhook ativo não encontrado" });
    const signature = req.get("x-shopify-hmac-sha256") || "";
    if (!validateWebhookSignature(req.rawBody || "", signature, config.webhookSecret)) {
      await logRejected(companyId, platform, "Assinatura Shopify inválida");
      return res.status(401).json({ error: "Assinatura inválida" });
    }
    const order = req.body?.order ?? req.body;
    const paymentStatus = asString(order?.financial_status)?.toLowerCase();
    if (paymentStatus !== "paid") {
      await logWebhookEvent({ companyId, platform, success: true, message: "Pedido ignorado: pagamento ainda não confirmado" });
      return res.status(200).json({ success: true, ignored: true, reason: "Pagamento não confirmado" });
    }
    const utm = extractUtmFields(order);
    const orderId = asString(order?.id ?? order?.name) ?? "";
    const value = Number(order?.current_total_price ?? order?.total_price ?? 0);
    return await saveAndRespond(res, companyId, platform, {
      ...utm, orderId, externalId: orderId, orderValue: value,
      currency: asString(order?.currency)?.toUpperCase(),
      customerName: shopifyCustomerName(order), customerEmail: asString(order?.email ?? order?.customer?.email),
      customerPhone: asString(order?.phone ?? order?.shipping_address?.phone),
      saleDate: parseDate(order?.processed_at ?? order?.created_at),
    });
  } catch (error: any) {
    console.error("[Webhook Shopify] falha ao processar pedido:", error?.message || error);
    await logRejected(companyId, platform, "Falha ao processar pedido Shopify");
    return res.status(500).json({ error: "Falha ao processar pedido Shopify" });
  }
}

/** WooCommerce signs the raw body with the webhook secret configured in Woo. */
export async function handleWooCommerceWebhook(req: RawBodyRequest, res: Response) {
  const companyId = getCompanyId(req);
  const platform = "woocommerce";
  try {
    if (!companyId) return res.status(400).json({ error: "companyId inválido" });
    const config = await activeWebhookConfig(companyId, platform, Number(req.query.webhookId) || undefined);
    if (!config) return res.status(404).json({ error: "Webhook ativo não encontrado" });
    const signature = req.get("x-wc-webhook-signature") || "";
    if (!validateWebhookSignature(req.rawBody || "", signature, config.webhookSecret)) {
      await logRejected(companyId, platform, "Assinatura WooCommerce inválida");
      return res.status(401).json({ error: "Assinatura inválida" });
    }
    const order = req.body?.order ?? req.body;
    const status = asString(order?.status)?.toLowerCase();
    if (!["processing", "completed"].includes(status || "")) {
      await logWebhookEvent({ companyId, platform, success: true, message: "Pedido ignorado: status não representa venda paga" });
      return res.status(200).json({ success: true, ignored: true, reason: "Pedido ainda não pago" });
    }
    const utm = extractUtmFields(order);
    const orderId = asString(order?.id) ?? "";
    const billing = order?.billing ?? {};
    return await saveAndRespond(res, companyId, platform, {
      ...utm, orderId, externalId: orderId, orderValue: Number(order?.total),
      currency: asString(order?.currency)?.toUpperCase(),
      customerName: [billing.first_name, billing.last_name].filter(Boolean).join(" ") || undefined,
      customerEmail: asString(billing.email), customerPhone: asString(billing.phone),
      saleDate: parseDate(order?.date_paid ?? order?.date_created),
    });
  } catch (error: any) {
    console.error("[Webhook WooCommerce] falha ao processar pedido:", error?.message || error);
    await logRejected(companyId, platform, "Falha ao processar pedido WooCommerce");
    return res.status(500).json({ error: "Falha ao processar pedido WooCommerce" });
  }
}
