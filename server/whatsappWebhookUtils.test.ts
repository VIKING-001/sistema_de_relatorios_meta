import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  verifyMetaWebhookSignature,
  whatsappEchoRecipient,
  whatsappMessageText,
  whatsappMessageTimestamp,
} from "./whatsappWebhookUtils";

describe("WhatsApp webhook utilities", () => {
  it("verifies Meta HMAC signatures against the raw request body", () => {
    const body = '{"object":"whatsapp_business_account"}';
    const secret = "test-app-secret";
    const digest = createHmac("sha256", secret).update(body).digest("hex");

    expect(verifyMetaWebhookSignature(body, `sha256=${digest}`, secret)).toBe(true);
    expect(verifyMetaWebhookSignature(`${body} `, `sha256=${digest}`, secret)).toBe(false);
    expect(verifyMetaWebhookSignature(body, "invalid", secret)).toBe(false);
    expect(verifyMetaWebhookSignature(body, `sha256=${digest}`, undefined)).toBe(false);
  });

  it("normalizes the recipient from a Business App message echo", () => {
    expect(whatsappEchoRecipient({ to: "+1 (650) 555-1234" })).toBe("16505551234");
    expect(whatsappEchoRecipient({ recipient_id: "5511999999999" })).toBe("5511999999999");
    expect(whatsappEchoRecipient({})).toBe("");
  });

  it("extracts readable text from common message payload types", () => {
    expect(whatsappMessageText({ text: { body: "Oi" } })).toBe("Oi");
    expect(whatsappMessageText({ image: { caption: "Foto do produto" } })).toBe("Foto do produto");
    expect(whatsappMessageText({ type: "audio" })).toBe("[audio]");
  });

  it("parses Meta Unix timestamps without losing seconds or milliseconds", () => {
    expect(whatsappMessageTimestamp("1791907200")?.toISOString()).toBe("2026-10-13T16:00:00.000Z");
    expect(whatsappMessageTimestamp(1791907200000)?.toISOString()).toBe("2026-10-13T16:00:00.000Z");
    expect(whatsappMessageTimestamp("not-a-date")).toBeNull();
  });
});
