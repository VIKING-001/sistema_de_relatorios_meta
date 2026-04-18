import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import type { Express, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { verifySessionJwt } from "./localAuth";

/** Lê cookies do header raw (sem precisar do cookie-parser middleware) */
function getCookieFromRequest(req: Request, name: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  const parsed = parseCookieHeader(raw);
  return parsed[name];
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// ── Meta OAuth state JWT (CSRF protection) ──────────────────────────────────

function getStateKey() {
  return new TextEncoder().encode((ENV.cookieSecret || "viking-state-key") + "-meta-state");
}

async function signOAuthState(payload: { companyId: number; userId: number }): Promise<string> {
  return new SignJWT({ ...payload, type: "meta_oauth" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10m") // 10 minutos para completar o OAuth
    .sign(getStateKey());
}

async function verifyOAuthState(
  token: string
): Promise<{ companyId: number; userId: number } | null> {
  try {
    const { payload } = await jwtVerify(token, getStateKey(), { algorithms: ["HS256"] });
    const { companyId, userId, type } = payload as Record<string, unknown>;
    if (type !== "meta_oauth") return null;
    if (typeof companyId !== "number" || typeof userId !== "number") return null;
    return { companyId, userId };
  } catch {
    return null;
  }
}

// ── Meta Graph API helpers ───────────────────────────────────────────────────

async function exchangeCodeForLongLivedToken(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; expires_in: number }> {
  // 1. Troca code → short-lived token
  const shortUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
  shortUrl.searchParams.set("client_id", ENV.metaAppId);
  shortUrl.searchParams.set("client_secret", ENV.metaAppSecret);
  shortUrl.searchParams.set("redirect_uri", redirectUri);
  shortUrl.searchParams.set("code", code);

  const shortRes = await fetch(shortUrl.toString());
  const shortData = await shortRes.json();
  if (shortData.error) throw new Error(shortData.error.message);

  // 2. Troca short-lived → long-lived (60 dias)
  const longUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
  longUrl.searchParams.set("grant_type", "fb_exchange_token");
  longUrl.searchParams.set("client_id", ENV.metaAppId);
  longUrl.searchParams.set("client_secret", ENV.metaAppSecret);
  longUrl.searchParams.set("fb_exchange_token", shortData.access_token);

  const longRes = await fetch(longUrl.toString());
  const longData = await longRes.json();
  if (longData.error) throw new Error(longData.error.message);

  return {
    access_token: longData.access_token,
    expires_in: longData.expires_in ?? 5184000, // 60 dias default
  };
}

async function getAdAccounts(
  accessToken: string
): Promise<Array<{ id: string; name: string; currency: string }>> {
  const url = new URL("https://graph.facebook.com/v19.0/me/adaccounts");
  url.searchParams.set("fields", "id,name,currency");
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString());
  const data = await res.json();
  return data.data || [];
}

// ── Express routes ───────────────────────────────────────────────────────────

export function registerOAuthRoutes(app: Express) {
  // ── Login OAuth do sistema (Manus / existente) ──────────────────────────
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // ── Meta OAuth: inicia o fluxo ──────────────────────────────────────────
  app.get("/api/meta/connect", async (req: Request, res: Response) => {
    const companyIdStr = getQueryParam(req, "companyId");
    if (!companyIdStr) {
      res.status(400).json({ error: "companyId required" });
      return;
    }

    if (!ENV.metaAppId || !ENV.metaAppSecret) {
      res.redirect(302, "/?meta_error=" + encodeURIComponent("META_APP_ID e META_APP_SECRET não configurados no servidor."));
      return;
    }

    // Valida sessão do usuário via cookie (lê do header raw, sem cookie-parser)
    const sessionToken = getCookieFromRequest(req, COOKIE_NAME);
    const session = await verifySessionJwt(sessionToken);
    if (!session) {
      res.redirect(302, "/?meta_error=not_authenticated");
      return;
    }

    const user = await db.getUserByOpenId(session.openId);
    if (!user) {
      res.redirect(302, "/?meta_error=user_not_found");
      return;
    }

    const companyId = parseInt(companyIdStr, 10);
    const company = await db.getCompanyById(companyId);
    if (!company || company.userId !== user.id) {
      res.status(403).json({ error: "Acesso negado a esta empresa" });
      return;
    }

    // Cria state JWT anti-CSRF
    const state = await signOAuthState({ companyId, userId: user.id });

    const redirectUri = `${ENV.appBaseUrl}/api/meta/callback`;

    console.log("[OAuth] APP_BASE_URL:", ENV.appBaseUrl);
    console.log("[OAuth] redirect_uri:", redirectUri);
    console.log("[OAuth] META_APP_ID:", ENV.metaAppId);

    const authUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
    authUrl.searchParams.set("client_id", ENV.metaAppId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", "ads_read,business_management,ads_management");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("response_type", "code");

    res.redirect(302, authUrl.toString());
  });

  // ── Meta OAuth: callback do Facebook ───────────────────────────────────
  app.get("/api/meta/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const error = getQueryParam(req, "error");
    const errorReason = getQueryParam(req, "error_reason");

    if (error) {
      const msg = errorReason === "user_denied"
        ? "Autorização cancelada pelo usuário."
        : error;
      res.redirect(302, "/?meta_error=" + encodeURIComponent(msg));
      return;
    }

    if (!code || !state) {
      res.redirect(302, "/?meta_error=" + encodeURIComponent("Parâmetros inválidos no retorno do Meta."));
      return;
    }

    try {
      // Verifica state anti-CSRF
      const stateData = await verifyOAuthState(state);
      if (!stateData) {
        res.redirect(302, "/?meta_error=" + encodeURIComponent("State inválido ou expirado. Tente novamente."));
        return;
      }

      const { companyId } = stateData;
      const redirectUri = `${ENV.appBaseUrl}/api/meta/callback`;

      // Troca o código por long-lived token
      const { access_token, expires_in } = await exchangeCodeForLongLivedToken(code, redirectUri);
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      // Busca contas de anúncios do usuário
      const adAccounts = await getAdAccounts(access_token);
      // Se tiver apenas uma conta, já salva automaticamente
      const autoAccountId = adAccounts.length === 1 ? adAccounts[0].id : null;

      // Salva no banco
      await db.updateCompanyMetaOAuth(companyId, access_token, expiresAt, autoAccountId);

      console.log(`[Meta OAuth] Empresa ${companyId} conectada. Contas encontradas: ${adAccounts.length}. Auto-selecionada: ${autoAccountId || "nenhuma"}`);

      // Redireciona de volta ao dashboard com sucesso
      const accountsParam = encodeURIComponent(JSON.stringify(adAccounts));
      res.redirect(302, `/?meta_connected=1&companyId=${companyId}&accounts=${accountsParam}`);
    } catch (err: any) {
      console.error("[Meta OAuth] Callback error:", err);
      res.redirect(302, "/?meta_error=" + encodeURIComponent(err?.message || "Erro desconhecido no OAuth do Meta."));
    }
  });
}
