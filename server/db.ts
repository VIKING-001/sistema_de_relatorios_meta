import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../drizzle/schema";
import { users, companies, reports, reportMetrics } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { ENV } from "./_core/env";
import type { User, InsertUser, Company, Report, ReportMetrics, InsertReportMetrics } from "../drizzle/schema";

let dbInstance: any;

const databaseUrl = ENV.databaseUrl || process.env.DATABASE_URL;

async function getDb() {
  if (!databaseUrl) {
    console.warn("[Database] DATABASE_URL is missing! Please configure it in Vercel/env.");
    return undefined;
  }

  if (dbInstance) return dbInstance;

  try {
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false } // Required for Supabase in many environments
    });
    dbInstance = drizzle(pool, { schema });
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
  
  // PostgreSQL ON CONFLICT (upsert)
  await db.insert(users).values(values).onConflictDoUpdate({
    target: [users.openId],
    set: values
  });
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
  startDate: Date,
  endDate: Date,
  description?: string,
  isPublished: string = "draft"
) {
  const db = await getDb();
  const [result] = await db.update(reports).set({
    title,
    slug,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
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
