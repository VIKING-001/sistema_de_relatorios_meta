export const WHATSAPP_EDITABLE_STATUSES = ["open", "pending", "closed"] as const;
export const WHATSAPP_SESSION_IDLE_HOURS = 24;
export const WHATSAPP_SESSION_IDLE_MS = WHATSAPP_SESSION_IDLE_HOURS * 60 * 60 * 1000;
export const WHATSAPP_CONVERSATION_STAGES = [
  "lead",
  "contacted",
  "qualified",
  "negotiation",
  "lost",
] as const;

export const WHATSAPP_STATUS_LABELS: Record<string, string> = {
  open: "Aberta",
  pending: "Pendente",
  closed: "Fechada",
  converted: "Convertida",
};

export const WHATSAPP_STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  contacted: "Em atendimento",
  qualified: "Qualificado",
  negotiation: "Negociação",
  lost: "Perdido",
  converted: "Convertido",
};

export type WhatsappEditableStatus = (typeof WHATSAPP_EDITABLE_STATUSES)[number];
export type WhatsappConversationStage = (typeof WHATSAPP_CONVERSATION_STAGES)[number];

export const WHATSAPP_BOARD_STAGES = [...WHATSAPP_CONVERSATION_STAGES, "converted"] as const;
export type WhatsappBoardStage = (typeof WHATSAPP_BOARD_STAGES)[number];

export function isWithinWhatsappSessionWindow(
  startedAt: Date | string,
  lastMessageAt: Date | string,
  messageAt: Date | string,
): boolean {
  const start = new Date(startedAt).getTime();
  const last = new Date(lastMessageAt).getTime();
  const message = new Date(messageAt).getTime();
  if (![start, last, message].every(Number.isFinite)) return false;
  if (message >= start && message <= last) return true;
  if (message > last) return message - last <= WHATSAPP_SESSION_IDLE_MS;
  return start - message <= WHATSAPP_SESSION_IDLE_MS;
}

export interface WhatsappConversationSummaryItem {
  status?: string | null;
  stage?: string | null;
  sourceType?: string | null;
  campaignName?: string | null;
  customerName?: string | null;
  waId?: string | null;
  adHeadline?: string | null;
  tags?: string[] | null;
}

export interface WhatsappConversationFilters {
  search: string;
  status: string;
  source: string;
  stage: string;
  tag?: string;
}

export function getWhatsappBoardStage(conversation: WhatsappConversationSummaryItem): WhatsappBoardStage {
  if (conversation.status === "converted") return "converted";
  return WHATSAPP_CONVERSATION_STAGES.includes(conversation.stage as WhatsappConversationStage)
    ? conversation.stage as WhatsappConversationStage
    : "lead";
}

export function filterWhatsappConversations<T extends WhatsappConversationSummaryItem>(
  conversations: T[],
  filters: WhatsappConversationFilters,
): T[] {
  const term = filters.search.trim().toLocaleLowerCase("pt-BR");
  const tag = filters.tag?.trim().toLocaleLowerCase("pt-BR");
  return conversations.filter((conversation) => {
    const status = conversation.status ?? "open";
    const stage = getWhatsappBoardStage(conversation);
    const source = (conversation.campaignName || conversation.sourceType === "ctwa") ? "ads" : "organic";
    const searchable = [conversation.customerName, conversation.waId, conversation.campaignName, conversation.adHeadline]
      .filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
    const tags = Array.isArray(conversation.tags) ? conversation.tags : [];
    return (!term || searchable.includes(term))
      && (filters.status === "all" || status === filters.status)
      && (filters.source === "all" || source === filters.source)
      && (filters.stage === "all" || stage === filters.stage)
      && (!tag || tags.some((item) => item.toLocaleLowerCase("pt-BR") === tag));
  });
}

export function groupWhatsappConversationsByStage<T extends WhatsappConversationSummaryItem>(conversations: T[]) {
  return WHATSAPP_BOARD_STAGES.reduce((groups, stage) => {
    groups[stage] = conversations.filter((conversation) => getWhatsappBoardStage(conversation) === stage);
    return groups;
  }, {} as Record<WhatsappBoardStage, T[]>);
}
