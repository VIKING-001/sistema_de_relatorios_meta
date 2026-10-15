import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getCompanyById: vi.fn(),
  getWhatsappConfigByCompany: vi.fn(),
  getWhatsappReplyContext: vi.fn(),
  recordWhatsappOutboundMessage: vi.fn(),
  logWebhookEvent: vi.fn(),
}));

import * as db from "./db";
import { whatsappRouter } from "./whatsapp.router";

const user = {
  id: 7,
  openId: "whatsapp-send-test",
  email: "test@example.com",
  name: "Test User",
  loginMethod: "test",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createCaller() {
  return whatsappRouter.createCaller({
    user: user as any,
    req: {} as any,
    res: {} as any,
  });
}

const input = {
  companyId: 10,
  waId: "5562999999999",
  sessionId: 44,
  text: "Olá, posso ajudar?",
};

describe("whatsapp.sendMessage", () => {
  beforeEach(() => {
    vi.mocked(db.getCompanyById).mockResolvedValue({
      id: 10,
      userId: user.id,
    } as any);
    vi.mocked(db.getWhatsappConfigByCompany).mockResolvedValue({
      companyId: 10,
      phoneNumberId: "123456789",
      accessToken: "test-access-token",
      status: "active",
    } as any);
    vi.mocked(db.getWhatsappReplyContext).mockResolvedValue({
      conversationId: 2,
      lastInboundAt: new Date(Date.now() - 60 * 60 * 1000),
      lastInboundSessionId: 44,
    } as any);
    vi.mocked(db.recordWhatsappOutboundMessage).mockResolvedValue({
      duplicate: false,
      conversation: { id: 2 },
      session: { id: 44 },
      message: { id: 9 },
    } as any);
    vi.mocked(db.logWebhookEvent).mockResolvedValue(undefined as any);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("sends and persists a text message in the active customer-service window", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          messages: [{ id: "wamid.sent-1", message_status: "accepted" }],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createCaller().sendMessage(input);

    expect(result).toEqual({ success: true, persisted: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://graph.facebook.com/v21.0/123456789/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-access-token",
        }),
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: input.waId,
          type: "text",
          text: { preview_url: false, body: input.text },
        }),
      })
    );
    expect(db.recordWhatsappOutboundMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 10,
        waId: input.waId,
        wamid: "wamid.sent-1",
        text: input.text,
      })
    );
  });

  it("blocks a reply after the 24-hour window without calling Meta", async () => {
    vi.mocked(db.getWhatsappReplyContext).mockResolvedValue({
      conversationId: 2,
      lastInboundAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      lastInboundSessionId: 44,
    } as any);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(createCaller().sendMessage(input)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message: expect.stringContaining("24 horas"),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks sending when the selected session is not the latest inbound session", async () => {
    vi.mocked(db.getWhatsappReplyContext).mockResolvedValue({
      conversationId: 2,
      lastInboundAt: new Date(Date.now() - 60 * 60 * 1000),
      lastInboundSessionId: 45,
    } as any);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(createCaller().sendMessage(input)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not attempt delivery when the connection has no sending token", async () => {
    vi.mocked(db.getWhatsappConfigByCompany).mockResolvedValue({
      companyId: 10,
      phoneNumberId: "123456789",
      accessToken: null,
      status: "active",
    } as any);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(createCaller().sendMessage(input)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not record a message rejected by Meta", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { message: "Recipient phone number is not allowed" },
          }),
          { status: 400, headers: { "content-type": "application/json" } }
        )
      )
    );

    await expect(createCaller().sendMessage(input)).rejects.toMatchObject({
      code: "BAD_GATEWAY",
    });
    expect(db.recordWhatsappOutboundMessage).not.toHaveBeenCalled();
  });

  it("enforces company ownership before reading credentials or sending", async () => {
    vi.mocked(db.getCompanyById).mockResolvedValue({
      id: 10,
      userId: 99,
    } as any);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(createCaller().sendMessage(input)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(db.getWhatsappConfigByCompany).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
