import { Router, Request, Response } from "express";
import * as db from "./db";

/**
 * Webhook da WhatsApp Cloud API (Meta).
 *
 * GET  /webhook/whatsapp  → verificação (hub.challenge) que a Meta exige ao salvar a URL
 * POST /webhook/whatsapp  → recebe as mensagens; a 1ª mensagem de um anúncio
 *                           Click-to-WhatsApp traz `referral` com a campanha/anúncio
 *                           de origem → registramos a conversa já ATRIBUÍDA.
 *
 * É um endpoint único (nível do app Meta). O roteamento para a empresa certa é
 * feito pelo `phone_number_id` que vem no payload (mapeado em whatsappConfigs).
 */
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
  // Responde 200 IMEDIATAMENTE — a Meta reenvia se não receber 200 rápido.
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

        // Descobre a empresa dona deste número
        const cfg = await db.getWhatsappConfigByPhoneNumberId(phoneNumberId);
        if (!cfg) {
          console.warn(`[WhatsApp] phone_number_id ${phoneNumberId} sem empresa configurada.`);
          continue;
        }

        // Mapa de nomes de contato (wa_id → nome do perfil)
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

          // Click-to-WhatsApp: referral só vem na 1ª mensagem que originou do anúncio
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
          });

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

          console.log(
            `[WhatsApp] Conversa ${conv?.id} (${waId}) ${campaignName ? "ATRIBUÍDA → " + campaignName : "orgânica"}`
          );
        }
      }
    }
  } catch (err: any) {
    console.error("[WhatsApp] Erro processando webhook:", err?.message || err);
  }
});

export default router;
