import { integer, pgEnum, pgTable, text, timestamp, varchar, decimal, date, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  /** Internal unique identifier (UUID-based). */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  /** Bcrypt hash of the user's password. */
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: text("role").default("user").notNull(), // PG handles enums differently, text is safer for migration
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Empresas/Clientes
 */
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  /** Meta Ads: ID da conta de anúncios (ex: act_1234567890) */
  metaAdAccountId: varchar("metaAdAccountId", { length: 64 }),
  /** Meta Ads: Access Token (long-lived, 60 dias) */
  metaAccessToken: text("metaAccessToken"),
  /** Meta Ads: Data de expiração do token */
  metaTokenExpiresAt: timestamp("metaTokenExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * Relatórios de campanhas Meta
 */
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  isPublished: text("isPublished").default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Métricas de campanhas Meta
 */
export const reportMetrics = pgTable("reportMetrics", {
  id: serial("id").primaryKey(),
  reportId: integer("reportId").notNull(),
  instagramReach: integer("instagramReach").notNull().default(0),
  totalReach: integer("totalReach").notNull().default(0),
  totalImpressions: integer("totalImpressions").notNull().default(0),
  instagramProfileVisits: integer("instagramProfileVisits").notNull().default(0),
  newInstagramFollowers: integer("newInstagramFollowers").notNull().default(0),
  messagesInitiated: integer("messagesInitiated").notNull().default(0),
  totalSpent: decimal("totalSpent", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalClicks: integer("totalClicks").notNull().default(0),
  costPerClick: decimal("costPerClick", { precision: 10, scale: 2 }).notNull().default("0.00"),
  videoRetentionRate: decimal("videoRetentionRate", { precision: 5, scale: 2 }).notNull().default("0.00"),
  profileVisitsThroughCampaigns: integer("profileVisitsThroughCampaigns").notNull().default(0),
  costPerProfileVisit: decimal("costPerProfileVisit", { precision: 10, scale: 2 }).notNull().default("0.00"),
  cpm: decimal("cpm", { precision: 10, scale: 2 }).notNull().default("0.00"),
  ctr: decimal("ctr", { precision: 5, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ReportMetrics = typeof reportMetrics.$inferSelect;
export type InsertReportMetrics = typeof reportMetrics.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  companies: many(companies),
  reports: many(reports),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(users, {
    fields: [companies.userId],
    references: [users.id],
  }),
  reports: many(reports),
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
  company: one(companies, {
    fields: [reports.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  metrics: many(reportMetrics),
}));

export const reportMetricsRelations = relations(reportMetrics, ({ one }) => ({
  report: one(reports, {
    fields: [reportMetrics.reportId],
    references: [reports.id],
  }),
}));
