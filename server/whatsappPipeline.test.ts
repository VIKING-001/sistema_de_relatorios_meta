import { describe, expect, it } from "vitest";
import {
  filterWhatsappConversations,
  getWhatsappBoardStage,
  groupWhatsappConversationsByStage,
  isWithinWhatsappSessionWindow,
  WHATSAPP_SESSION_IDLE_MS,
} from "../shared/whatsapp";

const conversations = [
  { id: 1, customerName: "Ana", waId: "5511001", campaignName: "Outubro", sourceType: "ctwa", status: "open", stage: "lead", tags: ["VIP", "Retornar"] },
  { id: 2, customerName: "Bia", waId: "5511002", campaignName: null, sourceType: "organic", status: "pending", stage: "qualified" },
  { id: 3, customerName: "Caio", waId: "5511003", campaignName: null, sourceType: "organic", status: "converted", stage: "negotiation" },
];

describe("WhatsApp conversation pipeline helpers", () => {
  it("treats a sale-linked contact as converted regardless of its previous stage", () => {
    expect(getWhatsappBoardStage(conversations[2])).toBe("converted");
  });

  it("filters conversations by search, status, source and stage together", () => {
    expect(filterWhatsappConversations(conversations, {
      search: "outubro",
      status: "open",
      source: "ads",
      stage: "lead",
    }).map((row) => row.id)).toEqual([1]);
  });

  it("matches tags without depending on letter case", () => {
    expect(filterWhatsappConversations(conversations, {
      search: "",
      status: "all",
      source: "all",
      stage: "all",
      tag: "vip",
    }).map((row) => row.id)).toEqual([1]);
  });

  it("groups every row into exactly one board column", () => {
    const groups = groupWhatsappConversationsByStage(conversations);
    expect(groups.lead.map((row) => row.id)).toEqual([1]);
    expect(groups.qualified.map((row) => row.id)).toEqual([2]);
    expect(groups.converted.map((row) => row.id)).toEqual([3]);
    expect(Object.values(groups).flat()).toHaveLength(conversations.length);
  });

  it("keeps messages in one attendance through the 24-hour inactivity boundary", () => {
    const start = new Date("2026-10-01T10:00:00.000Z");
    const last = new Date("2026-10-01T12:00:00.000Z");
    expect(isWithinWhatsappSessionWindow(start, last, new Date(last.getTime() + WHATSAPP_SESSION_IDLE_MS))).toBe(true);
    expect(isWithinWhatsappSessionWindow(start, last, new Date(last.getTime() + WHATSAPP_SESSION_IDLE_MS + 1))).toBe(false);
  });

  it("accepts an out-of-order webhook timestamp when it falls inside the attendance window", () => {
    const start = new Date("2026-10-01T10:00:00.000Z");
    const last = new Date("2026-10-01T12:00:00.000Z");
    expect(isWithinWhatsappSessionWindow(start, last, new Date("2026-10-01T11:00:00.000Z"))).toBe(true);
    expect(isWithinWhatsappSessionWindow(start, last, new Date(start.getTime() - WHATSAPP_SESSION_IDLE_MS))).toBe(true);
    expect(isWithinWhatsappSessionWindow(start, last, new Date(start.getTime() - WHATSAPP_SESSION_IDLE_MS - 1))).toBe(false);
  });
});
