import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../drizzle/schema";
import { users, companies, reports, reportMetrics } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { ENV } from "./_core/env";
import type { User, InsertUser, Company, Report, ReportMetrics, InsertReportMetrics } from "../drizzle/schema";

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
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL
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
  return db.select().from(reports).where(eq(reports.companyId, companyId)).orderBy(desc(reports.createdAt));
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
