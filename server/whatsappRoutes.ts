import { Router, Request, Response } from "express";
import * as db from "./db";
import {
  verifyMetaWebhookSignature,
  whatsappEchoRecipient,
  whatsappMessageText,
  whatsappMessageTimestamp,
} from "./whatsappWebhookUtils";

const router = Router();

// ── Verificação (GET) ────────────────────────────────────────────────────────
router.get("/webhook/whatsapp", async (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = String(req.query["hub.verify_token"] ?? "");
  const challenge = req.query["hub.challenge"];

  const envToken = process.env.WHATSAPP_VERIFY_TOKEN || "";
  const ok =
    mode === "subscribe" &&
    token.length > 0 &&
    (token === envToken || (await db.whatsappVerifyTokenMatches(token)));

  if (ok) {
    console.log("[WhatsApp] Webhook verificado com sucesso.");
    return res.status(200).send(challenge);
  }
  console.warn("[WhatsApp] Falha na verificação do webhook (token não confere).");
  return res.sendStatus(403);
});

// ── Recebimento de mensagens (POST) ──────────────────────────────────────────
router.post("/webhook/whatsapp", async (req: Request, res: Response) => {
  try {
    const appSecret = process.env.META_APP_SECRET?.trim();
    if (!appSecret) {
      console.error("[WhatsApp] META_APP_SECRET não configurado; webhook recusado.");
      return res.sendStatus(503);
    }
    const rawBody = (req as Request & { rawBody?: string }).rawBody;
    const signature = req.get("x-hub-signature-256");
    if (!verifyMetaWebhookSignature(rawBody, signature, appSecret)) {
      console.warn("[WhatsApp] Webhook recusado: assinatura Meta inválida ou ausente.");
      return res.sendStatus(401);
    }

    const body = req.body;
    if (body?.object !== "whatsapp_business_account") return res.sendStatus(200);

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        const phoneNumberId: string | undefined = value?.metadata?.phone_number_id;
        const messages = Array.isArray(value.messages) ? value.messages : [];
        const echoes = Array.isArray(value.message_echoes) ? value.message_echoes : [];
        if (!phoneNumberId || (messages.length === 0 && echoes.length === 0)) continue;

        const cfg = await db.getWhatsappConfigByPhoneNumberId(phoneNumberId);
        if (!cfg) {
          console.warn(`[WhatsApp] phone_number_id ${phoneNumberId} sem empresa configurada.`);
          continue;
        }

        const contactName = new Map<string, string>();
        for (const c of value.contacts ?? []) {
          if (c?.wa_id) contactName.set(c.wa_id, c?.profile?.name ?? "");
        }

        for (const msg of messages) {
          const waId: string = String(msg.from ?? "");
          const wamid: string = String(msg.id ?? "");
          if (!waId || !wamid) {
            console.warn("[WhatsApp] Mensagem ignorada: remetente ou ID ausente.");
            continue;
          }
          const ts = msg.timestamp == null || msg.timestamp === ""
            ? new Date()
            : whatsappMessageTimestamp(msg.timestamp);
          if (!ts) {
            console.warn("[WhatsApp] Mensagem ignorada: timestamp inválido.");
            continue;
          }
          const text = whatsappMessageText(msg);

          const ref = msg.referral;
          const campaignName =
            ref?.source_type === "ad" || ref?.source_id
              ? (ref?.headline || ref?.source_id || "Anúncio WhatsApp")
              : null;

          try {
            const saved = await db.recordWhatsappInboundMessage({
              companyId: cfg.companyId,
              waId,
              wamid,
              customerName: contactName.get(waId) || null,
              type: msg.type ?? "text",
              text,
              timestamp: ts,
              campaignName,
              adId: ref?.source_id ?? null,
              adHeadline: ref?.headline ?? null,
              ctwaClid: ref?.ctwa_clid ?? null,
              sourceUrl: ref?.source_url ?? null,
            });
            if (saved.duplicate) continue;

            await db.logWebhookEvent({
              companyId: cfg.companyId,
              platform: "whatsapp",
              success: true,
              trackingFound: !!campaignName,
              message: campaignName
                ? `Atendimento via anúncio: ${campaignName}`
                : "Atendimento orgânico registrado",
              payloadSummary: text?.slice(0, 200) ?? null,
            });
          } catch (error: any) {
            console.error("[WhatsApp] Falha ao registrar mensagem/atendimento:", error?.message || error);
            throw error;
          }
        }

        for (const msg of echoes) {
          const waId = whatsappEchoRecipient(msg);
          const wamid = String(msg.id ?? "");
          const ts = whatsappMessageTimestamp(msg.timestamp);
          if (!waId || !wamid || !ts) {
            console.warn("[WhatsApp] Echo ignorado: destinatário, ID ou timestamp ausente/inválido.");
            continue;
          }
          const text = whatsappMessageText(msg);
          try {
            const saved = await db.recordWhatsappOutboundMessage({
              companyId: cfg.companyId,
              waId,
              wamid,
              type: msg.type ?? "text",
              text,
              timestamp: ts,
            });
            if (saved.duplicate) continue;

            await db.logWebhookEvent({
              companyId: cfg.companyId,
              platform: "whatsapp",
              success: true,
              trackingFound: !!saved.conversation?.campaignName,
              message: "Resposta enviada pela equipe registrada",
              payloadSummary: text.slice(0, 200),
            });
          } catch (error: any) {
            console.error("[WhatsApp] Falha ao registrar resposta enviada:", error?.message || error);
            throw error;
          }
        }
      }
    }
    return res.sendStatus(200);
  } catch (err: any) {
    console.error("[WhatsApp] Erro processando webhook:", err?.stack?.split("\n").slice(0,2).join(" | ") || err?.message || String(err));
    return res.sendStatus(500);
  }
});

export default router;
