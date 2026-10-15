import webpush from "web-push";
import * as db from "../db";
import { ENV } from "../_core/env";

const GRAPH = "https://graph.facebook.com/v26.0";
const COOLDOWN_HOURS = 20;

export type BalanceReadResult =
  | { status: "ok"; balanceCents: number; currency: "BRL" }
  | { status: "not_prepaid"; message: string }
  | { status: "currency_mismatch"; currency: string; message: string }
  | { status: "error"; message: string };

export type BalanceCheckStatus =
  | "healthy"
  | "low_balance_notified"
  | "low_balance_cooldown"
  | "low_balance_no_device"
  | "low_balance_delivery_error"
  | "not_prepaid"
  | "currency_mismatch"
  | "error";

export interface BalanceAlertCandidate {
  companyId: number;
  thresholdCents: number;
  lastNotifiedAt: Date | string | null;
  userId: number;
  companyName: string;
  metaAdAccountId: string;
  metaAccessToken: string;
}

export interface BalanceCheckResult {
  companyId: number;
  status: BalanceCheckStatus;
  balanceCents: number | null;
  message: string;
  notified: boolean;
}

export function isAtOrBelowThreshold(balanceCents: number, thresholdCents: number): boolean {
  return balanceCents <= thresholdCents;
}

function toCents(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

/** Meta balance fields are not interchangeable: `balance` is an amount due. */
export function parsePrepayAccountBalance(data: any): BalanceReadResult {
  if (data?.error) {
    const message = String(data.error.message ?? "A Meta recusou a consulta.").slice(0, 300);
    return { status: "error", message };
  }

  if (data?.is_prepay_account === false || data?.stored_balance_status === "postpay") {
    return { status: "not_prepaid", message: "Esta conta não usa saldo pré-pago." };
  }

  const amount = data?.prepay_account_balance;
  if (amount === null || amount === undefined) {
    if (data?.stored_balance_status === "new_user") {
      return { status: "not_prepaid", message: "A conta ainda não tem saldo pré-pago disponível." };
    }
    return { status: "error", message: "A Meta não retornou o saldo pré-pago desta conta." };
  }

  const currency = String(
    (typeof amount === "object" ? amount.currency : undefined) ?? data?.currency ?? ""
  ).toUpperCase();
  if (currency !== "BRL") {
    return {
      status: "currency_mismatch",
      currency: currency || "desconhecida",
      message: `A conta está em ${currency || "moeda desconhecida"}; este limite está configurado em reais.`,
    };
  }

  let balanceCents: number | null = null;
  if (typeof amount === "object") {
    const hundredths = amount.amount_in_hundredths;
    if (hundredths !== null && hundredths !== undefined && hundredths !== "") {
      const value = Number(hundredths);
      balanceCents = Number.isFinite(value) ? Math.round(value) : null;
    }
    if (balanceCents === null) balanceCents = toCents(amount.amount);
  } else {
    balanceCents = toCents(amount);
  }

  if (balanceCents === null) {
    return { status: "error", message: "O formato do saldo retornado pela Meta não é reconhecido." };
  }

  return { status: "ok", balanceCents, currency: "BRL" };
}

export async function fetchPrepayAccountBalance(
  adAccountId: string,
  accessToken: string
): Promise<BalanceReadResult> {
  const numericId = adAccountId.replace(/^act_/, "");
  if (!/^\d+$/.test(numericId)) {
    return { status: "error", message: "O identificador da conta de anúncios é inválido." };
  }

  try {
    const url = new URL(`${GRAPH}/act_${numericId}`);
    url.searchParams.set(
      "fields",
      "currency,is_prepay_account,stored_balance_status,prepay_account_balance{amount,amount_in_hundredths,currency}"
    );
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    if (!response.ok && !data?.error) {
      return { status: "error", message: `A Meta respondeu com erro HTTP ${response.status}.` };
    }
    return parsePrepayAccountBalance(data);
  } catch (error: any) {
    const message = error?.name === "TimeoutError"
      ? "A consulta à Meta excedeu o tempo limite."
      : "Não foi possível consultar o saldo na Meta.";
    return { status: "error", message };
  }
}

function formatReais(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

async function saveResult(
  alert: BalanceAlertCandidate,
  result: BalanceCheckResult
): Promise<BalanceCheckResult> {
  await db.recordBalanceAlertCheck({
    companyId: alert.companyId,
    thresholdCents: alert.thresholdCents,
    status: result.status,
    message: result.message,
    balanceCents: result.balanceCents,
    notified: result.notified,
  });
  return result;
}

export async function checkBalanceCandidate(
  alert: BalanceAlertCandidate
): Promise<BalanceCheckResult> {
  const read = await fetchPrepayAccountBalance(alert.metaAdAccountId, alert.metaAccessToken);
  if (read.status !== "ok") {
    return saveResult(alert, {
      companyId: alert.companyId,
      status: read.status,
      balanceCents: null,
      message: read.message,
      notified: false,
    });
  }

  const { balanceCents } = read;
  const threshold = formatReais(alert.thresholdCents);
  if (!isAtOrBelowThreshold(balanceCents, alert.thresholdCents)) {
    return saveResult(alert, {
      companyId: alert.companyId,
      status: "healthy",
      balanceCents,
      message: `Saldo atual ${formatReais(balanceCents)}; limite de alerta ${threshold}.`,
      notified: false,
    });
  }

  if (alert.lastNotifiedAt) {
    const hoursSince = (Date.now() - new Date(alert.lastNotifiedAt).getTime()) / 3600000;
    if (hoursSince < COOLDOWN_HOURS) {
      return saveResult(alert, {
        companyId: alert.companyId,
        status: "low_balance_cooldown",
        balanceCents,
        message: `Saldo em ${formatReais(balanceCents)}; a notificação já foi enviada recentemente.`,
        notified: false,
      });
    }
  }

  const subscriptions = await db.getPushSubscriptionsByUser(alert.userId);
  if (subscriptions.length === 0) {
    return saveResult(alert, {
      companyId: alert.companyId,
      status: "low_balance_no_device",
      balanceCents,
      message: `Saldo em ${formatReais(balanceCents)}; ative as notificações neste dispositivo.`,
      notified: false,
    });
  }

  if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) {
    return saveResult(alert, {
      companyId: alert.companyId,
      status: "low_balance_delivery_error",
      balanceCents,
      message: `Saldo em ${formatReais(balanceCents)}; as chaves de notificação do servidor não estão configuradas.`,
      notified: false,
    });
  }

  let sentAny = false;
  let hadDeliveryError = false;
  try {
    webpush.setVapidDetails(
      `mailto:${ENV.vapidContactEmail}`,
      ENV.vapidPublicKey,
      ENV.vapidPrivateKey
    );
  } catch {
    return saveResult(alert, {
      companyId: alert.companyId,
      status: "low_balance_delivery_error",
      balanceCents,
      message: `Saldo em ${formatReais(balanceCents)}; a configuração VAPID do servidor é inválida.`,
      notified: false,
    });
  }

  const payload = JSON.stringify({
    title: "Saldo baixo no Meta Ads",
    body: `${alert.companyName}: saldo de ${formatReais(balanceCents)}, no limite de ${threshold}. Recarregue a conta antes que as campanhas parem.`,
    url: "/contas",
    icon: "/icon.svg",
  });

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        payload
      );
      sentAny = true;
    } catch (error: any) {
      if (error?.statusCode === 410 || error?.statusCode === 404) {
        await db.deletePushSubscription(subscription.endpoint);
      } else {
        hadDeliveryError = true;
      }
    }
  }

  if (sentAny) {
    return saveResult(alert, {
      companyId: alert.companyId,
      status: "low_balance_notified",
      balanceCents,
      message: `Saldo em ${formatReais(balanceCents)}; notificação enviada para este usuário.`,
      notified: true,
    });
  }

  return saveResult(alert, {
    companyId: alert.companyId,
    status: "low_balance_delivery_error",
    balanceCents,
    message: hadDeliveryError
      ? `Saldo em ${formatReais(balanceCents)}; o serviço de notificações não aceitou o envio. Reative o push no dispositivo.`
      : `Saldo em ${formatReais(balanceCents)}; não há dispositivo com inscrição push válida.`,
    notified: false,
  });
}
