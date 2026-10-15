import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyMetaWebhookSignature(
  rawBody: string | undefined,
  signature: string | undefined,
  appSecret: string | undefined,
): boolean {
  if (!rawBody || !signature || !appSecret) return false;
  const match = /^sha256=([a-f0-9]{64})$/i.exec(signature);
  if (!match) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest();
  const received = Buffer.from(match[1], "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function whatsappMessageText(message: any): string {
  return message?.text?.body
    ?? message?.button?.text
    ?? message?.interactive?.button_reply?.title
    ?? message?.interactive?.list_reply?.title
    ?? message?.image?.caption
    ?? message?.video?.caption
    ?? message?.document?.caption
    ?? `[${message?.type ?? "mensagem"}]`;
}

export function whatsappEchoRecipient(message: any): string {
  const recipient = String(message?.to ?? message?.recipient_id ?? "").trim();
  if (!recipient) return "";
  const digits = recipient.replace(/\D/g, "");
  return digits || recipient;
}

export function whatsappMessageTimestamp(timestamp: unknown): Date | null {
  if (typeof timestamp === "number" || (typeof timestamp === "string" && /^\d{10,13}$/.test(timestamp.trim()))) {
    const value = Number(timestamp);
    const date = new Date(value < 1_000_000_000_000 ? value * 1000 : value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof timestamp !== "string" || !timestamp.trim()) return null;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}
