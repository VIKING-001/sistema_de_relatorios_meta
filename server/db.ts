import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import { InsertUser, users, companies, reports, reportMetrics, Company, Report, ReportMetrics } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL, { schema });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Company queries
export async function createCompany(userId: number, name: string, description?: string): Promise<Company> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(companies).values({
    userId,
    name,
    description,
  });

  const inserted = await db.select().from(companies).where(eq(companies.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getCompaniesByUserId(userId: number): Promise<Company[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(companies).where(eq(companies.userId, userId));
}

export async function getCompanyById(id: number): Promise<Company | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCompany(id: number, name: string, description?: string): Promise<Company> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(companies).set({
    name,
    description,
    updatedAt: new Date(),
  }).where(eq(companies.id, id));

  const updated = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return updated[0]!;
}

export async function deleteCompany(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

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
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reports).values({
    companyId,
    userId,
    title,
    slug,
    description,
    startDate,
    endDate,
    isPublished: "draft",
  });

  const inserted = await db.select().from(reports).where(eq(reports.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getReportsByCompanyId(companyId: number): Promise<(Report & { metrics: ReportMetrics[] })[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.query.reports.findMany({
    where: eq(reports.companyId, companyId),
    with: {
      metrics: true
    },
    orderBy: (reports, { desc }) => [desc(reports.createdAt)]
  }) as Promise<(Report & { metrics: ReportMetrics[] })[]>;
}

export async function getReportById(id: number): Promise<Report | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getReportBySlug(slug: string): Promise<Report | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(reports).where(eq(reports.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateReport(
  id: number,
  title: string,
  slug: string,
  startDate: Date,
  endDate: Date,
  description?: string,
  isPublished?: "draft" | "published"
): Promise<Report> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(reports).set({
    title,
    slug,
    description,
    startDate,
    endDate,
    isPublished,
    updatedAt: new Date(),
  }).where(eq(reports.id, id));

  const updated = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return updated[0]!;
}

export async function deleteReport(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(reports).where(eq(reports.id, id));
}

// Report Metrics queries
export async function createReportMetrics(reportId: number, metrics: Partial<ReportMetrics>): Promise<ReportMetrics> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reportMetrics).values({
    reportId,
    ...metrics,
  });

  const inserted = await db.select().from(reportMetrics).where(eq(reportMetrics.id, Number(result[0].insertId))).limit(1);
  return inserted[0]!;
}

export async function getMetricsByReportId(reportId: number): Promise<ReportMetrics | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(reportMetrics).where(eq(reportMetrics.reportId, reportId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateReportMetrics(reportId: number, metrics: Partial<ReportMetrics>): Promise<ReportMetrics> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(reportMetrics).set({
    ...metrics,
    updatedAt: new Date(),
  }).where(eq(reportMetrics.reportId, reportId));

  const updated = await db.select().from(reportMetrics).where(eq(reportMetrics.reportId, reportId)).limit(1);
  return updated[0]!;
}

export async function deleteReportMetrics(reportId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(reportMetrics).where(eq(reportMetrics.reportId, reportId));
}
