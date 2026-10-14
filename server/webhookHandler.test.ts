import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { extractUtmFields, normalizeFacilzapSale, validateWebhookSignature } from "./webhookHandler";

describe("webhook security and UTM normalization", () => {
  it("validates an HMAC signature for the exact raw payload", () => {
    const payload = '{"id":123,"total":"79.90"}';
    const secret = "shop-secret-for-test";
    const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64");

    expect(validateWebhookSignature(payload, signature, secret)).toBe(true);
    expect(validateWebhookSignature(`${payload} `, signature, secret)).toBe(false);
    expect(validateWebhookSignature(payload, "invalid", secret)).toBe(false);
  });

  it("extracts UTMs from standard fields and a landing URL", () => {
    expect(extractUtmFields({
      landing_site: "https://store.example/product?utm_source=instagram&utm_campaign=summer&utm_id=abc123&utm_session=session456",
    })).toEqual({
      utmId: "abc123",
      utmSession: "session456",
      utmSource: "instagram",
      utmMedium: undefined,
      utmCampaign: "summer",
      utmContent: undefined,
      utmTerm: undefined,
    });
  });

  it("normalizes custom metadata keys and ignores invalid values", () => {
    expect(extractUtmFields({
      meta_data: [
        { key: "_utm_source", value: "facebook" },
        { key: "utm_campaign", value: "campaign-1" },
        { key: "utm_session", value: "session-1" },
        { key: "utm_medium", value: null },
      ],
    })).toMatchObject({
      utmSource: "facebook",
      utmCampaign: "campaign-1",
      utmSession: "session-1",
    });
  });

  it("normalizes a paid FácilZap order and its customer and UTM fields", () => {
    expect(normalizeFacilzapSale({
      evento: "pedido_atualizado",
      dados: {
        id: 123456,
        data: "2026-10-14 10:30:00",
        total: 149.9,
        status_pago: true,
        cliente: { nome: "Maria Silva", email: "maria@example.com", whatsapp_e164: "+5511999999999" },
        utm: { source: "instagram", medium: "paid", campaign: "colecao-outubro" },
      },
    })).toMatchObject({
      orderId: "123456",
      externalId: "123456",
      orderValue: 149.9,
      currency: "BRL",
      customerName: "Maria Silva",
      customerEmail: "maria@example.com",
      customerPhone: "+5511999999999",
      utmSource: "instagram",
      utmMedium: "paid",
      utmCampaign: "colecao-outubro",
    });
  });

  it("does not count unpaid or non-order FácilZap events as sales", () => {
    expect(normalizeFacilzapSale({
      evento: "pedido_criado",
      dados: { id: 1, total: 100, status_pago: false },
    })).toBeNull();
    expect(normalizeFacilzapSale({
      evento: "carrinho_abandonado_criado",
      dados: { id: 1, total: 100, status_pago: true },
    })).toBeNull();
  });
});
