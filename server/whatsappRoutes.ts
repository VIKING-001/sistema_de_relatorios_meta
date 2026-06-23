import { Router, Request, Response } from "express";
import * as db from "./db";

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
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body?.object !== "whatsapp_business_account") return;

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        const phoneNumberId: string | undefined = value?.metadata?.phone_number_id;
        const messages = value.messages ?? [];
        if (!phoneNumberId || messages.length === 0) continue;

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
          const waId: string = msg.from;
          const ts = msg.timestamp ? new Date(Number(msg.timestamp) * 1000) : new Date();
          const text =
            msg.text?.body ??
            msg.button?.text ??
            msg.interactive?.button_reply?.title ??
            `[${msg.type}]`;

          const ref = msg.referral;
          const campaignName =
            ref?.source_type === "ad" || ref?.source_id
              ? (ref?.headline || ref?.source_id || "Anúncio WhatsApp")
              : null;

          const conv = await db.upsertWhatsappConversation({
            companyId: cfg.companyId,
            waId,
            customerName: contactName.get(waId) || null,
            sourceType: campaignName ? "ctwa" : "organic",
            campaignName,
            adId: ref?.source_id ?? null,
            adHeadline: ref?.headline ?? null,
            ctwaClid: ref?.ctwa_clid ?? null,
            sourceUrl: ref?.source_url ?? null,
            lastMessageText: text,
            messageTime: ts,
          }).catch((e: any) => {
            console.error("[WhatsApp] upsertWhatsappConversation ERRO:", e?.message, e?.code);
            return null;
          });

          // Salva a mensagem individual para exibir no histórico
          console.log(`[WhatsApp] step:saveMsg fn=${typeof (db as any).saveWhatsappMessage} wamid=${msg.id} convId=${conv?.id}`);
          try {
            await (db as any).saveWhatsappMessage({
              conversationId: conv?.id ?? null,
              companyId: cfg.companyId,
              waId,
              wamid: msg.id ?? null,
              direction: "inbound",
              type: msg.type ?? "text",
              text,
              timestamp: ts,
            });
            console.log(`[WhatsApp] step:saveMsg OK`);
          } catch (se: any) {
            console.error("[WhatsApp] saveWhatsappMessage ERRO:", se?.message, se?.code, se?.detail);
          }

          await db.logWebhookEvent({
            companyId: cfg.companyId,
            platform: "whatsapp",
            success: true,
            trackingFound: !!campaignName,
            message: campaignName
              ? `Conversa de ${waId} via anúncio: ${campaignName}`
              : `Conversa de ${waId} (orgânica)`,
            payloadSummary: text?.slice(0, 200) ?? null,
          });
        }
      }
    }
  } catch (err: any) {
    console.error("[WhatsApp] Erro processando webhook:", err?.stack?.split("\n").slice(0,2).join(" | ") || err?.message || String(err));
  }
});

export default router;
