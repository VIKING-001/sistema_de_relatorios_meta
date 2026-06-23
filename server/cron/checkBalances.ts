import express from "express";
import webpush from "web-push";
import * as db from "../db";
import { ENV } from "../_core/env";

const router = express.Router();

const GRAPH = "https://graph.facebook.com/v21.0";
const COOLDOWN_HOURS = 20; // só notifica novamente após 20h

/** Consulta o saldo da conta de anúncios pré-paga na Meta API */
async function fetchAdAccountBalance(
  adAccountId: string,
  accessToken: string
): Promise<number | null> {
  try {
    const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    const url = `${GRAPH}/${accountId}?fields=balance,currency&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json() as any;
    if (data.error || data.balance === undefined) return null;
    // Meta retorna balance em centavos da moeda local (ex: BRL)
    const balance = parseFloat(data.balance);
    return isNaN(balance) ? null : Math.round(balance * 100);
  } catch {
    return null;
  }
}

/** Endpoint de cron: GET /api/cron/check-balances */
router.get("/api/cron/check-balances", async (req, res) => {
  // Protegido pelo CRON_SECRET que o Vercel injeta automaticamente
  const authHeader = req.headers.authorization ?? "";
  const expected = ENV.cronSecret ? `Bearer ${ENV.cronSecret}` : "";
  if (expected && authHeader !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) {
    return res.status(500).json({ error: "VAPID keys not configured" });
  }

  webpush.setVapidDetails(
    `mailto:${ENV.vapidContactEmail}`,
    ENV.vapidPublicKey,
    ENV.vapidPrivateKey
  );

  const alerts = await db.getAllEnabledBalanceAlerts();
  let checked = 0;
  let notified = 0;
  const errors: string[] = [];

  for (const alert of alerts) {
    checked++;
    try {
      // Verifica cooldown — não notifica mais de uma vez em COOLDOWN_HOURS horas
      if (alert.lastNotifiedAt) {
        const hoursSince =
          (Date.now() - new Date(alert.lastNotifiedAt).getTime()) / (1000 * 60 * 60);
        if (hoursSince < COOLDOWN_HOURS) continue;
      }

      const balanceCents = await fetchAdAccountBalance(
        alert.metaAdAccountId,
        alert.metaAccessToken
      );

      // Se não conseguiu ler saldo (conta pós-paga ou erro), pula silenciosamente
      if (balanceCents === null) continue;

      if (balanceCents < alert.thresholdCents) {
        const balanceReais = (balanceCents / 100).toFixed(2).replace(".", ",");
        const thresholdReais = (alert.thresholdCents / 100).toFixed(2).replace(".", ",");

        const payload = JSON.stringify({
          title: "⚠️ Saldo baixo no Meta Ads",
          body: `${alert.companyName}: saldo R$${balanceReais} abaixo do limite de R$${thresholdReais}. Recarregue antes que as campanhas parem.`,
          url: "/contas",
          icon: "/icon.svg",
        });

        const subscriptions = await db.getPushSubscriptionsByUser(alert.userId);
        let sentAny = false;

        for (const sub of subscriptions) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            );
            sentAny = true;
          } catch (pushErr: any) {
            // Subscription expirada (410) — remover do banco
            if (pushErr?.statusCode === 410 || pushErr?.statusCode === 404) {
              await db.deletePushSubscription(sub.endpoint);
            }
          }
        }

        if (sentAny) {
          await db.setBalanceAlertNotified(alert.companyId);
          notified++;
        }
      }
    } catch (err: any) {
      errors.push(`company ${alert.companyId}: ${err?.message}`);
    }
  }

  console.log(`[Cron] check-balances: ${checked} contas verificadas, ${notified} notificações enviadas`);
  return res.json({ ok: true, checked, notified, errors });
});

export default router;
