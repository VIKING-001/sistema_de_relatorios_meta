import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../drizzle/schema";
import { users, companies, reports, reportMetrics, utmTracking, utmSessions, trackedSales, webhookConfigs } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { ENV } from "./_core/env";
import type { User, InsertUser, Company, Report, ReportMetrics, InsertReportMetrics, UtmTracking, InsertUtmTracking, UtmSession, InsertUtmSession, TrackedSale, InsertTrackedSale, WebhookConfig, InsertWebhookConfig } from "../drizzle/schema";

let dbInstance: any;
let rawPool: InstanceType<typeof Pool> | null = null;
let migratedOnce = false;

const databaseUrl = process.env.DATABASE_URL || ENV.databaseUrl;

/** Cria as tabelas se ainda não existirem (idempotente via IF NOT EXISTS) */
async function ensureTables(pool: InstanceType<typeof Pool>) {
  if (migratedOnce) return;
  // Cada statement separado para compatibilidade com pgBouncer
  const statements = [
    `CREATE TABLE IF NOT EXISTS "users" (
      "id" serial PRIMARY KEY NOT NULL,
      "openId" varchar(64) NOT NULL,
      "name" text,
      "email" varchar(320),
      "passwordHash" varchar(255),
      "loginMethod" varchar(64),
      "role" text DEFAULT 'user' NOT NULL,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL,
      "lastSignedIn" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "users_openId_unique" UNIQUE("openId"),
      CONSTRAINT "users_email_unique" UNIQUE("email")
    )`,
    `CREATE TABLE IF NOT EXISTS "companies" (
      "id" serial PRIMARY KEY NOT NULL,
      "userId" integer NOT NULL,
      "name" varchar(255) NOT NULL,
      "description" text,
      "metaAdAccountId" varchar(64),
      "metaAccessToken" text,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL
    )`,
    // Adiciona colunas Meta em empresas já existentes (idempotente)
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "metaAdAccountId" varchar(64)`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "metaAccessToken" text`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "metaTokenExpiresAt" timestamp`,
    `CREATE TABLE IF NOT EXISTS "reports" (
      "id" serial PRIMARY KEY NOT NULL,
      "companyId" integer NOT NULL,
      "userId" integer NOT NULL,
      "title" varchar(255) NOT NULL,
      "slug" varchar(255) NOT NULL,
      "description" text,
      "startDate" date NOT NULL,
      "endDate" date NOT NULL,
      "isPublished" text DEFAULT 'draft' NOT NULL,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "reports_slug_unique" UNIQUE("slug")
    )`,
    `CREATE TABLE IF NOT EXISTS "reportMetrics" (
      "id" serial PRIMARY KEY NOT NULL,
      "reportId" integer NOT NULL,
      "instagramReach" integer DEFAULT 0 NOT NULL,
      "totalReach" integer DEFAULT 0 NOT NULL,
      "totalImpressions" integer DEFAULT 0 NOT NULL,
      "instagramProfileVisits" integer DEFAULT 0 NOT NULL,
      "newInstagramFollowers" integer DEFAULT 0 NOT NULL,
      "messagesInitiated" integer DEFAULT 0 NOT NULL,
      "totalSpent" numeric(10, 2) DEFAULT '0.00' NOT NULL,
      "totalClicks" integer DEFAULT 0 NOT NULL,
      "costPerClick" numeric(10, 2) DEFAULT '0.00' NOT NULL,
      "videoRetentionRate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
      "profileVisitsThroughCampaigns" integer DEFAULT 0 NOT NULL,
      "costPerProfileVisit" numeric(10, 2) DEFAULT '0.00' NOT NULL,
      "cpm" numeric(10, 2) DEFAULT '0.00' NOT NULL,
      "ctr" numeric(5, 2) DEFAULT '0.00' NOT NULL,
      "purchases" integer DEFAULT 0 NOT NULL,
      "purchaseValue" numeric(12, 2) DEFAULT '0.00' NOT NULL,
      "costPerPurchase" numeric(10, 2) DEFAULT '0.00' NOT NULL,
      "costPerMessage" numeric(10, 2) DEFAULT '0.00' NOT NULL,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL
    )`,
    // Adiciona novas colunas de conversão em tabelas já existentes (idempotente)
    `ALTER TABLE "reportMetrics" ADD COLUMN IF NOT EXISTS "purchases" integer DEFAULT 0 NOT NULL`,
    `ALTER TABLE "reportMetrics" ADD COLUMN IF NOT EXISTS "purchaseValue" numeric(12, 2) DEFAULT '0.00' NOT NULL`,
    `ALTER TABLE "reportMetrics" ADD COLUMN IF NOT EXISTS "costPerPurchase" numeric(10, 2) DEFAULT '0.00' NOT NULL`,
    `ALTER TABLE "reportMetrics" ADD COLUMN IF NOT EXISTS "costPerMessage" numeric(10, 2) DEFAULT '0.00' NOT NULL`,
    `ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "aiAnalysis" text`,
    // UTM Tracking tables
    `CREATE TABLE IF NOT EXISTS "utmTracking" (
      "id" serial PRIMARY KEY NOT NULL,
      "companyId" integer NOT NULL,
      "userId" integer NOT NULL,
      "baseUrl" text NOT NULL,
      "utmSource" varchar(255),
      "utmMedium" varchar(255),
      "utmCampaign" varchar(255) NOT NULL,
      "utmContent" varchar(255),
      "utmTerm" varchar(255),
      "trackingUrl" text NOT NULL,
      "shortCode" varchar(20),
      "clickCount" integer DEFAULT 0 NOT NULL,
      "conversionCount" integer DEFAULT 0 NOT NULL,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "utmTracking_shortCode_unique" UNIQUE("shortCode")
    )`,
    `CREATE TABLE IF NOT EXISTS "utmSessions" (
      "id" serial PRIMARY KEY NOT NULL,
      "trackingId" integer NOT NULL,
      "sessionId" varchar(255) NOT NULL,
      "ipAddress" varchar(45),
      "userAgent" text,
      "referrer" text,
      "clickedAt" timestamp DEFAULT now() NOT NULL,
      "convertedAt" timestamp,
      "conversionValue" numeric(12, 2),
      "conversionType" varchar(64),
      "externalConversionId" varchar(255)
    )`,
    `CREATE TABLE IF NOT EXISTS "trackedSales" (
      "id" serial PRIMARY KEY NOT NULL,
      "companyId" integer NOT NULL,
      "userId" integer NOT NULL,
      "sessionId" integer,
      "trackingId" integer,
      "utmSource" varchar(255),
      "utmMedium" varchar(255),
      "utmCampaign" varchar(255),
      "utmContent" varchar(255),
      "utmTerm" varchar(255),
      "orderId" varchar(255) NOT NULL,
      "orderValue" numeric(12, 2) NOT NULL,
      "currency" varchar(3) DEFAULT 'BRL',
      "saleDate" timestamp NOT NULL,
      "customerName" varchar(255),
      "customerEmail" varchar(320),
      "customerPhone" varchar(20),
      "source" varchar(64) NOT NULL,
      "externalId" varchar(255),
      "status" varchar(64) DEFAULT 'confirmed',
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "webhookConfigs" (
      "id" serial PRIMARY KEY NOT NULL,
      "companyId" integer NOT NULL,
      "userId" integer NOT NULL,
      "platform" varchar(64) NOT NULL,
      "webhookUrl" text NOT NULL,
      "webhookSecret" varchar(255) NOT NULL,
      "config" text,
      "status" varchar(64) DEFAULT 'active',
      "lastHealthCheck" timestamp,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL
    )`,
    // Garante coluna de health check em webhooks já existentes
    `ALTER TABLE "webhookConfigs" ADD COLUMN IF NOT EXISTS "lastHealthCheck" timestamp`,
    // Garante coluna de nome do cliente em vendas já existentes
    `ALTER TABLE "trackedSales" ADD COLUMN IF NOT EXISTS "customerName" varchar(255)`,
    // Log de cada chamada de webhook recebida (para status "Recebendo ✓" e debug)
    `CREATE TABLE IF NOT EXISTS "webhookEvents" (
      "id" serial PRIMARY KEY NOT NULL,
      "companyId" integer,
      "platform" varchar(64) NOT NULL,
      "success" boolean DEFAULT true NOT NULL,
      "saleId" integer,
      "trackingFound" boolean DEFAULT false NOT NULL,
      "message" text,
      "payloadSummary" text,
      "createdAt" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS "idx_webhookEvents_companyId" ON "webhookEvents"("companyId")`,
    `CREATE INDEX IF NOT EXISTS "idx_webhookEvents_platform" ON "webhookEvents"("platform")`,
    // UTM indices for performance
    `CREATE INDEX IF NOT EXISTS "idx_utmTracking_companyId" ON "utmTracking"("companyId")`,
    `CREATE INDEX IF NOT EXISTS "idx_utmSessions_trackingId" ON "utmSessions"("trackingId")`,
    `CREATE INDEX IF NOT EXISTS "idx_utmSessions_sessionId" ON "utmSessions"("sessionId")`,
    `CREATE INDEX IF NOT EXISTS "idx_trackedSales_companyId" ON "trackedSales"("companyId")`,
    `CREATE INDEX IF NOT EXISTS "idx_trackedSales_trackingId" ON "trackedSales"("trackingId")`,
    `CREATE INDEX IF NOT EXISTS "idx_trackedSales_saleDate" ON "trackedSales"("saleDate")`,
    `CREATE INDEX IF NOT EXISTS "idx_webhookConfigs_companyId" ON "webhookConfigs"("companyId")`,
    // Credenciais de API para integração com plataformas externas
    `CREATE TABLE IF NOT EXISTS "apiCredentials" (
      "id" serial PRIMARY KEY NOT NULL,
      "companyId" integer NOT NULL,
      "userId" integer NOT NULL,
      "name" varchar(255) NOT NULL,
      "tokenHash" varchar(255) NOT NULL,
      "platform" varchar(64) NOT NULL,
      "status" varchar(64) DEFAULT 'active',
      "lastUsedAt" timestamp,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS "idx_apiCredentials_companyId" ON "apiCredentials"("companyId")`,
    // WhatsApp Cloud API — config por empresa (mapeia phoneNumberId → empresa)
    `CREATE TABLE IF NOT EXISTS "whatsappConfigs" (
      "id" serial PRIMARY KEY NOT NULL,
      "companyId" integer NOT NULL,
      "userId" integer NOT NULL,
      "phoneNumberId" varchar(64) NOT NULL,
      "wabaId" varchar(64),
      "displayPhone" varchar(32),
      "accessToken" text,
      "verifyToken" varchar(255),
      "status" varchar(32) DEFAULT 'active',
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "whatsappConfigs_phoneNumberId_unique" UNIQUE("phoneNumberId")
    )`,
    // WhatsApp — conversas iniciadas (atribuídas à campanha via CTWA referral)
    `CREATE TABLE IF NOT EXISTS "whatsappConversations" (
      "id" serial PRIMARY KEY NOT NULL,
      "companyId" integer NOT NULL,
      "waId" varchar(32) NOT NULL,
      "customerName" varchar(255),
      "sourceType" varchar(20) DEFAULT 'organic',
      "campaignName" varchar(255),
      "adId" varchar(64),
      "adHeadline" text,
      "ctwaClid" varchar(255),
      "sourceUrl" text,
      "firstMessageAt" timestamp DEFAULT now() NOT NULL,
      "lastMessageAt" timestamp DEFAULT now() NOT NULL,
      "lastMessageText" text,
      "messageCount" integer DEFAULT 0 NOT NULL,
      "status" varchar(20) DEFAULT 'open',
      "saleId" integer,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "whatsappConversations_company_wa_unique" UNIQUE("companyId", "waId")
    )`,
    `CREATE INDEX IF NOT EXISTS "idx_whatsappConversations_companyId" ON "whatsappConversations"("companyId")`,
    `CREATE INDEX IF NOT EXISTS "idx_whatsappConversations_waId" ON "whatsappConversations"("waId")`,
    `CREATE INDEX IF NOT EXISTS "idx_whatsappConfigs_companyId" ON "whatsappConfigs"("companyId")`,
    // Mensagens individuais de WhatsApp (uma linha por mensagem recebida)
    `CREATE TABLE IF NOT EXISTS "whatsappMessages" (
      "id" serial PRIMARY KEY NOT NULL,
      "conversationId" integer,
      "companyId" integer NOT NULL,
      "waId" varchar(32) NOT NULL,
      "wamid" text UNIQUE,
      "direction" varchar(10) NOT NULL DEFAULT 'inbound',
      "type" varchar(20) DEFAULT 'text',
      "text" text,
      "timestamp" timestamptz NOT NULL DEFAULT NOW(),
      "createdAt" timestamptz DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS "idx_whatsappMessages_companyWaId" ON "whatsappMessages"("companyId","waId")`,
    `CREATE INDEX IF NOT EXISTS "idx_whatsappMessages_conversationId" ON "whatsappMessages"("conversationId")`,
    // ─── PWA Push Notifications ──────────────────────────────────────────────
    // Subscriptions de push por usuário/dispositivo (chave = endpoint da subscription)
    `CREATE TABLE IF NOT EXISTS "pushSubscriptions" (
      "id" serial PRIMARY KEY NOT NULL,
      "userId" integer NOT NULL,
      "companyId" integer,
      "endpoint" text NOT NULL,
      "p256dh" text NOT NULL,
      "auth" text NOT NULL,
      "createdAt" timestamptz DEFAULT NOW(),
      CONSTRAINT "pushSubscriptions_endpoint_unique" UNIQUE("endpoint")
    )`,
    `CREATE INDEX IF NOT EXISTS "idx_pushSubs_userId" ON "pushSubscriptions"("userId")`,
    // Configuração de alerta de saldo por empresa (threshold em centavos BRL)
    `CREATE TABLE IF NOT EXISTS "balanceAlerts" (
      "id" serial PRIMARY KEY NOT NULL,
      "companyId" integer NOT NULL,
      "thresholdCents" integer NOT NULL DEFAULT 10000,
      "enabled" boolean NOT NULL DEFAULT TRUE,
      "lastNotifiedAt" timestamptz,
      "createdAt" timestamptz DEFAULT NOW(),
      "updatedAt" timestamptz DEFAULT NOW(),
      CONSTRAINT "balanceAlerts_companyId_unique" UNIQUE("companyId")
    )`,
  ];
  try {
    for (const sql of statements) {
      await pool.query(sql);
    }
    migratedOnce = true;
    console.log("[Database] Tables verified/created successfully.");
  } catch (err: any) {
    console.error("[Database] Failed to ensure tables:", err?.message || err);
  }
}

async function getDb() {
  if (!databaseUrl) {
    console.warn(`[Database] DATABASE_URL is missing! Env keys found: ${Object.keys(process.env).filter(k => !k.includes('TOKEN') && !k.includes('SECRET')).join(', ')}`);
    return undefined;
  }

  if (dbInstance) return dbInstance;

  try {
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }, // Required for Supabase
      max: 1,                             // Serverless: 1 connection per invocation
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });
    rawPool = pool;
    dbInstance = drizzle(pool, { schema });
    // Garante que as tabelas existem na primeira conexão
    await ensureTables(pool);
    return dbInstance;
  } catch (err) {
    console.error("[Database] Failed to connect:", err);
    return undefined;
  }
}

/** Exporta o pool raw para queries customizadas */
export async function getRawPool() {
  const db = await getDb(); // Garante inicialização
  return rawPool;
}

// User queries
export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const values: any = { ...user };
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  
  try {
    // PostgreSQL ON CONFLICT (upsert)
    await db.insert(users).values(values).onConflictDoUpdate({
      target: [users.openId],
      set: values
    });
  } catch (err) {
    console.error("[Database] Error in upsertUser:", err);
    throw err; // Re-throw to be caught by the router
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

// Company queries
export async function createCompany(userId: number, name: string, description?: string): Promise<Company> {
  const db = await getDb();
  const [result] = await db.insert(companies).values({ userId, name, description }).returning();
  return result;
}

export async function getCompaniesByUserId(userId: number) {
  const db = await getDb();
  return db.select().from(companies).where(eq(companies.userId, userId));
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  const [result] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result;
}

// ─── Webhook events / health ────────────────────────────────────────────────
/** Registra cada chamada de webhook recebida (sucesso ou erro) e atualiza o health check */
export async function logWebhookEvent(e: {
  companyId: number | null;
  platform: string;
  success: boolean;
  saleId?: number | null;
  trackingFound?: boolean;
  message?: string | null;
  payloadSummary?: string | null;
}) {
  const pool = await getRawPool();
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO "webhookEvents"
        ("companyId", "platform", "success", "saleId", "trackingFound", "message", "payloadSummary")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        e.companyId ?? null,
        e.platform,
        e.success,
        e.saleId ?? null,
        e.trackingFound ?? false,
        e.message ?? null,
        e.payloadSummary ?? null,
      ]
    );
    if (e.companyId && e.success) {
      await pool.query(
        `UPDATE "webhookConfigs" SET "lastHealthCheck" = NOW(), "updatedAt" = NOW()
         WHERE "companyId" = $1 AND "platform" = $2`,
        [e.companyId, e.platform]
      );
    }
  } catch (err: any) {
    console.error("[Webhook] logWebhookEvent falhou:", err?.message || err);
  }
}

/** Eventos recentes de webhook de uma empresa (para status na UI) */
export async function getRecentWebhookEvents(companyId: number, limit = 20) {
  const pool = await getRawPool();
  if (!pool) return [];
  const r = await pool.query(
    `SELECT * FROM "webhookEvents" WHERE "companyId" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
    [companyId, limit]
  );
  return r.rows;
}

export async function updateCompany(id: number, name: string, description?: string) {
  const db = await getDb();
  const [result] = await db.update(companies).set({ name, description }).where(eq(companies.id, id)).returning();
  return result;
}

export async function deleteCompany(id: number) {
  const db = await getDb();
  await db.delete(companies).where(eq(companies.id, id));
}

export async function updateCompanyMeta(
  id: number,
  metaAdAccountId: string | null,
  metaAccessToken: string | null
) {
  const db = await getDb();
  const [result] = await db
    .update(companies)
    .set({ metaAdAccountId, metaAccessToken })
    .where(eq(companies.id, id))
    .returning();
  return result;
}

export async function updateCompanyMetaOAuth(
  id: number,
  metaAccessToken: string,
  metaTokenExpiresAt: Date,
  metaAdAccountId: string | null
) {
  const db = await getDb();
  const [result] = await db
    .update(companies)
    .set({ metaAccessToken, metaTokenExpiresAt, ...(metaAdAccountId ? { metaAdAccountId } : {}) })
    .where(eq(companies.id, id))
    .returning();
  return result;
}

/**
 * Reconexão "1 clique": atualiza o token de TODAS as empresas do usuário cujo
 * metaAdAccountId esteja na lista de contas que o novo token consegue acessar.
 * Como todas as contas vêm do mesmo login Meta, uma única autorização refresca
 * todas as contas expiradas de uma vez. Retorna quantas empresas foram atualizadas.
 */
export async function refreshUserCompaniesToken(
  userId: number,
  accessToken: string,
  metaTokenExpiresAt: Date,
  adAccountIds: string[]
): Promise<number> {
  const pool = await getRawPool();
  if (!pool || adAccountIds.length === 0) return 0;
  // normaliza para garantir o prefixo act_ (a Meta retorna com act_)
  const ids = adAccountIds.map((id) => (id.startsWith("act_") ? id : `act_${id}`));
  const r = await pool.query(
    `UPDATE "companies"
       SET "metaAccessToken" = $1, "metaTokenExpiresAt" = $2, "updatedAt" = NOW()
     WHERE "userId" = $3 AND "metaAdAccountId" = ANY($4::text[])`,
    [accessToken, metaTokenExpiresAt, userId, ids]
  );
  return r.rowCount ?? 0;
}

export async function disconnectCompanyMeta(id: number) {
  const db = await getDb();
  const [result] = await db
    .update(companies)
    .set({ metaAccessToken: null, metaAdAccountId: null, metaTokenExpiresAt: null })
    .where(eq(companies.id, id))
    .returning();
  return result;
}

// Report queries
export async function createReport(
  companyId: number,
  userId: number,
  title: string,
  slug: string,
  startDate: Date,
  endDate: Date,
  description?: string
): Promise<Report> {
  const db = await getDb();
  const [result] = await db.insert(reports).values({
    companyId,
    userId,
    title,
    slug,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    description,
  }).returning();
  return result;
}

export async function getReportsByCompanyId(companyId: number) {
  const db = await getDb();
  // Inclui métricas via LEFT JOIN para que o diagnóstico estratégico funcione na listagem
  const rows = await db
    .select({ report: reports, metrics: reportMetrics })
    .from(reports)
    .leftJoin(reportMetrics, eq(reportMetrics.reportId, reports.id))
    .where(eq(reports.companyId, companyId))
    .orderBy(desc(reports.createdAt));
  return rows.map(row => ({ ...row.report, metrics: row.metrics ?? null }));
}

export async function getReportsWithMetricsByUserId(userId: number) {
  const db = await getDb();
  const rows = await db
    .select({ report: reports, metrics: reportMetrics })
    .from(reports)
    .leftJoin(reportMetrics, eq(reportMetrics.reportId, reports.id))
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.createdAt));
  return rows.map(row => ({ ...row.report, metrics: row.metrics ?? null }));
}

export async function getReportById(id: number) {
  const db = await getDb();
  const [result] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return result;
}

export async function getReportBySlug(slug: string) {
  const db = await getDb();
  const [result] = await db.select().from(reports).where(eq(reports.slug, slug)).limit(1);
  return result;
}

export async function updateReport(
  id: number,
  title: string,
  slug: string,
  startDate: Date | string,
  endDate: Date | string,
  description?: string,
  isPublished: string = "draft"
) {
  const toDateStr = (d: Date | string): string =>
    d instanceof Date ? d.toISOString().split("T")[0] : String(d).split("T")[0];

  const db = await getDb();
  const [result] = await db.update(reports).set({
    title,
    slug,
    startDate: toDateStr(startDate),
    endDate: toDateStr(endDate),
    description,
    isPublished,
  }).where(eq(reports.id, id)).returning();
  return result;
}

export async function deleteReport(id: number) {
  const db = await getDb();
  await db.delete(reports).where(eq(reports.id, id));
}

export async function updateReportAiAnalysis(id: number, aiAnalysis: string | null) {
  const db = await getDb();
  await db.update(reports).set({ aiAnalysis: aiAnalysis as any }).where(eq(reports.id, id));
}

/**
 * Soma das vendas rastreadas (trackedSales) de uma empresa em um período.
 * Usado para mostrar receita/ROAS REAIS no relatório do cliente.
 */
export async function getTrackedSalesSummary(
  companyId: number,
  startDate: string,
  endDate: string
): Promise<{ revenue: number; count: number }> {
  const pool = await getRawPool();
  if (!pool) return { revenue: 0, count: 0 };
  const result = await pool.query(
    `SELECT COUNT(*) AS count, COALESCE(SUM("orderValue"), 0) AS revenue
     FROM "trackedSales"
     WHERE "companyId" = $1 AND "saleDate"::date BETWEEN $2 AND $3`,
    [companyId, startDate, endDate]
  );
  return {
    revenue: parseFloat(result.rows[0]?.revenue || "0"),
    count: parseInt(result.rows[0]?.count || "0"),
  };
}

/**
 * Lista detalhada das vendas rastreadas de uma empresa no período do relatório.
 * Usado para mostrar a tabela de vendas (data, cliente, valor) no relatório do cliente.
 */
export async function getTrackedSalesList(
  companyId: number,
  startDate: string,
  endDate: string
): Promise<Array<{ saleDate: string; customerName: string | null; customerPhone: string | null; utmCampaign: string | null; orderValue: number; source: string }>> {
  const pool = await getRawPool();
  if (!pool) return [];
  const result = await pool.query(
    `SELECT "saleDate", "customerName", "customerPhone", "utmCampaign", "orderValue", "source"
     FROM "trackedSales"
     WHERE "companyId" = $1 AND "saleDate"::date BETWEEN $2 AND $3
     ORDER BY "saleDate" ASC
     LIMIT 200`,
    [companyId, startDate, endDate]
  );
  return result.rows.map((r: any) => ({
    saleDate: r.saleDate,
    customerName: r.customerName ?? null,
    customerPhone: r.customerPhone ?? null,
    utmCampaign: r.utmCampaign ?? null,
    orderValue: parseFloat(r.orderValue || "0"),
    source: r.source ?? "manual",
  }));
}

// Metrics queries
export async function getMetricsByReportId(reportId: number) {
  const db = await getDb();
  const [result] = await db.select().from(reportMetrics).where(eq(reportMetrics.reportId, reportId)).limit(1);
  return result;
}

export async function createReportMetrics(reportId: number, metrics: Omit<InsertReportMetrics, "reportId">) {
  const db = await getDb();
  const [result] = await db.insert(reportMetrics).values({ ...metrics, reportId }).returning();
  return result;
}

export async function updateReportMetrics(reportId: number, metrics: Omit<InsertReportMetrics, "reportId">) {
  const db = await getDb();
  const [result] = await db.update(reportMetrics).set(metrics).where(eq(reportMetrics.reportId, reportId)).returning();
  return result;
}

export async function deleteReportMetrics(reportId: number) {
  const db = await getDb();
  await db.delete(reportMetrics).where(eq(reportMetrics.reportId, reportId));
}

// ─── WhatsApp Cloud API ──────────────────────────────────────────────────────

/** Busca a config (e empresa) pelo phoneNumberId que veio no webhook da Meta */
export async function getWhatsappConfigByPhoneNumberId(phoneNumberId: string) {
  const pool = await getRawPool();
  if (!pool) return null;
  const r = await pool.query(
    `SELECT * FROM "whatsappConfigs" WHERE "phoneNumberId" = $1 LIMIT 1`,
    [phoneNumberId]
  );
  return r.rows[0] ?? null;
}

/** Confere se algum verifyToken cadastrado bate (para o GET de verificação do webhook) */
export async function whatsappVerifyTokenMatches(token: string): Promise<boolean> {
  const pool = await getRawPool();
  if (!pool) return false;
  const r = await pool.query(
    `SELECT 1 FROM "whatsappConfigs" WHERE "verifyToken" = $1 LIMIT 1`,
    [token]
  );
  return r.rows.length > 0;
}

/** Salva/atualiza a config de WhatsApp de uma empresa (chave = phoneNumberId) */
export async function upsertWhatsappConfig(cfg: {
  companyId: number;
  userId: number;
  phoneNumberId: string;
  wabaId?: string | null;
  displayPhone?: string | null;
  accessToken?: string | null;
  verifyToken?: string | null;
}) {
  const pool = await getRawPool();
  if (!pool) return null;
  const r = await pool.query(
    `INSERT INTO "whatsappConfigs"
       ("companyId", "userId", "phoneNumberId", "wabaId", "displayPhone", "accessToken", "verifyToken")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT ("phoneNumberId") DO UPDATE SET
       "companyId" = EXCLUDED."companyId",
       "wabaId" = EXCLUDED."wabaId",
       "displayPhone" = EXCLUDED."displayPhone",
       "accessToken" = COALESCE(EXCLUDED."accessToken", "whatsappConfigs"."accessToken"),
       "verifyToken" = EXCLUDED."verifyToken",
       "updatedAt" = NOW()
     RETURNING *`,
    [cfg.companyId, cfg.userId, cfg.phoneNumberId, cfg.wabaId ?? null,
     cfg.displayPhone ?? null, cfg.accessToken ?? null, cfg.verifyToken ?? null]
  );
  return r.rows[0] ?? null;
}

export async function getWhatsappConfigByCompany(companyId: number) {
  const pool = await getRawPool();
  if (!pool) return null;
  const r = await pool.query(
    `SELECT * FROM "whatsappConfigs" WHERE "companyId" = $1 ORDER BY "updatedAt" DESC LIMIT 1`,
    [companyId]
  );
  return r.rows[0] ?? null;
}

/**
 * Registra/atualiza uma conversa de WhatsApp.
 * Idempotente por (companyId, waId): a 1ª mensagem cria; as seguintes só
 * atualizam o último contato/contador. A atribuição (campanha via CTWA) só é
 * gravada quando vem no referral e ainda não havia atribuição.
 */
export async function upsertWhatsappConversation(c: {
  companyId: number;
  waId: string;
  customerName?: string | null;
  sourceType?: string;
  campaignName?: string | null;
  adId?: string | null;
  adHeadline?: string | null;
  ctwaClid?: string | null;
  sourceUrl?: string | null;
  lastMessageText?: string | null;
  messageTime?: Date | null;
}) {
  const pool = await getRawPool();
  if (!pool) return null;
  const when = c.messageTime ?? new Date();
  const r = await pool.query(
    `INSERT INTO "whatsappConversations"
       ("companyId", "waId", "customerName", "sourceType", "campaignName", "adId",
        "adHeadline", "ctwaClid", "sourceUrl", "firstMessageAt", "lastMessageAt",
        "lastMessageText", "messageCount")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $11, 1)
     ON CONFLICT ("companyId", "waId") DO UPDATE SET
       "customerName"   = COALESCE("whatsappConversations"."customerName", EXCLUDED."customerName"),
       "lastMessageAt"  = EXCLUDED."lastMessageAt",
       "lastMessageText"= EXCLUDED."lastMessageText",
       "messageCount"   = "whatsappConversations"."messageCount" + 1,
       -- só preenche atribuição se ainda não houver e veio referral agora
       "sourceType"  = CASE WHEN "whatsappConversations"."campaignName" IS NULL AND EXCLUDED."campaignName" IS NOT NULL THEN EXCLUDED."sourceType" ELSE "whatsappConversations"."sourceType" END,
       "campaignName"= COALESCE("whatsappConversations"."campaignName", EXCLUDED."campaignName"),
       "adId"        = COALESCE("whatsappConversations"."adId", EXCLUDED."adId"),
       "adHeadline"  = COALESCE("whatsappConversations"."adHeadline", EXCLUDED."adHeadline"),
       "ctwaClid"    = COALESCE("whatsappConversations"."ctwaClid", EXCLUDED."ctwaClid"),
       "sourceUrl"   = COALESCE("whatsappConversations"."sourceUrl", EXCLUDED."sourceUrl"),
       "updatedAt"   = NOW()
     RETURNING *`,
    [
      c.companyId, c.waId, c.customerName ?? null,
      c.campaignName ? (c.sourceType ?? "ctwa") : (c.sourceType ?? "organic"),
      c.campaignName ?? null, c.adId ?? null, c.adHeadline ?? null,
      c.ctwaClid ?? null, c.sourceUrl ?? null, when, c.lastMessageText ?? null,
    ]
  );
  return r.rows[0] ?? null;
}

/** Lista as conversas de WhatsApp de uma empresa (mais recentes primeiro) */
export async function listWhatsappConversations(companyId: number, limit = 200) {
  const pool = await getRawPool();
  if (!pool) return [];
  const r = await pool.query(
    `SELECT * FROM "whatsappConversations" WHERE "companyId" = $1 ORDER BY "lastMessageAt" DESC LIMIT $2`,
    [companyId, limit]
  );
  return r.rows;
}

/** Salva uma mensagem individual recebida via webhook */
export async function saveWhatsappMessage(m: {
  conversationId?: number | null;
  companyId: number;
  waId: string;
  wamid?: string | null;
  direction?: string;
  type?: string;
  text?: string | null;
  timestamp: Date;
}) {
  const pool = await getRawPool();
  if (!pool) return null;
  const r = await pool.query(
    `INSERT INTO "whatsappMessages"
       ("conversationId","companyId","waId","wamid","direction","type","text","timestamp")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT ("wamid") DO NOTHING
     RETURNING *`,
    [
      m.conversationId ?? null,
      m.companyId,
      m.waId,
      m.wamid ?? null,
      m.direction ?? "inbound",
      m.type ?? "text",
      m.text ?? null,
      m.timestamp,
    ]
  );
  return r.rows[0] ?? null;
}

/** Lista mensagens de uma conversa (mais antigas primeiro) */
export async function listWhatsappMessages(companyId: number, waId: string, limit = 100) {
  const pool = await getRawPool();
  if (!pool) return [];
  const r = await pool.query(
    `SELECT * FROM "whatsappMessages"
     WHERE "companyId" = $1 AND "waId" = $2
     ORDER BY "timestamp" ASC LIMIT $3`,
    [companyId, waId, limit]
  );
  return r.rows;
}

export async function deleteWhatsappConfig(companyId: number) {
  const pool = await getRawPool();
  if (!pool) return;
  await pool.query(`DELETE FROM "whatsappConfigs" WHERE "companyId" = $1`, [companyId]);
}

// ─── PWA Push Subscriptions ──────────────────────────────────────────────────

/** Salva/atualiza a subscription de push de um dispositivo (chave = endpoint) */
export async function upsertPushSubscription(
  userId: number,
  endpoint: string,
  p256dh: string,
  auth: string,
  companyId?: number | null
) {
  const pool = await getRawPool();
  if (!pool) return;
  await pool.query(
    `INSERT INTO "pushSubscriptions" ("userId", "companyId", "endpoint", "p256dh", "auth")
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT ("endpoint") DO UPDATE SET
       "userId" = EXCLUDED."userId",
       "companyId" = EXCLUDED."companyId",
       "p256dh" = EXCLUDED."p256dh",
       "auth" = EXCLUDED."auth"`,
    [userId, companyId ?? null, endpoint, p256dh, auth]
  );
}

/** Remove uma subscription de push (quando o usuário desativa ou o endpoint expira) */
export async function deletePushSubscription(endpoint: string) {
  const pool = await getRawPool();
  if (!pool) return;
  await pool.query(`DELETE FROM "pushSubscriptions" WHERE "endpoint" = $1`, [endpoint]);
}

/** Retorna todas as subscriptions de push de um usuário (vários dispositivos) */
export async function getPushSubscriptionsByUser(userId: number) {
  const pool = await getRawPool();
  if (!pool) return [];
  const r = await pool.query(
    `SELECT "endpoint", "p256dh", "auth" FROM "pushSubscriptions" WHERE "userId" = $1`,
    [userId]
  );
  return r.rows as Array<{ endpoint: string; p256dh: string; auth: string }>;
}

// ─── Balance Alerts ──────────────────────────────────────────────────────────

/** Salva/atualiza a configuração de alerta de saldo de uma empresa */
export async function upsertBalanceAlert(
  companyId: number,
  thresholdCents: number,
  enabled: boolean
) {
  const pool = await getRawPool();
  if (!pool) return;
  await pool.query(
    `INSERT INTO "balanceAlerts" ("companyId", "thresholdCents", "enabled")
     VALUES ($1, $2, $3)
     ON CONFLICT ("companyId") DO UPDATE SET
       "thresholdCents" = EXCLUDED."thresholdCents",
       "enabled" = EXCLUDED."enabled",
       "updatedAt" = NOW()`,
    [companyId, thresholdCents, enabled]
  );
}

/** Retorna a configuração de alerta de saldo de uma empresa */
export async function getBalanceAlert(companyId: number) {
  const pool = await getRawPool();
  if (!pool) return null;
  const r = await pool.query(
    `SELECT * FROM "balanceAlerts" WHERE "companyId" = $1 LIMIT 1`,
    [companyId]
  );
  return r.rows[0] ?? null;
}

/**
 * Retorna todas as empresas com alerta de saldo ativo, incluindo as credenciais Meta
 * necessárias para consultar o saldo. Usado pelo cron diário.
 */
export async function getAllEnabledBalanceAlerts() {
  const pool = await getRawPool();
  if (!pool) return [];
  const r = await pool.query(
    `SELECT
       ba."companyId",
       ba."thresholdCents",
       ba."lastNotifiedAt",
       c."userId",
       c."name" AS "companyName",
       c."metaAdAccountId",
       c."metaAccessToken"
     FROM "balanceAlerts" ba
     JOIN "companies" c ON c."id" = ba."companyId"
     WHERE ba."enabled" = TRUE
       AND c."metaAdAccountId" IS NOT NULL
       AND c."metaAccessToken" IS NOT NULL`
  );
  return r.rows as Array<{
    companyId: number;
    thresholdCents: number;
    lastNotifiedAt: Date | null;
    userId: number;
    companyName: string;
    metaAdAccountId: string;
    metaAccessToken: string;
  }>;
}

/** Atualiza lastNotifiedAt para agora (evita spam: só notifica 1x/dia) */
export async function setBalanceAlertNotified(companyId: number) {
  const pool = await getRawPool();
  if (!pool) return;
  await pool.query(
    `UPDATE "balanceAlerts" SET "lastNotifiedAt" = NOW(), "updatedAt" = NOW() WHERE "companyId" = $1`,
    [companyId]
  );
}

/**
 * Tenta atribuir uma venda a uma conversa pelo telefone (waId).
 * Marca a conversa como 'converted' e devolve a campanha de origem (se houver),
 * para a venda herdar a atribuição.
 */
export async function attributeSaleToConversation(
  companyId: number,
  phone: string,
  saleId: number
): Promise<{ campaignName: string | null } | null> {
  const pool = await getRawPool();
  if (!pool || !phone) return null;
  // normaliza só dígitos para casar telefones com formatações diferentes
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const r = await pool.query(
    `UPDATE "whatsappConversations"
       SET "status" = 'converted', "saleId" = $3, "updatedAt" = NOW()
     WHERE "companyId" = $1
       AND regexp_replace("waId", '\\D', '', 'g') LIKE '%' || $2
     RETURNING "campaignName"`,
    [companyId, digits.slice(-8), saleId]
  );
  if (r.rows.length === 0) return null;
  return { campaignName: r.rows[0].campaignName ?? null };
}
