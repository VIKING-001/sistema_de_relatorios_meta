import { describe, expect, it } from "vitest";
import {
  filterWhatsappConversations,
  getWhatsappBoardStage,
  groupWhatsappConversationsByStage,
} from "../shared/whatsapp";

const conversations = [
  { id: 1, customerName: "Ana", waId: "5511001", campaignName: "Outubro", sourceType: "ctwa", status: "open", stage: "lead" },
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

  it("groups every row into exactly one board column", () => {
    const groups = groupWhatsappConversationsByStage(conversations);
    expect(groups.lead.map((row) => row.id)).toEqual([1]);
    expect(groups.qualified.map((row) => row.id)).toEqual([2]);
    expect(groups.converted.map((row) => row.id)).toEqual([3]);
    expect(Object.values(groups).flat()).toHaveLength(conversations.length);
  });
});
