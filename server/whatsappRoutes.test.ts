import express from "express";
import { createHmac } from "node:crypto";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getWhatsappConfigByPhoneNumberId: vi.fn(),
  logWebhookEvent: vi.fn(),
  recordWhatsappInboundMessage: vi.fn(),
  recordWhatsappOutboundMessage: vi.fn(),
  whatsappVerifyTokenMatches: vi.fn(),
}));

import * as db from "./db";
import whatsappRoutes from "./whatsappRoutes";

describe("WhatsApp webhook echo capture", () => {
  const appSecret = "test-meta-app-secret";
  const originalAppSecret = process.env.META_APP_SECRET;
  let server!: Server;

  beforeAll(async () => {
    process.env.META_APP_SECRET = appSecret;
    const app = express();
    app.use(express.json({
      verify: (req: any, _res, buffer) => { req.rawBody = buffer.toString("utf8"); },
    }));
    app.use(whatsappRoutes);
    server = await new Promise((resolve) => {
      const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
    });
    vi.mocked(db.getWhatsappConfigByPhoneNumberId).mockResolvedValue({ companyId: 7 } as any);
    vi.mocked(db.recordWhatsappOutboundMessage).mockResolvedValue({
      duplicate: false, conversation: { campaignName: null }, session: {}, message: {},
    } as any);
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    if (originalAppSecret === undefined) delete process.env.META_APP_SECRET;
    else process.env.META_APP_SECRET = originalAppSecret;
  });

  it("persists a signed Business App echo for the customer recipient", async () => {
    const payload = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [{
        changes: [{
          field: "smb_message_echoes",
          value: {
            metadata: { phone_number_id: "123456789" },
            message_echoes: [{
              from: "15550000000",
              to: "+1 (650) 555-1234",
              id: "wamid.echo-1",
              timestamp: "1791907200",
              type: "text",
              text: { body: "Olá, posso ajudar?" },
            }],
          },
        }],
      }],
    });
    const signature = createHmac("sha256", appSecret).update(payload).digest("hex");
    const port = (server.address() as AddressInfo).port;
    const response = await fetch(`http://127.0.0.1:${port}/webhook/whatsapp`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-hub-signature-256": `sha256=${signature}` },
      body: payload,
    });

    expect(response.status).toBe(200);
    expect(db.recordWhatsappOutboundMessage).toHaveBeenCalledWith(expect.objectContaining({
      companyId: 7,
      waId: "16505551234",
      wamid: "wamid.echo-1",
      type: "text",
      text: "Olá, posso ajudar?",
      timestamp: new Date("2026-10-13T16:00:00.000Z"),
    }));
  });

  it("rejects an invalid signature before looking up or writing a contact", async () => {
    vi.mocked(db.recordWhatsappOutboundMessage).mockClear();
    vi.mocked(db.getWhatsappConfigByPhoneNumberId).mockClear();
    const payload = JSON.stringify({ object: "whatsapp_business_account", entry: [] });
    const port = (server.address() as AddressInfo).port;
    const response = await fetch(`http://127.0.0.1:${port}/webhook/whatsapp`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-hub-signature-256": "sha256=invalid" },
      body: payload,
    });

    expect(response.status).toBe(401);
    expect(db.getWhatsappConfigByPhoneNumberId).not.toHaveBeenCalled();
    expect(db.recordWhatsappOutboundMessage).not.toHaveBeenCalled();
  });
});
